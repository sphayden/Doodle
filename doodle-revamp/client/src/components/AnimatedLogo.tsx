import React from 'react';
import './AnimatedLogo.css';

const AnimatedLogo: React.FC = () => {
  return (
    <div className="animated-logo-container">
      <svg
        className="animated-logo"
        viewBox="0 0 300 300"
        width="200"
        height="200"
      >
        {/* Circle being drawn */}
        <circle
          className="logo-circle"
          cx="150"
          cy="150"
          r="120"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Paintbrush */}
        <g className="paintbrush">
          {/* Brush handle */}
          <rect
            x="140"
            y="80"
            width="20"
            height="80"
            fill="#8B4513"
            rx="3"
            ry="3"
          />
          
          {/* Metal ferrule */}
          <rect
            x="138"
            y="150"
            width="24"
            height="15"
            fill="#C0C0C0"
            rx="2"
            ry="2"
          />
          
          {/* Brush bristles */}
          <ellipse
            cx="150"
            cy="175"
            rx="12"
            ry="20"
            fill="#4A4A4A"
          />
          
          {/* Paint tip */}
          <ellipse
            className="paint-tip"
            cx="150"
            cy="195"
            rx="8"
            ry="8"
            fill="#0b63af"
          />
        </g>
        
        {/* Paint stroke effect */}
        <circle
          className="paint-stroke"
          cx="150"
          cy="150"
          r="120"
          fill="none"
          stroke="#0b63af"
          strokeWidth="3"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};

export default AnimatedLogo; 