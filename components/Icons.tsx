import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const Icons = {
  HeartPulse: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.7-1 2.1 4.4 2.1-4.4.7 1h6.28" />
    </svg>
  ),
  CameraOff: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M10.15 10.15 8 13s-2-2-2-3 2-3 2-3" />
      <path d="M14 13s2-2 2-3-2-3-2-3" />
      <path d="M12 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.172a2 2 0 0 0 1.414-.586l.828-.828A2 2 0 0 1 12 5h2.172a2 2 0 0 0 1.414.586l.828.828" />
      <path d="M21.68 16.32a2 2 0 0 0-2.43-3.13l-2.25.75" />
    </svg>
  ),
  Play: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Stop: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
};
