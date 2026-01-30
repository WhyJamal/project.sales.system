import { useEffect, useState } from "react";
import { useProductStore } from "@/shared/stores/productsStore";
import { usePlanStore } from "@/shared/stores/planStore";
import PricingCard from "./pricing-card";
import PricingTable from "./pricing-table";
import PeriodSelector from "./period-selector";
import { Spinner, Empty, Container, RadioCardGroup } from "@/shared/components";

const PricingPage: React.FC = () => {
  const {
    products,
    loadProducts,
    loading: productsLoading,
  } = useProductStore();
  const {
    features,
    loadAll: loadPlansAndFeatures,
    loading: plansLoading,
  } = usePlanStore();
  const [period, setPeriod] = useState(1);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadProducts();
    loadPlansAndFeatures();
  }, []);

  useEffect(() => {
    if (products.length > 0 && selectedProductId === null) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  if (productsLoading || plansLoading)
    return (
      <div className="flex justify-center items-center h-[50vh] w-full">
        <Spinner />
      </div>
    );

  if (!products.length) return <Empty />;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productPlans = selectedProduct?.plans || [];

  const calculateTotalPrice = (price: number, period: number) => price * period;

  const normalizeFeatures = (features: any) => {
    if (Array.isArray(features)) return features;
    if (!features) return [];
    return Object.keys(features).filter((key) => features[key]);
  };

  const formatPrice = (value: number) => `${value.toLocaleString()} сум`;

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

      <div className="relative max-w-7xl mx-auto mb-6">
        <RadioCardGroup
          items={products.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            imageSrc: p.icon,
          }))}
          selectedId={selectedProductId}
          onSelect={(id) => setSelectedProductId(Number(id))}
        />
      </div>

      {productPlans.length > 0 ? (
        <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {productPlans.map((plan) => (
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
      ) : (
        <div className="bg-black/50 rounded-md relative max-w-7xl mx-auto px-4">
          <Empty />
        </div>
      )}

      <div className="relative max-w-full mx-auto px-4 mt-20 mb-10">
        <h2 className="text-2xl font-semibold text-center mb-10 text-white">
          Сравнение тарифов
        </h2>
        <PricingTable features={features || []} />
      </div>
    </Container>
  );
};

export default PricingPage;
