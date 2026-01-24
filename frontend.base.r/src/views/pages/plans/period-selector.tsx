import React, { useMemo } from "react";

const periods = [
  { value: 1, label: "1 мес", title: "Стандартная цена" },
  { value: 3, label: "3 мес", title: "Выгоднее" },
  { value: 6, label: "6 мес", title: "Популярный выбор" },
  { value: 12, label: "12 мес", title: "Максимальная выгода" },
  { value: 24, label: "24 мес", title: "Самый выгодный" },
];

interface PeriodSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const activePeriod = periods.find(p => p.value === value);
  const currentIndex = periods.findIndex(p => p.value === value);

  const trackPercentage = useMemo(() => {
    return (currentIndex / (periods.length - 1)) * 100;
  }, [currentIndex]);

  return (
    <div className="max-w-4xl mx-auto px-4 mb-16">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="mt-1 text-sm text-blue-100 text-center">
          Выберите план, который подходит для вашего бизнеса
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm text-blue-100">Период оплаты:</span>
            <span className="text-xs text-blue-200">
              {activePeriod?.title}
            </span>
          </div>

          <div className="relative py-4">
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-blue-900/50 rounded-full transform -translate-y-1/2"></div>
            
            <div 
              className="absolute top-1/2 left-0 h-2 bg-blue-500 rounded-full transform -translate-y-1/2"
              style={{ width: `${trackPercentage}%` }}
            ></div>
            
            <div className="absolute top-1/2 left-0 right-0 flex justify-between pointer-events-none">
              {periods.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 ${
                    idx <= currentIndex
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white/10 border-white/30'
                  } transform -translate-y-1/2 transition-all duration-200`}
                />
              ))}
            </div>
            
            <input
              type="range"
              min={0}
              max={periods.length - 1}
              step={1}
              value={currentIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                onChange(periods[idx].value);
              }}
              className="absolute top-1/2 left-0 right-0 w-full h-2 opacity-0 cursor-pointer transform -translate-y-1/2"
            />
            
            <div 
              className="absolute top-1/2 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg transform -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${trackPercentage}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
                {activePeriod?.label}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6 text-xs text-blue-100">
            {periods.map((p, idx) => (
              <div key={p.value} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onChange(p.value)}
                  className={`mb-1 transition-colors hover:text-white ${
                    value === p.value ? 'text-white font-medium' : ''
                  }`}
                >
                  {p.label}
                </button>
                <div className={`h-1 w-1 rounded-full ${
                  idx <= currentIndex ? 'bg-blue-500' : 'bg-white/30'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodSelector;