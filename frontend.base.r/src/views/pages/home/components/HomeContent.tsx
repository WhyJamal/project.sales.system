import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Icon } from "@iconify/react";
import Button from "@/shared/components/ui/button";
import FeatureCard from "@shared/components/widgets/feature-card";
import StatCard from "@shared/components/widgets/stat-card";
import TrustedCompaniesWrapper from "@shared/components/widgets/brands/TrustedCompaniesWrapper";
import { useUserStore } from "@shared/stores/userStore";
import { features, initialStats } from "@shared/components/widgets/config";
import HeroVisual from "@/shared/components/hero-visual";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));
const CreateOrganization = lazy(
  () => import("@/features/organization/create-organization")
);

const HomeContent: React.FC = () => {
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [stats, setStats] = useState(
    initialStats.map((s) => ({ ...s, current: 0 }))
  );

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
    } else if (!user.organization_url) {
      setShowCreateOrg(true);
    } else {
      window.location.href = user.organization_url;
    }
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
                  src="brands/logo.png"
                  alt="APS"
                  className="w-auto h-16 object-cover"
                />
                <div>
                  <div className="text-sm uppercase tracking-wide text-white/80 font-medium">
                    All Personal Soft
                  </div>
                  <div className="text-xs text-white/70">
                    Enterprise Resource Planning
                  </div>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight max-w-2xl">
                Автоматизируйте бизнес.
                <span className="bg-clip-text text-transparent bg-white">
                  Управляйте умно
                </span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
                Смотрите ключевое решение для компаний и специалистов —
                интегрированная ERP-платформа, аналитика в реальном времени и
                инструменты для автоматизации процессов. Подходит малому и
                среднему бизнесу, а также крупным корпоративным проектам.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  onClick={handleTryFree}
                  className="inline-flex items-center justify-center gap-3"
                >
                  <Icon
                    icon={
                      !user
                        ? "mdi:rocket-launch"
                        : !user.organization_url
                        ? "mdi:plus-circle-outline"
                        : "mdi:arrow-right-bold-circle"
                    }
                    width={18}
                  />
                  {!user
                    ? "Попробовать бесплатно"
                    : !user.organization_url
                    ? "Создать базу"
                    : "Перейти в базу"}
                </Button>

                <Button
                  variant="outline"
                  onClick={scrollToContent}
                  className="inline-flex items-center justify-center gap-2 border-white border hover:bg-white hover:text-black transition-all duration-300"
                >
                  Подробнее <Icon icon="mdi:chevron-down" width={16} />
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:check-decagram" width={16} /> Готово к
                  внедрению
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:chart-line" width={16} /> Аналитика в реальном
                  времени
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white/90 hover:bg-white/20 transition">
                  <Icon icon="mdi:cloud" width={16} /> Облачные деплойменты
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {features.map((f) => (
            <FeatureCard key={f.title} item={f} />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mt-12">
          {stats.map((s) => (
            <StatCard key={s.label} item={s} />
          ))}
        </div>

        <div className="mt-10 w-full">
          <TrustedCompaniesWrapper />
        </div>
      </section>

      <Suspense>
        {showModal && (
          <Modal open={showModal} onClose={() => setShowModal(false)} title="">
            <Auth closeModal={() => setShowModal(false)} />
          </Modal>
        )}

        {showCreateOrg && (
          <Modal
            open={showCreateOrg}
            onClose={() => setShowCreateOrg(false)}
            title=""
          >
            <CreateOrganization onBaseCreated={(url) => setShowCreateOrg(false)} />
          </Modal>
        )}
      </Suspense>
    </div>
  );
};

export default HomeContent;
