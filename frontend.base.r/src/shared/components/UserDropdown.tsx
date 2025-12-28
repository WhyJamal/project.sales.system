import React from "react";
import { Icon } from "@iconify/react";

interface UserDropdownProps {
  user: { username: string; email: string };
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      <div
        className={`
          fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-out
          md:absolute md:inset-auto md:h-auto md:top-12 md:right-0 md:w-[300px] md:rounded md:shadow-lg md:transform-none
          ${isOpen ? "mobile-slide-in" : "mobile-slide-out"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="font-medium text-gray-900">Profile</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="mdi:close" width={20} className="text-gray-500" />
          </button>
        </div>

        <div className="h-full overflow-y-auto md:h-auto">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={onClose}
          >
            <Icon icon="mdi:cog" width={16} />
            Settings
          </button>

          <div className="border-t my-1"></div>

          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
            onClick={onLogout}
          >
            <Icon icon="mdi:logout" width={16} />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;
