export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-green-100 via-green-50 to-yellow-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl mb-6">Потребительские товары</h2>
            <p className="text-gray-700 mb-8 leading-relaxed">
              Превосходите самые смелые ожидания потребителей и обеспечьте устойчивый и рентабельный рост бизнеса в условиях неопределенности.
            </p>
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
                Запросить демонстрацию
              </button>
              <button className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded hover:bg-blue-50 transition-colors">
                Решения для отрасли потребительских товаров
              </button>
            </div>
          </div>
          <div className="relative">
            
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 text-sm text-gray-600 flex items-center gap-1">
        <span>✦</span>
        {/* <span>Переведено при помощи ИИ</span> */}
      </div>
    </section>
  );
}
