import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Icon } from "@iconify/react";
import Button from "@shared/components/ui/Button";
import FeatureCard from "@shared/components/widgets/FeatureCard";
import StatCard from "@shared/components/widgets/StatCard";
import TrustedCompaniesWrapper from "@shared/components/widgets/brands/TrustedCompaniesWrapper";
import { useUser } from "@app/providers/UserProvider";
import { features, initialStats } from "@shared/components/widgets/config";

const Modal = lazy(() => import("@shared/components/common/Modal"));
const Auth = lazy(() => import("@/features/auth/Auth"));
const CreateOrganization = lazy(
  () => import("@shared/components/widgets/CreateOrganization")
);

const HomeContent: React.FC = () => {
  const { user } = useUser();
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
          <img
            src="https://images.unsplash.com/photo-1531497865142-4b53b0f3b2f2?auto=format&fit=crop&w=1600&q=60"
            alt="background"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <svg
            className="absolute -left-20 -top-10 w-96 h-96 opacity-20"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#6ee7b7"
              d="M43.7,-54.7C56.9,-45.7,69.9,-34.9,73.4,-21.6C76.9,-8.3,70.8,8.5,61.8,22.8C52.9,37.2,41.2,49,27.3,54.6C13.4,60.3,-2.8,59.7,-16.2,55.2C-29.5,50.8,-40.1,42.5,-51.7,31.9C-63.3,21.4,-75.9,8.6,-77.6,-5.6C-79.3,-19.8,-70.1,-35.7,-57.7,-45.4C-45.3,-55,-29.7,-58.3,-14.3,-61.6C1,-64.9,16.9,-68.2,31.8,-64.1C46.6,-60,63.7,-48.2,43.7,-54.7Z"
              transform="translate(100 100)"
            />
          </svg>
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
                Автоматизируйте бизнес.{" "}
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

            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="w-full max-w-[500px] h-[500px] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rotate-45 rounded-lg shadow-xl z-10">
                  <div className="absolute inset-2 bg-white/20 rounded-sm"></div>
                </div>

                <div className="absolute top-8 right-0 w-[280px] h-[140px] rounded-2xl overflow-hidden shadow-2xl z-20">
                  <img
                    src="/images/working-girls.jpg"
                    alt="Professional at desk"
                    className="w-full h-full object-cover"
                  />
                  {/* hover:scale-105 transition-transform duration-300 */}
                </div>

                <div className="absolute top-24 left-0 flex flex-col gap-2 z-5">
                  <div className="w-16 h-6 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"></div>
                  <div className="w-24 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                  <div className="w-16 h-6 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
                </div>

                <div className="absolute top-[180px] left-0 w-[320px] h-[160px] rounded-2xl overflow-hidden shadow-2xl z-20">
                  <img
                    src="/images/working-girl.jpg"
                    alt="Woman working on laptop"
                    className="w-full h-full object-cover"
                  />
                  {/* transform hover:scale-105 transition-transform duration-300 */}
                </div>

                <div className="absolute top-[220px] right-12 w-20 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full shadow-lg z-5">
                  <div className="absolute right-1 top-1 w-8 h-8 bg-white rounded-full"></div>
                </div>

                <div className="absolute top-[300px] right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-500 rounded-tl-[100px] shadow-xl z-5"></div>

                <div className="absolute bottom-20 left-8 w-12 h-12 z-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg rotate-45"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg -rotate-45"></div>
                </div>

                <div className="absolute bottom-0 right-4 w-[280px] h-[140px] rounded-2xl overflow-hidden shadow-2xl z-20">
                  <img
                    src="/images/working-with-team.jpg"
                    alt="Business meeting"
                    className="w-full h-full object-cover"
                  />
                  {/* hover:scale-105 transition-transform duration-300 */}
                </div>

                <div className="absolute bottom-2 right-0 flex gap-2 z-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                  <div className="w-16 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-700/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-pink-600/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full filter blur-2xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
      </header>
      <section id="content">
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
            <CreateOrganization onBaseCreated={() => setShowCreateOrg(false)} />
          </Modal>
        )}
      </Suspense>
    </div>
  );
};

export default HomeContent;
