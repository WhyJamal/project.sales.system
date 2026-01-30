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
      className={`px-3 py-1 text-xs rounded hover:bg-gray-200 text-gray-600 flex items-center gap-1 transition-colors ${className}`}
    >
      {icon && <span>{icon}</span>}
      {text}
    </button>
  );
};

export default SmallBtn;