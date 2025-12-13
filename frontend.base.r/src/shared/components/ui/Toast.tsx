import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "mdi:check-circle",
          bgColor: "bg-white",
          iconColor: "text-green-400",
          progressColor: "bg-green-400"
        };
      case "error":
        return {
          icon: "mdi:close-circle",
          bgColor: "bg-black",
          iconColor: "text-red-400",
          progressColor: "bg-red-400"
        };
      default:
        return {
          icon: "mdi:information",
          bgColor: "bg-white",
          iconColor: "text-blue-400",
          progressColor: "bg-blue-400"
        };
    }
  };

  const config = getToastConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}        
        className="fixed top-6 inset-x-0 flex justify-center z-[9999]" 
      >
        <div className={`${config.bgColor} rounded-xl shadow-lg overflow-hidden`}>
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 3, ease: "linear" }}
            className={`h-1 ${config.progressColor}`}
          />
          
          <div className="p-2 flex items-start gap-2">
            {/* Icon */}
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              <Icon icon={config.icon} width={24} height={24} />
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-black font-medium text-sm leading-5 break-words">
                {message}
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors duration-200 rounded-full p-1"
              aria-label="Close toast"
            >
              <Icon icon="mdi:close" width={18} height={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;