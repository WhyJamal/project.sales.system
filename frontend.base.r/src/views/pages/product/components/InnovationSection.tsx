import { Play } from 'lucide-react';

export function InnovationSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        <h2 className="text-4xl mb-6">
          Инновационные решения для компаний<br />
          отрасли потребительских товаров
        </h2>
        
        <p className="text-gray-700 mb-12 max-w-3xl">
          Наши решения для отрасли потребительских товаров помогут вам модернизировать внутренние процессы и максимально увеличить скорость и масштабируемость.
        </p>

        <div className="grid grid-cols-2 gap-12 items-center">
          <div className="relative">
            
            <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 shadow-lg transition-colors">
              <Play className="w-8 h-8 fill-white" />
            </button>
          </div>

          <div>
            <h3 className="text-xl mb-6">
              Решения SAP для отрасли потребительских товаров могут вам помочь при решении следующих задач:
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Разработка более экологичных продуктов</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Оптимизация процессов, повышение гибкости и качества продуктов и услуг</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Подключение партнеров по логистике товаров широкого потребления и данных для повышения эффективности сотрудничества и устойчивости цепочек поставок</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Планирование, анализ и оптимизация каналов продаж для обеспечения более рентабельного роста</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Удовлетворение потребностей покупателей на протяжении всей пути к покупке</span>
              </li>
            </ul>
            <a href="#" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-8">
              <span>Смотреть маршрутные карты для отрасли потребительских товаров</span>
              <span>›</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
