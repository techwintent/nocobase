import React from 'react';

export interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QUICK_ACTIONS = [
  { label: '📊 今日概况', prompt: '帮我看看今天的经营概况' },
  { label: '📦 库存预警', prompt: '有哪些商品库存不足需要补货？' },
  { label: '👥 沉睡客户', prompt: '有哪些客户最近没有来消费了？' },
  { label: '🔥 热销商品', prompt: '最近卖得最好的商品有哪些？' },
  { label: '🆕 新品表现', prompt: '最近上新的商品表现怎么样？' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const scrollStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  } as React.CSSProperties;

  const buttonStyle: React.CSSProperties = {
    flexShrink: 0,
    borderRadius: '16px',
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    padding: '6px 14px',
    fontSize: '13px',
    color: 'rgba(0, 0, 0, 0.88)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: '1.5',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'border-color 0.2s, color 0.2s',
    outline: 'none',
    userSelect: 'none',
  };

  return (
    <>
      <style>{`.quick-actions-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="quick-actions-scroll" style={scrollStyle}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.prompt}
                style={buttonStyle}
                onClick={() => onAction(action.prompt)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#10a37f';
                  (e.currentTarget as HTMLButtonElement).style.color = '#10a37f';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#d9d9d9';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0, 0, 0, 0.88)';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickActions;
