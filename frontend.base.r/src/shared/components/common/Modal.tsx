import React from "react";
import { Icon } from "@iconify/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  widthModal?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title = "Modal",
  children,
  className,
  widthModal,
}) => {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 w-full ${className}`}>
      <div className="absolute inset-0 bg-black/40"></div>
      {/*onClick={onClose}*/}
      <div 
        className={`bg-white shadow-xl w-full p-6 relative z-10 rounded-sm ${
          !widthModal
            ? "max-w-lg"
            : widthModal
        }`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
          aria-label="Close modal"
        >
          <Icon
            icon="mdi:close"
            width={24}
            height={24}
            className="text-gray-500 group-hover:text-gray-700 transition-colors"
          />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
