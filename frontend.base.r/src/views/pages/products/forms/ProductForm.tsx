import { useParams } from "react-router-dom";
import { HeroSection } from "../components/hero-section";
import { InnovationSection } from "../components/innovation-section";
import { SolutionsSection } from "../components/solutions-section";
import { Spinner, Empty } from "@/shared/components";
import { useProductStore } from "@/shared/stores/productsStore";
import { lazy, useState } from "react";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const CreateOrganization = lazy(
  () => import("@/features/organization/create-organization")
);

export default function ProductForm() {
  const { productKey } = useParams<{ productKey: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const id = Number(productKey);

  const { products, loadProducts, getProductById, loading } = useProductStore();

  const openStartWork = () => setShowCreateModal(true);

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

  if (!product) return <Empty />;

  const heroSectionData = {
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
      {showCreateModal && (
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Создать организацию"
        >
          <CreateOrganization
            initialProductId={id}
            onBaseCreated={(url) => setShowCreateModal(false)}
          />
        </Modal>
      )}
      <InnovationSection data={featuresSectionData} />
      <SolutionsSection data={product.modules_section} />
    </div>
  );
}
