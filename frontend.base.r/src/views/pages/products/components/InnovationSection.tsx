import { Play } from 'lucide-react';

interface InnovationSectionProps {
  data: {
    title: string;
    bullets: string[];
  };
}

export function InnovationSection({ data }: InnovationSectionProps) {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl mb-6">{data.title}</h2>

        <div className="grid grid-cols-2 gap-12 items-center">
          <div className="relative">
            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 shadow-lg">
              <Play className="w-8 h-8 fill-white" />
            </button>
          </div>

          <div>
            <h3 className="text-xl mb-6">
              Мы помогаем решить следующие задачи:
            </h3>

            <ul className="space-y-4">
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
