import React from 'react';

const AnimatedLogo = ({ className = "w-10 h-10" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 200 200" 
    className={`animated-logo ${className}`}
  >
    <style>
      {`
        .animated-logo {
          overflow: visible;
        }
        .logo-bg {
          fill: #fffdf5;
          stroke: #e88e1c;
          stroke-width: 14;
          rx: 45;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .animated-logo:hover .logo-bg {
          transform: scale(1.05);
          fill: #fff0d6;
          stroke: #ff9d00;
        }
        .logo-text {
          font-family: 'Nunito', 'Segoe UI', 'Arial', sans-serif;
          font-weight: 900;
          fill: #e88e1c;
        }
        .logo-o {
          animation: float 3s ease-in-out infinite;
        }
        .logo-k {
          animation: float 3s ease-in-out infinite 0.3s;
        }
        .logo-apos {
          animation: pulseRotate 2s infinite ease-in-out;
          transform-origin: 135px 85px;
        }
        .logo-s {
          animation: float 3s ease-in-out infinite 0.6s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseRotate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(15deg); }
        }
      `}
    </style>
    {/* Rounded Square Border */}
    <rect className="logo-bg" x="14" y="14" width="172" height="172" />
    
    {/* Animated Text ok's */}
    <text x="32" y="138" className="logo-text logo-o" fontSize="90" letterSpacing="-4">o</text>
    <text x="82" y="138" className="logo-text logo-k" fontSize="90">k</text>
    
    {/* Custom Wedge Shape for Apostrophe */}
    <path className="logo-text logo-apos" d="M 132 88 L 146 58 L 156 71 Z" />
    
    <text x="148" y="138" className="logo-text logo-s" fontSize="60">s</text>
  </svg>
);

export default AnimatedLogo;
