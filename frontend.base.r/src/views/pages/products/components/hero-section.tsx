import Button from "@/shared/components/ui/button";

interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    gradient: string;
    hero_section_image_url: string;
    primaryBtn?: string;
    secondaryBtn?: string;
  };
}

export function HeroSection({ data }: HeroSectionProps) {
  return (
    <section
      className={`bg-gradient-to-br ${data.gradient} relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl mb-4 sm:mb-6">{data.title}</h2>
            <p className="text-gray-700 mb-6 sm:mb-8 leading-relaxed">
              {data.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="text-white px-6 py-3 rounded font-semibold group/link">
                Начать работу
                <svg
                  className="w-4 h-4 group-hover/link:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>

              <Button
                variant="outline"
                className="text-blue-600 border-2 px-6 py-3"
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
