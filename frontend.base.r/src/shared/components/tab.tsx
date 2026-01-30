import React from "react";

interface TabProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  active?: boolean;
  onClick?: () => void;
}

const Tab: React.FC<TabProps> = ({ 
  icon, 
  label, 
  badge, 
  badgeColor = "bg-blue-500", 
  active, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-2 px-1 border-b-2 transition-colors ${
        active
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-600 hover:text-blue-500"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge && (
        <span
          className={`text-xs px-2 py-0.5 rounded text-white ${badgeColor}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

export default Tab;