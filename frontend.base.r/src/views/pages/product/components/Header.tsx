import { ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="text-gray-400">✓</span>
          <span>О продаже</span>
        </div>
        <div className="flex items-center gap-8">
          <h1 className="text-gray-900">Потребительские товары</h1>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-4">Обзор</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 pb-4">Продукты</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 pb-4">Сценарии использования</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 pb-4">Истории клиентов</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 pb-4">Предстоящие мероприятия</a>
            <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900 pb-4">
              Подробнее
              <ChevronDown className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
