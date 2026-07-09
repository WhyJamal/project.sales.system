import React from "react";

interface SmallBtnProps {
  text: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  textSize?: "xs" | "sm" | "base";
  iconPosition?: "left" | "right";
}

const SmallBtn: React.FC<SmallBtnProps> = ({ 
  text, 
  onClick, 
  className = "", 
  icon,
  textSize = "xs",
  iconPosition = "right", 
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-${textSize} rounded hover:bg-gray-200 text-gray-600 flex items-center gap-0.5 transition-colors ${className}`}
    >
      {iconPosition === "left" && icon && <span>{icon}</span>}
      {text}
      {iconPosition === "right" && icon && <span>{icon}</span>}
    </button>
  );
};

export default SmallBtn;