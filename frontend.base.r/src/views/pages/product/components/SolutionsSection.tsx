import { useState } from 'react';

export function SolutionsSection() {
  const [activeTab, setActiveTab] = useState('erp');

  const tabs = [
    { id: 'erp', label: 'Облачная ERP-система' },
    { id: 'network', label: 'Бизнес-сети' },
    { id: 'growth', label: 'Управление ростом выручки' },
    { id: 'experience', label: 'Клиентский опыт' },
    { id: 'intelligence', label: 'Искусственный интеллект' },
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl mb-4">
          Решения для отрасли потребительских товаров<br />
          от компании SAP и ее партнеров
        </h2>
        
        <p className="text-gray-700 mb-12">
          Обеспечивайте экономически эффективную трансформацию и устойчивый рост с помощью<br />
          программных <span className="text-blue-600">решений для отрасли потребительских товаров</span>.
        </p>

        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 items-start">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            
          </div>

          <div>
            <h3 className="text-2xl mb-6">
              Готовая к использованию облачная ERP-система
            </h3>
            <p className="text-gray-700 mb-6">
              Оптимизируйте процессы, повышайте гибкость и качество продуктов и услуг с помощью нашей интеллектуальной облачной ERP-системы.
            </p>
            <div className="space-y-4">
              <a href="#" className="block text-blue-600 hover:text-blue-700">
                Подробнее о SAP S/4HANA Cloud Public Edition ›
              </a>
              <a href="#" className="block text-blue-600 hover:text-blue-700">
                Попробовать прямо сейчас ›
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
