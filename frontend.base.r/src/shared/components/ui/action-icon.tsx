import React from "react";
import { 
  Archive, 
  Trash2, 
  Edit, 
  RotateCcw,
  UserPlus,
  Settings,
  LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  archive: Archive,
  trash: Trash2,
  Edit: Edit,
  "refresh-ccw": RotateCcw,
  users: UserPlus,
  settings: Settings,
};

interface ActionIconProps {
  icon: keyof typeof iconMap;
  onClick?: () => void;
  label?: string;
}

const ActionIcon: React.FC<ActionIconProps> = ({ icon, onClick, label }) => {
  const IconComponent = iconMap[icon];
  
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
      aria-label={label ?? icon}
    >
      <IconComponent className="w-3 h-3" />
    </button>
  );
};

export default ActionIcon;