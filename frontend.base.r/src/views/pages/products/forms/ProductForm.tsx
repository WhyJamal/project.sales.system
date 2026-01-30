import { useParams } from "react-router-dom";
import { HeroSection } from "../components/hero-section";
import { InnovationSection } from "../components/innovation-section";
import { SolutionsSection } from "../components/solutions-section";
import { Spinner, Empty } from "@/shared/components";
import { useProductStore } from "@/shared/stores/productsStore";
import { useUserStore } from "@/shared/stores/userStore";
import { lazy, useState, useEffect, Suspense } from "react";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const CreateProduct = lazy(() => import("@/features/product/create-product"));

export default function ProductForm() {
  const { productKey } = useParams<{ productKey: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const id = Number(productKey);

  const { user } = useUserStore();
  const { getProductById, loading } = useProductStore();

  const openStartWork = () => {
    setShowCreateModal(true);
  };

  const product = getProductById(id);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner />
      </div>
    );

  if (!product) return <Empty />;

  const heroSectionData = {
    id,
    ...product.hero_section,
    hero_section_image_url: product.hero_section_image_url,
  };

  const featuresSectionData = {
    ...product.features_section,
    features_section_videoID: product.features_section_videoID,
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection
        data={heroSectionData}
        onStartWork={openStartWork}
        requiredProductId={id}
        is_active={product.is_active}
        demo_url={product.demo_url}
      />
      <Suspense>
        {showCreateModal && (
          <Modal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Создать продукт"
          >
            <CreateProduct
              organizationId={user?.organization?.id}
              productId={id}
            />
          </Modal>
        )}
      </Suspense>
      <InnovationSection data={featuresSectionData} />
      <SolutionsSection data={product.modules_section} />
    </div>
  );
}
