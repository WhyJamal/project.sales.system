import React, { useEffect } from "react";
import { Outlet } from "react-router-dom"; 
import Navbar from "@shared/components/layouts/header";
import Footer from "@shared/components/layouts/footer";
import { useProductStore } from "@/shared/stores/productsStore";
import Breadcrumbs from "@shared/components/ui/breadcrumbs";

const Layout: React.FC = () => {
  const { loadProducts } = useProductStore();

  useEffect(() => {
    loadProducts(); 
  }, [loadProducts]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50">
        <Navbar />
        <Breadcrumbs />
      </header>

      <main className="pt-10 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
