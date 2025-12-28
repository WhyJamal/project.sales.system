import React from "react";
import ApplicationCard from "./components/ApplicationCard";
import { products } from "@/data/productsData";

const ProductsView: React.FC = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-[#04204a] via-[#062046] to-[#071b3f] py-16">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-white text-xl font-semibold mb-10">
          Приложения
        </h2>

        <div className="space-y-6">
          {products.map((product) => (
            <ApplicationCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsView;
