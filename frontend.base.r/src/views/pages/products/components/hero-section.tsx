import Button from "@/shared/components/ui/button";
import { Icon } from "@iconify/react";
import { useUserStore } from "@shared/stores/userStore";

interface HeroSectionProps {
  data: {
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
  const { user } = useUserStore();

  const hasRequiredProduct = user?.organization?.products.some(
    (product) => product.id === requiredProductId
  );

  const handlePrimaryClick = () => {
    if (hasRequiredProduct) {
      const orgUrl = user?.organization?.url;
      if (orgUrl) window.location.href = orgUrl;
    } else {
      onStartWork?.();
    }
  };

  const handleDemoClick = () => {
    if (demo_url) window.location.href = demo_url;
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
              <Button
                onClick={handlePrimaryClick}
                disabled={!is_active}
                className={`px-6 py-3 rounded font-semibold group/link ${
                  !is_active
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed pointer-events-none"
                    : "text-white bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {hasRequiredProduct ? "Перейти в организацию" : "Начать работу"}
                <Icon
                  icon={"tabler:arrow-badge-right"}
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
    </section>
  );
}
