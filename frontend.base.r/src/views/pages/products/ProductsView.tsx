import React from "react";
import ApplicationCard from "./components/ApplicationCard";
import { products } from "@/shared/data/productsData";
import { Container } from "@/shared/components/container";

const ProductsView: React.FC = () => {
  return (
    <Container className="flex py-16">
      <div className="max-w-5xl mx-auto px-4 z-10">
        
        <h2 className="text-white text-xl font-semibold mb-10">Приложения</h2>

        <div className="space-y-6">
          {products.map((product) => (
            <ApplicationCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default ProductsView;
