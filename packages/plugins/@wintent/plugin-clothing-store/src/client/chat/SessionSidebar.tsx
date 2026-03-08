import React, { useEffect, useState } from 'react';
import { Drawer, Spin, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ConversationSummary } from './useChatStore';

export interface SessionSidebarProps {
  conversations: ConversationSummary[];
  currentSessionId: string | null;
  loading: boolean;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  visible: boolean;
  onClose: () => void;
}

const SIDEBAR_WIDTH = 260;
const DRAWER_WIDTH = 280;

function formatSessionTime(updatedAt: string): string {
  const d = dayjs(updatedAt);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天';
  const diff = now.diff(d, 'day');
  if (diff < 7) return `${diff}天前`;
  return d.format('MM/DD');
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  conversations,
  currentSessionId,
  loading,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  visible,
  onClose,
}) => {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const newChatBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: 'calc(100% - 24px)',
    margin: '12px 12px 8px',
    padding: '10px 0',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  const sectionLabelStyle: React.CSSProperties = {
    padding: '12px 16px 6px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.05em',
    fontWeight: 500,
  };

  const getItemStyle = (isActive: boolean, isHovered: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    margin: '0 8px 2px',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
    borderLeft: isActive ? '3px solid #10a37f' : '3px solid transparent',
    transition: 'background-color 0.15s',
    position: 'relative' as const,
  });

  const SidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#202123',
      }}
    >
      {/* New Chat Button */}
      <div
        style={newChatBtnStyle}
        onClick={onNewSession}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)';
        }}
      >
        <PlusOutlined style={{ fontSize: '14px' }} />
        <span>新对话</span>
      </div>

      {/* Section Label */}
      <div style={sectionLabelStyle}>对话历史</div>

      {/* Session List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '12px' }}>
        {loading && conversations.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spin size="small" />
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
              padding: '24px 16px',
              fontSize: '13px',
            }}
          >
            暂无对话
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.sessionId === currentSessionId;
            const isHovered = conv.sessionId === hoveredId;
            return (
              <div
                key={conv.sessionId}
                style={getItemStyle(isActive, isHovered)}
                onClick={() => {
                  onSelectSession(conv.sessionId);
                  if (!isDesktop) onClose();
                }}
                onMouseEnter={() => setHoveredId(conv.sessionId)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.85)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.title || '新对话'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {formatSessionTime(conv.updatedAt)}
                  </div>
                </div>
                {/* Delete button - visible on hover */}
                {isHovered && (
                  <Popconfirm
                    title="删除此对话?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteSession(conv.sessionId);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px',
                        color: 'rgba(255,255,255,0.35)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <DeleteOutlined style={{ fontSize: '13px' }} />
                    </div>
                  </Popconfirm>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          zIndex: 100,
        }}
      >
        {SidebarContent}
      </div>
    );
  }

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      placement="left"
      width={DRAWER_WIDTH}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#202123' },
        header: { display: 'none' },
      }}
      closable={false}
    >
      {SidebarContent}
    </Drawer>
  );
};

export default SessionSidebar;
