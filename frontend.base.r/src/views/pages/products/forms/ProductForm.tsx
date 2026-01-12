import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { HeroSection } from "../components/hero-section";
import { InnovationSection } from "../components/innovation-section";
import { SolutionsSection } from "../components/solutions-section";
import Spinner from "@/shared/components/ui/spinner";
import { useProductStore } from "@/shared/stores/productsStore";
import Empty from "@/shared/components/ui/empty";

export default function ProductForm() {
  const { productKey } = useParams<{ productKey: string }>();
  const id = Number(productKey);

  const { products, loadProducts, getProductById, loading } = useProductStore();

  // useEffect(() => {
  //   loadProducts();
  // }, [loadProducts]);

  const product = getProductById(id);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner />
      </div>
    );

  if (!product)
    return <Empty />;

  return (
    <div className="min-h-screen bg-white">
      <HeroSection data={product.hero_section} />
      <InnovationSection data={product.features_section} />
      <SolutionsSection data={product.modules_section} />
    </div>
  );
}
