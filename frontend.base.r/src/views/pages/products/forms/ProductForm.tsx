import { useParams } from "react-router-dom";
import { productConfigs } from "@data/productConfigs";
import { ProductKey } from "@/types/product";

import { HeroSection } from "../components/HeroSection";
import { InnovationSection } from "../components/InnovationSection";
import { SolutionsSection } from "../components/SolutionsSection";

export default function ProductForm() {
  const { productKey } = useParams<{ productKey: string }>();
  const config = productKey ? productConfigs[productKey as ProductKey] : null;

  if (!config) return null;

  return (
    <div className="min-h-screen bg-white">
      <HeroSection data={config.hero} />
      <InnovationSection data={config.innovation} />
      <SolutionsSection data={config.solutions} />
    </div>
  );
}
