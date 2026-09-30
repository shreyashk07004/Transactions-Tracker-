import React from 'react';

export const GrainOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-1 overflow-hidden"
      style={{
        opacity: 'var(--grain-opacity)',
        mixBlendMode: 'overlay'
      }}
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
};
