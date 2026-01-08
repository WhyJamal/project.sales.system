import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoaderOverlayProps {
  show?: boolean;
  variant?: "spinner" | "cloud" | "dots";
  text?: string;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  show,
  variant = "spinner",
  text,
}) => {
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  const getLoaderText = () => {
    if (text) return text;
    switch (variant) {
      case "cloud":
        return "Создание базы";
      case "dots":
        return "Загрузка";
      default:
        return "Загрузка";
    }
  };

  const renderLoader = () => {
    switch (variant) {
      case "cloud":
        return (
          <div className="loader"></div>
        );

      case "dots":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-white rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        );

      case "spinner":
        return (
          <div className="loader"></div>
        );

      default: // spinner
        return <div className="loader"></div>;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999]"
          style={{
            pointerEvents: "auto",
            /* cursor: 'not-allowed' */
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center justify-center">
            {renderLoader()}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-white text-sm font-medium flex items-center"
            >
              <span>{getLoaderText()}</span>
              <span className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoaderOverlay;
