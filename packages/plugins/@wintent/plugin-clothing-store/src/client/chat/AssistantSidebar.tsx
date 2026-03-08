import React, { useEffect, useState } from 'react';
import { Drawer } from 'antd';

export interface Assistant {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface AssistantSidebarProps {
  assistants: Assistant[];
  currentKey: string;
  onSelect: (key: string) => void;
  visible: boolean;
  onClose: () => void;
}

const SIDEBAR_WIDTH = 260;
const DRAWER_WIDTH = 280;

export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  assistants,
  currentKey,
  onSelect,
  visible,
  onClose,
}) => {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => {
      mql.removeEventListener('change', handleChange);
    };
  }, []);

  const headerStyle: React.CSSProperties = {
    padding: '20px 16px 12px',
    fontSize: '20px',
    fontWeight: 600,
    color: 'rgba(0, 0, 0, 0.88)',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '8px',
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  };

  const getCardStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '4px',
    backgroundColor: isActive ? '#e6f4ff' : 'transparent',
    borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
    transition: 'background-color 0.2s',
  });

  const iconStyle: React.CSSProperties = {
    fontSize: '24px',
    lineHeight: '1',
    flexShrink: 0,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 500,
    color: 'rgba(0, 0, 0, 0.88)',
    marginBottom: '2px',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#8c8c8c',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const SidebarContent = (
    <>
      <div style={headerStyle}>AI 助手</div>
      <div style={listStyle}>
        {assistants.map((assistant) => {
          const isActive = assistant.key === currentKey;
          return (
            <div
              key={assistant.key}
              style={getCardStyle(isActive)}
              onClick={() => {
                onSelect(assistant.key);
                if (!isDesktop) {
                  onClose();
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={iconStyle}>{assistant.icon}</span>
              <div style={infoStyle}>
                <div style={nameStyle}>{assistant.name}</div>
                <div style={descStyle}>{assistant.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (isDesktop) {
    const sidebarStyle: React.CSSProperties = {
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: '#fff',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    };

    return <div style={sidebarStyle}>{SidebarContent}</div>;
  }

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      placement="left"
      width={DRAWER_WIDTH}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      title={null}
      closable={false}
    >
      {SidebarContent}
    </Drawer>
  );
};

export default AssistantSidebar;
