import React from 'react';

const BrandLogo = ({ className = "h-10" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="OmniKart Logo" 
      className={`${className} w-auto object-contain rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:drop-shadow-[0_6px_12px_rgba(255,184,77,0.35)] dark:hover:drop-shadow-[0_4px_20px_rgba(255,184,77,0.2)] dark:brightness-105`}
    />
  );
};

export default BrandLogo;
