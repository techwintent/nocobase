import React, { useEffect, useState } from 'react';

export interface ChatLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 260;

export const ChatLayout: React.FC<ChatLayoutProps> = ({ sidebar, children }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    backgroundColor: '#ffffff',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
    transition: 'margin-left 0.2s',
  };

  return (
    <div style={containerStyle}>
      {sidebar}
      <div style={mainStyle}>{children}</div>
    </div>
  );
};

export default ChatLayout;
