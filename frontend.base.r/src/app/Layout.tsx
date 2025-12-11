import React from "react";
import Navbar from "../shared/components/headers/Navbar";
import Footer from "../shared/components/footers/Footer";

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </header>

      <main className="pt-10 flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default Layout;
