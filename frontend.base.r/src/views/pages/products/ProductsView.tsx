import React, { useEffect } from "react";
import ApplicationCard from "./components/application-card";
import { useProductStore } from "@/shared/stores/productsStore";
import { Spinner, Empty, Container } from "@shared/components";

const ProductsView: React.FC = () => {
  const { products, loading, loadProducts } = useProductStore();

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh] w-full">
        <Spinner />
      </div>
    );

  if (!products || products.length === 0) return <Empty />;

  return (
    <Container className="flex py-10">
      <div className="max-w-7xl mx-auto px-2 z-10">
        <h2 className="text-white text-xl font-semibold mt-5 mb-5">Приложения</h2>
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
