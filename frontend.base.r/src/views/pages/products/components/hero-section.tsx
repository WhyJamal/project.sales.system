import { lazy, useState, Suspense, useEffect } from "react";
import Button from "@/shared/components/ui/button";
import { Icon } from "@iconify/react";
import { useUserStore } from "@shared/stores/userStore";
import { OrganizationProduct } from "@/types";
import { useTranslation } from "react-i18next";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));
const CreateOrganization = lazy(
  () => import("@/features/organization/create-organization")
);
const OrganizationProducts = lazy(
  () => import("@shared/components/product-table")
);

interface HeroSectionProps {
  data: {
    id: number;
    title: string;
    description: string;
    gradient: string;
    hero_section_image_url: string;
    primaryBtn?: string;
    secondaryBtn?: string;
  };
  onStartWork?: () => void;
  requiredProductId?: number;
  is_active?: boolean;
  demo_url?: string;
}

export function HeroSection({
  data,
  onStartWork,
  requiredProductId,
  is_active,
  demo_url,
}: HeroSectionProps) {
  const { t } = useTranslation("common");
  const { user } = useUserStore();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrgProducts, setShowOrgProducts] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [goBase, setGoBase] = useState(false);
  const [products, setProducts] = useState<OrganizationProduct[]>([]);

  useEffect(() => {
    if (user && user.organization) {
      const filteredProducts = user.organization.products.filter(
        (product) => product.product_id === data.id
      );

      setGoBase(filteredProducts.length > 0);
      setProducts(filteredProducts);
    }
  }, [data.id, user]);

  const hasRequiredProduct = user?.organization?.products.some(
    (product) => product.id === requiredProductId
  );

  const handlePrimaryClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (user?.organization == null) {
      setShowCreateOrg(true);
    } else {
      onStartWork?.();
    }
  };

  const correctCreateOrg = () => {
    setShowCreateOrg(false);
    onStartWork?.();
  };

  const handleDemoClick = () => {
    if (demo_url) window.location.href = demo_url;
  };

  const handleGoBase = () => {
    if (products.length > 0) {
      if (products.length === 1) {
        window.open(products[0].product_url, "_blank");
      } else {
        setShowOrgProducts(true);
      }
    }
  };

  return (
    <section
      style={{
        background: `linear-gradient(to bottom right, ${data.gradient})`,
      }}
      className={`relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl mb-4 sm:mb-6">{data.title}</h2>
            <p className="text-gray-700 mb-6 sm:mb-8 leading-relaxed">
              {data.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {goBase && (
                <Button
                  onClick={handleGoBase}
                  className={`px-6 py-3 rounded font-semibold group/link ${
                    !is_active
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed pointer-events-none"
                      : "text-white bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Перейти на базе
                  <Icon
                    icon={"tabler:arrow-badge-right"}
                    className="w-4 h-4 group-hover/link:translate-x-1"
                  />
                </Button>
              )}

              <Button
                onClick={handlePrimaryClick}
                disabled={!is_active}
                className={`px-6 py-3 rounded font-semibold ${
                  !is_active
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed pointer-events-none"
                    : "text-white bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Создать базу
                <Icon
                  icon={"tabler:plus"}
                  className="w-4 h-4 group-hover/link:translate-x-1"
                />
              </Button>

              <Button
                onClick={handleDemoClick}
                disabled={!is_active}
                variant="outline"
                className={` border-2 px-6 py-3 ${
                  !is_active
                    ? "cursor-not-allowed pointer-events-none"
                    : "text-blue-600"
                }`}
              >
                Попробовать Демо
              </Button>
            </div>
          </div>
          <div className="relative w-full h-full">
            <img
              src={data.hero_section_image_url}
              alt="working-with-team"
              className="rounded-lg justify-center items-center"
            />
          </div>
        </div>
      </div>
      <Suspense>
        {showAuthModal && (
          <Modal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            title={isRegister ? "Создать аккаунт" : "С возвращением"}
          >
            <Auth
              closeModal={() => setShowAuthModal(false)}
              isRegister={isRegister}
              setIsRegister={setIsRegister}
            />
          </Modal>
        )}

        {showCreateOrg && (
          <Modal
            open={showCreateOrg}
            onClose={() => setShowCreateOrg(false)}
            title={t("modals.org.title")}
          >
            <CreateOrganization onBaseCreated={correctCreateOrg} />
          </Modal>
        )}

        {showOrgProducts && (
          <Modal
            open={showOrgProducts}
            onClose={() => setShowOrgProducts(false)}
            title="Продукты"
            widthModal="sm:w-[700px]"
          >
            <OrganizationProducts products={products} showActions={false} />
          </Modal>
        )}
      </Suspense>
    </section>
  );
}
