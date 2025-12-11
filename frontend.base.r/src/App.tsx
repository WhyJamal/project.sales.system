import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "@components/Layout";
import HomeView from "@pages/HomeView";
import { UserProvider } from "@/stores/UserContext";
import { AppProvider } from "@/contexts/AppContext";

export default function App() {
  return (
    <AppProvider>
      <UserProvider>
        <Layout>
          <Suspense fallback={<div className="p-8">Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomeView />} />
            </Routes>
          </Suspense>
        </Layout>
      </UserProvider>
    </AppProvider>
  );
}
