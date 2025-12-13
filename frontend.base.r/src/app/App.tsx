import React, { Suspense } from "react";
import { UserProvider } from "@app/providers/UserProvider";
import { AppProvider } from "@app/providers/AppProvider";
import AppRouter from "@app/router"; 
import Loader from "@shared/components/ui/LoaderOverlay";

const App: React.FC = () => {
  return (
    <AppProvider>
      <UserProvider>
        <Suspense fallback={<Loader show={true} variant="spinner" />}>
          <AppRouter />
        </Suspense>
      </UserProvider>
    </AppProvider>
  );
};

export default App;
