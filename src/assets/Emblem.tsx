import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export const Emblem: React.FC<EmblemProps> = ({
  className = '',
  size = 40,
  monochrome = false,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      title="State Emblem of India - सत्यमेव जयते"
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Ashoka Lion Capital stylized official government vector */}
        {/* Top 3 Lions stylized */}
        <g fill={monochrome ? 'currentColor' : '#0B2A4A'}>
          {/* Central Lion Head */}
          <path d="M42 12C42 8 46 4 50 4C54 4 58 8 58 12C58 16 56 20 50 20C44 20 42 16 42 12Z" />
          <path d="M44 14C44 14 47 18 50 18C53 18 56 14 56 14C58 18 57 24 50 25C43 24 42 18 44 14Z" />
          <circle cx="47" cy="11" r="1" fill="#FFFFFF" />
          <circle cx="53" cy="11" r="1" fill="#FFFFFF" />
          <path d="M49 14L50 15L51 14H49Z" fill="#FFFFFF" />
          {/* Central Lion Mane & Chest */}
          <path d="M38 24C38 20 44 22 50 22C56 22 62 20 62 24C64 30 62 44 50 45C38 44 36 30 38 24Z" />
          <path d="M45 26C47 28 53 28 55 26C57 32 55 40 50 41C45 40 43 32 45 26Z" fill={monochrome ? '#FFFFFF' : '#D9DDE3'} opacity="0.4" />

          {/* Left Lion Profile */}
          <path d="M26 18C24 14 27 10 32 11C36 12 37 16 36 20C34 22 30 22 28 20C26 22 24 20 26 18Z" />
          <path d="M22 24C22 20 28 22 34 24C35 30 33 42 26 44C20 42 20 30 22 24Z" />
          <circle cx="29" cy="15" r="1" fill="#FFFFFF" />

          {/* Right Lion Profile */}
          <path d="M74 18C76 14 73 10 68 11C64 12 63 16 64 20C66 22 70 22 72 20C74 22 76 20 74 18Z" />
          <path d="M78 24C78 20 72 22 66 24C65 30 67 42 74 44C80 42 80 30 78 24Z" />
          <circle cx="71" cy="15" r="1" fill="#FFFFFF" />

          {/* Abacus Platform / Pedestal */}
          <rect x="18" y="47" width="64" height="4" rx="1" fill={monochrome ? 'currentColor' : '#0B2A4A'} />
          
          {/* Ashoka Chakra in Center of Abacus */}
          <circle cx="50" cy="58" r="7" stroke={monochrome ? 'currentColor' : '#0B2A4A'} strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="58" r="1.5" fill={monochrome ? 'currentColor' : '#0B2A4A'} />
          {/* Chakra Spokes */}
          <line x1="50" y1="51" x2="50" y2="65" stroke={monochrome ? 'currentColor' : '#0B2A4A'} strokeWidth="0.8" />
          <line x1="43" y1="58" x2="57" y2="58" stroke={monochrome ? 'currentColor' : '#0B2A4A'} strokeWidth="0.8" />
          <line x1="45" y1="53" x2="55" y2="63" stroke={monochrome ? 'currentColor' : '#0B2A4A'} strokeWidth="0.8" />
          <line x1="45" y1="63" x2="55" y2="53" stroke={monochrome ? 'currentColor' : '#0B2A4A'} strokeWidth="0.8" />

          {/* Bull on Right & Horse on Left (Stylized figures on Abacus) */}
          <path d="M24 55C24 53 28 53 30 55C32 57 30 62 26 62C24 62 22 57 24 55Z" />
          <path d="M76 55C76 53 72 53 70 55C68 57 70 62 74 62C76 62 78 57 76 55Z" />

          {/* Lower Base Platform */}
          <rect x="14" y="66" width="72" height="5" rx="1.5" fill={monochrome ? 'currentColor' : '#0B2A4A'} />
          <path d="M20 71H80L75 79H25L20 71Z" fill={monochrome ? 'currentColor' : '#123B63'} opacity="0.9" />

          {/* Satyameva Jayate Banner */}
          <rect x="12" y="83" width="76" height="14" rx="2" fill={monochrome ? 'currentColor' : '#0B2A4A'} />
          <text
            x="50"
            y="93"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            fontWeight="bold"
            letterSpacing="1.2"
            fontFamily="serif"
          >
            सत्यमेव जयते
          </text>
        </g>
      </svg>
    </div>
  );
};
