import { useState } from 'react';

interface SolutionsSectionProps {
  data: {
    title: string;
    tabs: { id: string; label: string }[];
  };
}

export function SolutionsSection({ data }: SolutionsSectionProps) {
  const [activeTab, setActiveTab] = useState(data.tabs[0]?.id);

  return (
    <section className="bg-gray-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl mb-6 sm:mb-8">{data.title}</h2>

        <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-gray-300 mb-8 sm:mb-12">
          {data.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-sm ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            Контент для вкладки: <b>{activeTab}</b>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl mb-2 sm:mb-4">
              Готовое ERP-решение
            </h3>
            <p className="text-gray-700">
              Масштабируемая платформа для роста бизнеса.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

