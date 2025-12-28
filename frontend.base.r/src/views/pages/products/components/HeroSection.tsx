interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    gradient: string;
    photo: string;
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
              <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
                Начать работу!
              </button>

              <button className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded hover:bg-blue-50 transition-colors">
                Попробовать Демо
              </button>
            </div>
          </div>
          <div className="relative w-full h-full">
            <img 
              src={data.photo} 
              alt="working-with-team" 
              className="rounded-lg justify-center items-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
