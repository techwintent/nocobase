import React, { useState, useRef, useCallback } from 'react';
import { Button, Input } from 'antd';
import { SendOutlined, BorderOutlined } from '@ant-design/icons';

export interface ChatInputProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStop, disabled, loading }) => {
  const [value, setValue] = useState('');
  const textAreaRef = useRef<any>(null);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  }, [value, onSend]);

  const handleStop = useCallback(() => {
    if (onStop) onStop();
  }, [onStop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!loading && !disabled) handleSend();
      }
    },
    [handleSend, loading, disabled],
  );

  return (
    <div style={{ flexShrink: 0, backgroundColor: '#ffffff', borderTop: '1px solid #f0f0f0', padding: '12px 16px 20px' }}>
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '16px',
          padding: '8px 8px 8px 16px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}
      >
        <Input.TextArea
          ref={textAreaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="给 AI 助手发消息..."
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={disabled || loading}
          bordered={false}
          style={{ resize: 'none', fontSize: '14px', padding: '4px 0' }}
        />
        {loading ? (
          <Button
            type="primary"
            danger
            shape="circle"
            icon={<BorderOutlined />}
            style={{ flexShrink: 0, width: '32px', height: '32px', minWidth: '32px' }}
            onClick={handleStop}
          />
        ) : (
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              minWidth: '32px',
              backgroundColor: '#10a37f',
              borderColor: '#10a37f',
            }}
            disabled={disabled || !value.trim()}
            onClick={handleSend}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInput;
