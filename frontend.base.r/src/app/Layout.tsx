import React from "react";
import { Outlet } from "react-router-dom"; 
import Navbar from "@shared/components/layouts/header";
import Footer from "@shared/components/layouts/footer";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </header>

      <main className="pt-10 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
