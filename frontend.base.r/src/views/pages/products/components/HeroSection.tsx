interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    gradient: string;
    primaryBtn: string;
    secondaryBtn: string;
  };
}

export function HeroSection({ data }: HeroSectionProps) {
  return (
    <section
      className={`bg-gradient-to-br ${data.gradient} relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl mb-6">{data.title}</h2>

            <p className="text-gray-700 mb-8 leading-relaxed">
              {data.description}
            </p>

            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
                {data.primaryBtn}
              </button>

              <button className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded hover:bg-blue-50 transition-colors">
                {data.secondaryBtn}
              </button>
            </div>
          </div>

          <div className="relative">{/* image / video */}</div>
        </div>
      </div>
    </section>
  );
}
