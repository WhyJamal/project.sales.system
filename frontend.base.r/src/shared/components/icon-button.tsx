import React from "react";

interface IconBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

const IconBtn: React.FC<IconBtnProps> = ({ 
  children, 
  onClick, 
  ariaLabel,
  className = "" 
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`rounded hover:bg-gray-100 text-gray-600 p-1 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default IconBtn;