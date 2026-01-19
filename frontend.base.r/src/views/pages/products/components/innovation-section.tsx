import { InnovationVideo } from './innovation-video';

interface InnovationSectionProps {
  data: {
    title: string;
    bullets: string[];
    features_section_videoID: string;
  };
}

export function InnovationSection({ data }: InnovationSectionProps) {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl mb-6">{data.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <InnovationVideo  videoId={data.features_section_videoID}/>

          <div>
            <h3 className="text-xl mb-4 sm:mb-6">
              Мы помогаем решить следующие задачи:
            </h3>

            <ul className="space-y-3 sm:space-y-4">
              {data.bullets.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

