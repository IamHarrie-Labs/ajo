'use client';

import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 16, className = '', style }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style,
  };
  switch (name) {
    case 'home':
      return <svg {...props}><path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" /></svg>;
    case 'pools':
      return <svg {...props}><circle cx="9" cy="9" r="5" /><circle cx="15" cy="15" r="5" /></svg>;
    case 'compass':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5l-2 5.5-5.5 2 2-5.5z" /></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'user':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'wallet':
      return <svg {...props}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M16 13h2" /><path d="M3 10h18" /></svg>;
    case 'arrow-right':
      return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    case 'arrow-up-right':
      return <svg {...props}><path d="M7 17L17 7M8 7h9v9" /></svg>;
    case 'arrow-down':
      return <svg {...props}><path d="M12 5v14M5 12l7 7 7-7" /></svg>;
    case 'check':
      return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case 'check-circle':
      return <svg {...props} strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>;
    case 'x':
      return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'alert':
      return <svg {...props}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.01" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'users':
      return <svg {...props}><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3 3-5 7-5s7 2 7 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c3 0 6 2 6 5" /></svg>;
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
    case 'filter':
      return <svg {...props}><path d="M3 6h18M6 12h12M10 18h4" /></svg>;
    case 'copy':
      return <svg {...props}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 012-2h10" /></svg>;
    case 'menu':
      return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M14 4h5a1 1 0 011 1v14a1 1 0 01-1 1h-5" /><path d="M10 8l-4 4 4 4M6 12h11" /></svg>;
    case 'chevron-right':
      return <svg {...props}><path d="M9 6l6 6-6 6" /></svg>;
    case 'chevron-down':
      return <svg {...props}><path d="M6 9l6 6 6-6" /></svg>;
    case 'circle':
      return <svg {...props}><circle cx="12" cy="12" r="9" /></svg>;
    case 'gavel':
      return <svg {...props}><path d="M14 4l6 6-3 3-6-6z" /><path d="M11 7l-7 7 3 3 7-7" /><path d="M3 21h12" /></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" /></svg>;
    case 'phone':
      return <svg {...props}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>;
    case 'globe':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>;
    case 'lock':
      return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>;
    case 'trending':
      return <svg {...props}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>;
    case 'history':
      return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 8v5l3 2" /></svg>;
    case 'send':
      return <svg {...props}><path d="M21 3L11 13M21 3l-7 18-3-8-8-3z" /></svg>;
    case 'book':
      return <svg {...props}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" /></svg>;
    case 'link':
      return <svg {...props}><path d="M10 13a5 5 0 007.5.9l3-3a5 5 0 00-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 00-7.5-.9l-3 3a5 5 0 007 7l1.7-1.7" /></svg>;
    case 'info':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8v.01" /></svg>;
    case 'zap':
      return <svg {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
    case 'moon':
      return <svg {...props}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>;
    default:
      return null;
  }
}
