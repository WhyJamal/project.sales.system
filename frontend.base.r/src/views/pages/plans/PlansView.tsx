import { useEffect, useState } from "react";
import { usePlanStore } from "@/shared/stores/planStore";
import PricingCard from "./pricing-card";
import PricingTable from "./pricing-table";
import PeriodSelector from "./period-selector";
import { Spinner, Empty, Container } from "@/shared/components";

const PricingPage: React.FC = () => {
  const { plans, features, loadAll, loading } = usePlanStore();
  const [period, setPeriod] = useState(1);

  const calculateTotalPrice = (price: number, period: number) => {
    return price * period;
  };

  const normalizeFeatures = (features: any) => {
    if (Array.isArray(features)) return features;
    if (!features) return [];
    return Object.keys(features).filter((key) => features[key]);
  };

  const formatPrice = (value: number) => `${value.toLocaleString()} сум`;

  useEffect(() => {
    loadAll();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh] w-full">
        <Spinner />
      </div>
    );

  if (!plans || plans.length === 0) return <Empty />;

  return (
    <Container className="relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Тарифные планы
        </h1>
        <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
          Прозрачные условия и гибкие тарифы для бизнеса любого масштаба
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            title={plan.name}
            description={plan.description || ""}
            price={formatPrice(calculateTotalPrice(plan.price, period))}
            period={`за ${period} мес`}
            features={normalizeFeatures(plan.features)}
            highlight={plan.highlight}
          />
        ))}
      </div>

      <div className="relative max-w-full mx-auto px-4 mt-20 mb-10">
        <h2 className="text-2xl font-semibold text-center mb-10 text-white">
          Сравнение тарифов
        </h2>
        <PricingTable features={features || []} />
      </div>

      {/* <div className="relative max-w-7xl mx-auto px-4 mt-20 pb-20 text-center">
        <div className="border border-white/10 rounded-2xl p-10 bg-white/5">
          <h3 className="text-2xl font-semibold text-white">Готовы начать?</h3>
          <p className="mt-3 text-blue-100">
            Выберите тариф и начните работу уже сегодня
          </p>
          <Button variant="secondary" className="mt-3">
            Подключиться
          </Button>
        </div>
      </div> */}
    </Container>
  );
};

export default PricingPage;
