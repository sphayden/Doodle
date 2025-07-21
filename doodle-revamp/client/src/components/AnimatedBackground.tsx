import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="animated-background">
      {/* House doodle */}
      <svg className="doodle doodle-house" viewBox="0 0 200 200" width="150" height="150">
        <path
          className="animated-path"
          d="M50 150 L50 100 L100 50 L150 100 L150 150 Z M50 150 L150 150 M80 150 L80 120 L120 120 L120 150 M90 130 L110 130"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Cat doodle */}
      <svg className="doodle doodle-cat" viewBox="0 0 200 200" width="120" height="120">
        <path
          className="animated-path"
          d="M100 80 C120 60, 140 80, 140 100 C140 120, 120 140, 100 140 C80 140, 60 120, 60 100 C60 80, 80 60, 100 80 Z M85 90 C85 90, 85 90, 85 90 M115 90 C115 90, 115 90, 115 90 M100 110 L90 120 M100 110 L110 120 M80 70 L70 60 M120 70 L130 60"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Tree doodle */}
      <svg className="doodle doodle-tree" viewBox="0 0 200 200" width="130" height="130">
        <path
          className="animated-path"
          d="M100 160 L100 120 M100 120 C80 100, 120 100, 100 120 C70 80, 130 80, 100 120 C60 60, 140 60, 100 120"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Sun doodle */}
      <svg className="doodle doodle-sun" viewBox="0 0 200 200" width="100" height="100">
        <path
          className="animated-path"
          d="M100 80 C110 80, 120 90, 120 100 C120 110, 110 120, 100 120 C90 120, 80 110, 80 100 C80 90, 90 80, 100 80 Z M100 60 L100 70 M100 130 L100 140 M140 100 L130 100 M70 100 L60 100 M130 70 L125 75 M75 125 L70 130 M130 130 L125 125 M75 75 L70 70"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Car doodle */}
      <svg className="doodle doodle-car" viewBox="0 0 200 200" width="140" height="140">
        <path
          className="animated-path"
          d="M40 120 L160 120 L160 140 L40 140 Z M50 120 L60 100 L140 100 L150 120 M70 140 C70 145, 75 150, 80 150 C85 150, 90 145, 90 140 M130 140 C130 145, 135 150, 140 150 C145 150, 150 145, 150 140 M80 110 L120 110"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Flower doodle */}
      <svg className="doodle doodle-flower" viewBox="0 0 200 200" width="110" height="110">
        <path
          className="animated-path"
          d="M100 140 L100 100 M100 100 C90 90, 110 90, 100 100 C110 90, 110 110, 100 100 C110 110, 90 110, 100 100 C90 110, 90 90, 100 100 M100 100 C100 100, 100 100, 100 100"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Abstract shapes */}
      <svg className="doodle doodle-abstract1" viewBox="0 0 200 200" width="80" height="80">
        <path
          className="animated-path"
          d="M50 50 Q100 20, 150 50 Q180 100, 150 150 Q100 180, 50 150 Q20 100, 50 50"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <svg className="doodle doodle-abstract2" viewBox="0 0 200 200" width="90" height="90">
        <path
          className="animated-path"
          d="M60 60 L140 60 L140 140 L60 140 Z M60 100 L140 100 M100 60 L100 140"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Star doodle */}
      <svg className="doodle doodle-star" viewBox="0 0 200 200" width="100" height="100">
        <path
          className="animated-path"
          d="M100 40 L108 72 L140 72 L116 92 L124 124 L100 104 L76 124 L84 92 L60 72 L92 72 Z"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Heart doodle */}
      <svg className="doodle doodle-heart" viewBox="0 0 200 200" width="95" height="95">
        <path
          className="animated-path"
          d="M100 140 C100 140, 60 100, 60 80 C60 60, 80 60, 100 80 C120 60, 140 60, 140 80 C140 100, 100 140, 100 140"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Cloud doodle */}
      <svg className="doodle doodle-cloud" viewBox="0 0 200 200" width="130" height="130">
        <path
          className="animated-path"
          d="M60 120 C40 120, 40 100, 60 100 C60 80, 80 80, 100 80 C120 60, 140 80, 140 100 C160 100, 160 120, 140 120 Z"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Lightning bolt doodle */}
      <svg className="doodle doodle-lightning" viewBox="0 0 200 200" width="85" height="85">
        <path
          className="animated-path"
          d="M80 50 L120 50 L100 100 L130 100 L70 150 L90 110 L60 110 Z"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Arrow doodle */}
      <svg className="doodle doodle-arrow" viewBox="0 0 200 200" width="110" height="110">
        <path
          className="animated-path"
          d="M40 100 L160 100 M140 80 L160 100 L140 120"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Spiral doodle */}
      <svg className="doodle doodle-spiral" viewBox="0 0 200 200" width="105" height="105">
        <path
          className="animated-path"
          d="M100 100 C100 80, 120 80, 120 100 C120 120, 80 120, 80 100 C80 60, 140 60, 140 100 C140 140, 60 140, 60 100"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Musical note doodle */}
      <svg className="doodle doodle-note" viewBox="0 0 200 200" width="90" height="90">
        <path
          className="animated-path"
          d="M80 140 C70 140, 70 130, 80 130 C90 130, 90 140, 80 140 M80 130 L80 70 L120 60 L120 120 C130 120, 130 130, 120 130 C110 130, 110 120, 120 120"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Diamond doodle */}
      <svg className="doodle doodle-diamond" viewBox="0 0 200 200" width="80" height="80">
        <path
          className="animated-path"
          d="M100 60 L130 100 L100 140 L70 100 Z M100 60 L100 140 M70 100 L130 100"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Butterfly doodle */}
      <svg className="doodle doodle-butterfly" viewBox="0 0 200 200" width="115" height="115">
        <path
          className="animated-path"
          d="M100 60 L100 140 M100 80 C80 60, 60 80, 80 100 C60 120, 80 140, 100 120 M100 80 C120 60, 140 80, 120 100 C140 120, 120 140, 100 120 M95 70 L105 70"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Balloon doodle */}
      <svg className="doodle doodle-balloon" viewBox="0 0 200 200" width="95" height="95">
        <path
          className="animated-path"
          d="M100 80 C120 80, 120 120, 100 120 C80 120, 80 80, 100 80 M100 120 L100 150 M90 150 L110 150"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Gear/Cog doodle */}
      <svg className="doodle doodle-gear" viewBox="0 0 200 200" width="100" height="100">
        <path
          className="animated-path"
          d="M100 70 C115 70, 130 85, 130 100 C130 115, 115 130, 100 130 C85 130, 70 115, 70 100 C70 85, 85 70, 100 70 M100 50 L100 70 M100 130 L100 150 M150 100 L130 100 M70 100 L50 100 M125 75 L135 65 M75 125 L65 135 M125 125 L135 135 M75 75 L65 65"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default AnimatedBackground; 