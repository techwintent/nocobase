import React from 'react';
import Markdown from 'react-markdown';
import { DataCard } from './DataCard';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'error';
  content: string;
  loading?: boolean;
  dataCard?: any;
}

/** Three-dot loading animation */
const LoadingDots: React.FC = () => (
  <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', height: '20px' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10a37f',
          animation: 'chatDotPulse 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes chatDotPulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </span>
);

/** Markdown custom components */
const markdownComponents = {
  p: ({ children }: any) => <p style={{ margin: '0 0 8px', lineHeight: 1.7 }}>{children}</p>,
  pre: ({ children }: any) => (
    <pre
      style={{
        background: '#f5f5f5',
        padding: '12px',
        borderRadius: '8px',
        overflowX: 'auto',
        fontSize: '13px',
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        margin: '8px 0',
        lineHeight: 1.5,
      }}
    >
      {children}
    </pre>
  ),
  code: ({ children }: any) => (
    <code
      style={{
        background: '#f0f0f0',
        padding: '1px 5px',
        borderRadius: '3px',
        fontFamily: "'SFMono-Regular', Consolas, monospace",
        fontSize: '13px',
      }}
    >
      {children}
    </code>
  ),
  ul: ({ children }: any) => <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ marginBottom: '4px', lineHeight: 1.6 }}>{children}</li>,
  h1: ({ children }: any) => <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '12px 0 8px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: '17px', fontWeight: 600, margin: '10px 0 6px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '8px 0 4px' }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
  blockquote: ({ children }: any) => (
    <blockquote
      style={{
        borderLeft: '3px solid #d9d9d9',
        paddingLeft: '12px',
        color: '#595959',
        margin: '8px 0',
        fontStyle: 'italic',
      }}
    >
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>{children}</table>
    </div>
  ),
  th: ({ children }: any) => (
    <th
      style={{
        border: '1px solid #e8e8e8',
        padding: '8px 12px',
        backgroundColor: '#fafafa',
        fontWeight: 600,
        textAlign: 'left',
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{ border: '1px solid #e8e8e8', padding: '8px 12px' }}>{children}</td>
  ),
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, loading, dataCard }) => {
  const isUser = role === 'user';
  const isError = role === 'error';

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    alignItems: 'flex-start',
    padding: '6px 0',
    gap: '12px',
  };

  const avatarStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#10a37f',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  };

  return (
    <div style={rowStyle}>
      {/* AI avatar */}
      {!isUser && <div style={avatarStyle}>AI</div>}

      <div style={{ maxWidth: isUser ? '70%' : 'calc(100% - 40px)', display: 'flex', flexDirection: 'column' }}>
        {/* User message */}
        {isUser && (
          <div
            style={{
              backgroundColor: '#10a37f',
              color: '#fff',
              borderRadius: '18px',
              borderBottomRightRadius: '4px',
              padding: '10px 16px',
              fontSize: '14px',
              lineHeight: '1.6',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </div>
        )}

        {/* Assistant message */}
        {!isUser && !isError && (
          <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'rgba(0,0,0,0.88)', wordBreak: 'break-word' }}>
            {loading ? (
              <LoadingDots />
            ) : (
              <Markdown components={markdownComponents}>{content}</Markdown>
            )}
            {dataCard && <DataCard type={dataCard.type} data={dataCard.data} />}
          </div>
        )}

        {/* Error message */}
        {isError && (
          <div
            style={{
              backgroundColor: '#fff2f0',
              color: '#ff4d4f',
              border: '1px solid #ffccc7',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '14px',
              lineHeight: '1.6',
              wordBreak: 'break-word',
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
