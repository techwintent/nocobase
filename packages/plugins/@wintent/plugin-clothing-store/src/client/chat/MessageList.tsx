import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export interface Message {
  key: string;
  role: string;
  content: string;
  loading?: boolean;
  dataCard?: any;
}

export interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const containerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
  };

  if (messages.length === 0) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>✨</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(0,0,0,0.65)', marginBottom: '8px' }}>
            有什么可以帮你？
          </div>
          <div style={{ fontSize: '14px', color: '#bfbfbf' }}>开始一段新对话，或从左侧选择历史对话</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.key}
            role={msg.role as 'user' | 'assistant' | 'error'}
            content={msg.content}
            loading={msg.loading}
            dataCard={msg.dataCard}
          />
        ))}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

export default MessageList;
