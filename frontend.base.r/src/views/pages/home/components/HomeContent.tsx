import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import {
  Button,
  FeatureCard,
  StatCard,
  TrustedCompaniesWrapper,
  HeroVisual,
  features,
  initialStats,
} from "@shared/components";
import { motion } from "framer-motion";
import { useUserStore } from "@shared/stores/userStore";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));
const CreateOrganization = lazy(
  () => import("@/features/organization/create-organization")
);
const OrganizationProducts = lazy(
  () => import("@shared/components/product-table")
);

const HomeContent: React.FC = () => {
  const { t } = useTranslation("home");
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showOrgProducts, setShowOrgProducts] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [stats, setStats] = useState(
    initialStats.map((s) => ({ ...s, current: 0 }))
  );

  const isNewUser =
  !user ||
  !user.organization ||
  user.organization.products.length === 0;

  useEffect(() => {
    const steps = 40;
    const duration = 800;
    const interval = duration / steps;
    const timers: number[] = [];

    stats.forEach((s, idx) => {
      let i = 0;
      let current = 0;
      const increment = (initialStats[idx].value - current) / steps;
      const t = window.setInterval(() => {
        i++;
        current = current + increment;
        setStats((prev) => {
          const p = [...prev];
          const isFloat = String(initialStats[idx].value).includes(".");
          p[idx] = {
            ...p[idx],
            current: isFloat
              ? Math.round(current * 10) / 10
              : Math.round(current),
          };
          return p;
        });
        if (i >= steps) {
          window.clearInterval(t);
        }
      }, interval);
      timers.push(t);
    });

    return () => timers.forEach((t) => clearInterval(t));
  }, []);

  const handleTryFree = () => {
    if (!user) {
      setShowModal(true);
    } else if (user.organization == null) {
      setShowCreateOrg(true);
    } else {
      setShowOrgProducts(true);
    }
  };

  const handleBaseCreated = (): void => {
    setShowCreateOrg(false);
  };

  function scrollToContent() {
    const el = document.getElementById("content");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#04204a] via-[#062046] to-[#071b3f] opacity-95" />
        </div>

        <div className="relative min-w-0 mx-auto px-6 lg:px-8 bg-gradient-to-b from-[#04143a] via-[#061a3d] to-[#071b3f] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-20 lg:py-28 items-center relative z-10">
            <div className="lg:col-span-7 text-white">
              <div className="inline-flex items-center gap-3 mb-6">
                <img
                  src="brands/logo.webp"
                  alt="APS"
                  className="w-auto h-16 object-cover"
                />
                <div>
                  <div className="text-sm uppercase tracking-wide text-white/80 font-medium">
                    {t("hero.badge.title")}
                  </div>
                  <div className="text-xs text-white/70">
                    {t("hero.badge.subtitle")}
                  </div>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight max-w-2xl">
                {t("hero.title")}
                <span className="bg-clip-text text-transparent bg-white">
                  {t("hero.titleHighlight")}
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
                {t("hero.description")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  onClick={handleTryFree}
                  className="inline-flex items-center justify-center gap-3"
                >
                  <Icon
                    icon={
                      !user ||
                      !user.organization ||
                      user.organization.products.length === 0
                        ? "mdi:rocket-launch"
                        : "mdi:arrow-right-bold-circle"
                    }
                    width={18}
                  />
                  {isNewUser
                    ? t("buttons.tryFree")
                    : t("buttons.goToBase")}
                </Button>

                <Button
                  variant="outline"
                  onClick={scrollToContent}
                  className="inline-flex items-center justify-center gap-2 border-white border hover:bg-white hover:text-black transition-all duration-300"
                >
                  {t("buttons.more")} <Icon icon="mdi:chevron-down" width={16} />
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:check-decagram" width={16} /> {t("heroFeatures.ready")}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:chart-line" width={16} /> {t("heroFeatures.analytics")}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:cloud" width={16} /> {t("heroFeatures.cloud")}
                </span>
              </div>
            </div>

            <HeroVisual />
            
          </div>

          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-700/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-pink-600/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full filter blur-2xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
      </header>

      <section id="content" className="px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
        >
          {features.map((f) => (
            <FeatureCard key={f.title} item={f} />
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {stats.map((s) => (
            <StatCard key={s.label} item={s} />
          ))}
        </motion.div>

        <div className="mt-10 w-full">
          <TrustedCompaniesWrapper />
        </div>
      </section>

      <Suspense>
        {showModal && (
          <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title={isRegister ? t("modals.register") : t("modals.login")}
          >
            <Auth
              closeModal={() => setShowModal(false)}
              isRegister={isRegister}
              setIsRegister={setIsRegister}
            />
          </Modal>
        )}

        {showCreateOrg && (
          <Modal
            open={showCreateOrg}
            onClose={() => setShowCreateOrg(false)}
            title={t("modals.createOrg")}
          >
            <CreateOrganization onBaseCreated={handleBaseCreated} />
          </Modal>
        )}

        {showOrgProducts && (
          <Modal
            open={showOrgProducts}
            onClose={() => setShowOrgProducts(false)}
            title={t("modals.products")}
            widthModal="sm:w-[700px]"
          >
            <OrganizationProducts showActions={false} />
          </Modal>
        )}
      </Suspense>
    </div>
  );
};

export default HomeContent;
