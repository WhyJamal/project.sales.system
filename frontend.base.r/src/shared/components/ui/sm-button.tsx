import React from "react";

interface SmallBtnProps {
  text: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const SmallBtn: React.FC<SmallBtnProps> = ({ 
  text, 
  onClick, 
  className = "", 
  icon 
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded hover:bg-gray-200 text-gray-600 flex items-center gap-0.5 transition-colors ${className}`}
    >
      {text}
      {icon && <span>{icon}</span>}
    </button>
  );
};

export default SmallBtn;