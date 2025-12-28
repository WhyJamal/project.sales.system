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
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl mb-8">{data.title}</h2>

        <div className="flex gap-4 border-b border-gray-300 mb-12">
          {data.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            Контент для вкладки: <b>{activeTab}</b>
          </div>

          <div>
            <h3 className="text-2xl mb-4">
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
