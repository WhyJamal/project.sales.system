import React, { createContext, useState, useContext, ReactNode } from "react";
import Toast from "@/shared/components/ui/toast";
import LoaderOverlay from "@/shared/components/ui/loader-overlay";

interface AppContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  showLoader: () => void;
  hideLoader: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [loader, setLoader] = useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const showLoader = () => {
    setLoader(true);
  };

  const hideLoader = () => {
    setLoader(false);
  };

  return (
    <AppContext.Provider
      value={{ showToast, hideToast, showLoader, hideLoader }}
    >
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <LoaderOverlay show={loader} />
    </AppContext.Provider>
  );
};
