import React from 'react';

interface AuroraHeaderProps {
  children: React.ReactNode;
}

export const AuroraHeader: React.FC<AuroraHeaderProps> = ({ children }) => {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl p-6 mb-6">
      {/* Aurora blurred ambient gradient blobs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ height: '180px', zIndex: 0 }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-10 -left-10 w-72 h-72 rounded-full animate-aurora-1"
          style={{
            background: 'radial-gradient(circle, #4F46E5 0%, rgba(79, 70, 229, 0) 70%)',
            opacity: 0.22,
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute -top-12 left-1/3 w-80 h-80 rounded-full animate-aurora-2"
          style={{
            background: 'radial-gradient(circle, #7C3AED 0%, rgba(124, 58, 237, 0) 70%)',
            opacity: 0.22,
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute -top-10 right-10 w-72 h-72 rounded-full animate-aurora-3"
          style={{
            background: 'radial-gradient(circle, #DB2777 0%, rgba(219, 39, 119, 0) 70%)',
            opacity: 0.22,
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* Content on top */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
