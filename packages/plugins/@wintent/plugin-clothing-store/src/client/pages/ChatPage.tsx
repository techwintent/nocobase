import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAPIClient } from '@nocobase/client';
import { Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { ChatLayout } from '../chat/ChatLayout';
import { MessageList } from '../chat/MessageList';
import { ChatInput } from '../chat/ChatInput';
import { QuickActions } from '../chat/QuickActions';
import { SessionSidebar } from '../chat/SessionSidebar';
import { useChatStore, AI_EMPLOYEE_USERNAME, ConversationSummary, ChatMessage } from '../chat/useChatStore';

const STORAGE_KEY = 'clothing-chat-last-session';

/** Generate a simple unique ID */
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const ChatPage: React.FC = () => {
  const api = useAPIClient();
  const [isDesktop, setIsDesktop] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const {
    messages,
    addMessage,
    updateLastMessage,
    setMessages,
    clearMessages,
    sessionId,
    setSessionId,
    conversations,
    setConversations,
    currentSessionTitle,
    setCurrentSessionTitle,
    sessionsLoading,
    setSessionsLoading,
    responseLoading,
    setResponseLoading,
    sidebarVisible,
    setSidebarVisible,
    abortController,
    setAbortController,
    model,
    setModel,
  } = useChatStore();

  // ─── Load conversation list ───
  const loadSessionList = useCallback(async (): Promise<ConversationSummary[]> => {
    setSessionsLoading(true);
    try {
      const res = await api.resource('aiConversations').list({
        sort: ['-updatedAt'],
        pageSize: 50,
      });
      const list: ConversationSummary[] = (res?.data?.data ?? []).map((c: any) => ({
        sessionId: c.sessionId,
        title: c.title || null,
        updatedAt: c.updatedAt,
      }));
      setConversations(list);
      return list;
    } catch (err) {
      console.error('[ChatPage] Failed to load conversations:', err);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, [api, setConversations, setSessionsLoading]);

  // ─── Load messages for a session ───
  const loadSessionMessages = useCallback(
    async (targetSessionId: string) => {
      clearMessages();
      setSessionId(targetSessionId);
      localStorage.setItem(STORAGE_KEY, targetSessionId);
      try {
        const res = await api.resource('aiConversations').getMessages({
          sessionId: targetSessionId,
          paginate: 'false',
        });
        const responseData = res?.data?.data;
        const rows = Array.isArray(responseData) ? responseData : (responseData?.rows ?? []);
        console.log('[ChatPage] getMessages raw count:', rows.length);
        rows.forEach((m: any, i: number) => {
          console.log(`[ChatPage] row[${i}]`, { role: m.role, key: m.key, content: m.content });
        });
        const chronological = [...rows].reverse();
        const chatMessages: ChatMessage[] = chronological
          .map((m: any) => {
            // Extract text from various possible content formats
            let text = '';
            const c = m.content;
            if (typeof c === 'string') {
              text = c;
            } else if (c) {
              if (typeof c.content === 'string') {
                text = c.content;
              } else if (typeof c.text === 'string') {
                text = c.text;
              }
            }
            // role is 'user' for user messages, AI employee username for assistant messages
            const isUser = m.role === 'user';
            return {
              key: String(m.key || m.messageId || uid()),
              role: isUser ? ('user' as const) : ('assistant' as const),
              content: text,
            };
          })
          .filter((m) => m.content.length > 0); // Skip empty messages (tool-call-only)
        console.log('[ChatPage] Parsed messages:', chatMessages.length);
        setMessages(chatMessages);
      } catch (err) {
        console.error('[ChatPage] Failed to load messages:', err);
      }
    },
    [api, clearMessages, setSessionId, setMessages],
  );

  // ─── Initialize: fetch model + session list + restore last session ───
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      // 1. Fetch LLM model
      if (!model) {
        try {
          const res = await api.request({ url: 'ai:listAllEnabledModels', method: 'GET' });
          const services = res?.data?.data;
          if (Array.isArray(services) && services.length > 0) {
            const svc = services[0];
            const m = svc.enabledModels?.[0];
            if (svc.llmService && m?.value) {
              setModel({ llmService: svc.llmService, model: m.value });
            }
          }
        } catch (err) {
          console.error('[ChatPage] Failed to fetch LLM models:', err);
        }
      }

      // 2. Load conversation list
      const list = await loadSessionList();
      console.log('[ChatPage] Loaded conversations:', list.length);

      // 3. Restore last session or load the most recent one
      const savedId = localStorage.getItem(STORAGE_KEY);
      const targetConv = savedId
        ? list.find((c) => c.sessionId === savedId)
        : list[0]; // fallback: most recent conversation

      if (targetConv) {
        console.log('[ChatPage] Restoring session:', targetConv.sessionId, targetConv.title);
        setCurrentSessionTitle(targetConv.title);
        await loadSessionMessages(targetConv.sessionId);
        return;
      }

      // No conversations at all — show empty new-chat state
      clearMessages();
      setSessionId(null);
      setCurrentSessionTitle(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Process SSE stream response ───
  const processStreamResponse = useCallback(
    async (stream: ReadableStream) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let hasError = false;
      let errorMessage = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || hasError) {
            setResponseLoading(false);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace(/^data: /, ''));

              if (data.type === 'content' && data.body && typeof data.body === 'string') {
                updateLastMessage((last) => ({
                  ...last,
                  content: last.content + data.body,
                  loading: false,
                }));
              }

              if (data.type === 'new_message') {
                addMessage({ key: uid(), role: 'assistant', content: '', loading: true });
              }

              if (data.type === 'error') {
                hasError = true;
                errorMessage = data.body || '请求失败';
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          hasError = true;
          errorMessage = err.message || '连接中断';
        }
      }

      if (hasError) {
        updateLastMessage((last) => ({
          ...last,
          role: 'error',
          content: errorMessage,
          loading: false,
        }));
      }
    },
    [addMessage, updateLastMessage, setResponseLoading],
  );

  // ─── Send message ───
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      addMessage({ key: uid(), role: 'user', content: text });

      let currentSessionId = sessionId;

      // Create conversation if needed
      if (!currentSessionId) {
        try {
          const createRes = await api.resource('aiConversations').create({
            values: { aiEmployee: { username: AI_EMPLOYEE_USERNAME } },
          });
          const conversation = createRes?.data?.data;
          if (!conversation) return;
          currentSessionId = conversation.sessionId;
          setSessionId(currentSessionId);
          localStorage.setItem(STORAGE_KEY, currentSessionId!);
          // Refresh session list in background
          loadSessionList();
        } catch (err: any) {
          addMessage({ key: uid(), role: 'error', content: '创建会话失败: ' + (err.message || '未知错误') });
          return;
        }
      }

      // Add loading assistant message
      setResponseLoading(true);
      addMessage({ key: uid(), role: 'assistant', content: '', loading: true });

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const sendRes = await api.request({
          url: 'aiConversations:sendMessages',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: {
            aiEmployee: AI_EMPLOYEE_USERNAME,
            sessionId: currentSessionId,
            messages: [
              { key: uid(), role: 'user', content: { type: 'text', content: text } },
            ],
            model,
          },
          responseType: 'stream',
          adapter: 'fetch',
          signal: controller.signal,
        });

        if (!sendRes?.data) {
          setResponseLoading(false);
          return;
        }

        await processStreamResponse(sendRes.data);

        // After streaming completes, refresh session list to update title
        loadSessionList();
      } catch (err: any) {
        if (err.name === 'CanceledError') return;
        setResponseLoading(false);
        updateLastMessage((last) => ({
          ...last,
          role: 'error',
          content: '发送失败: ' + (err.message || '未知错误'),
          loading: false,
        }));
      } finally {
        setAbortController(null);
      }
    },
    [
      sessionId,
      api,
      model,
      addMessage,
      updateLastMessage,
      setSessionId,
      setResponseLoading,
      setAbortController,
      processStreamResponse,
      loadSessionList,
    ],
  );

  // ─── Stop streaming ───
  const handleStop = useCallback(async () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    if (sessionId) {
      try {
        await api.resource('aiConversations').abort({ values: { sessionId } });
      } catch {
        // Ignore
      }
    }
    setResponseLoading(false);
    updateLastMessage((last) => ({ ...last, loading: false }));
  }, [abortController, sessionId, api, setAbortController, setResponseLoading, updateLastMessage]);

  // ─── New session ───
  const handleNewSession = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setResponseLoading(false);
    }
    clearMessages();
    setSessionId(null);
    setCurrentSessionTitle(null);
    localStorage.removeItem(STORAGE_KEY);
    setSidebarVisible(false);
  }, [abortController, clearMessages, setSessionId, setCurrentSessionTitle, setAbortController, setResponseLoading, setSidebarVisible]);

  // ─── Select session ───
  const handleSelectSession = useCallback(
    async (targetSessionId: string) => {
      if (targetSessionId === sessionId && messages.length > 0) return;
      if (abortController) {
        abortController.abort();
        setAbortController(null);
        setResponseLoading(false);
      }
      const conv = conversations.find((c) => c.sessionId === targetSessionId);
      setCurrentSessionTitle(conv?.title ?? null);
      await loadSessionMessages(targetSessionId);
      setSidebarVisible(false);
    },
    [sessionId, messages.length, abortController, conversations, loadSessionMessages, setAbortController, setResponseLoading, setCurrentSessionTitle, setSidebarVisible],
  );

  // ─── Delete session ───
  const handleDeleteSession = useCallback(
    async (targetSessionId: string) => {
      try {
        await api.resource('aiConversations').destroy({ filterByTk: targetSessionId });
        if (targetSessionId === sessionId) {
          handleNewSession();
        }
        if (localStorage.getItem(STORAGE_KEY) === targetSessionId) {
          localStorage.removeItem(STORAGE_KEY);
        }
        await loadSessionList();
      } catch (err) {
        console.error('[ChatPage] Failed to delete conversation:', err);
      }
    },
    [api, sessionId, handleNewSession, loadSessionList],
  );

  // ─── Header ───
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0,
  };

  return (
    <ChatLayout
      sidebar={
        <SessionSidebar
          conversations={conversations}
          currentSessionId={sessionId}
          loading={sessionsLoading}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />
      }
    >
      {/* Header */}
      <div style={headerStyle}>
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setSidebarVisible(true)}
            style={{ marginRight: 8 }}
          />
        )}
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>
          {currentSessionTitle || '新对话'}
        </span>
      </div>

      {/* Message List */}
      <MessageList messages={messages} />

      {/* Quick Actions - only for new sessions */}
      {!sessionId && messages.length === 0 && <QuickActions onAction={handleSend} />}

      {/* Input */}
      <ChatInput onSend={handleSend} onStop={handleStop} loading={responseLoading} />
    </ChatLayout>
  );
};

export default ChatPage;
