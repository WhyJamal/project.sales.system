import React, { Suspense } from "react";
import { AppProvider } from "@app/providers/AppProvider";
import AppRouter from "@app/router"; 
import Loader from "@/shared/components/ui/loader-overlay";

const App: React.FC = () => {
  return (
    <AppProvider>
        <Suspense fallback={<Loader show={true} variant="spinner" />}>
          <AppRouter />
        </Suspense>
    </AppProvider>
  );
};

export default App;
