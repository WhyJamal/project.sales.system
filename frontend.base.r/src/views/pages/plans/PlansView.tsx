import React from "react";
import PricingCard from "./pricing-card";
import PricingTable from "./pricing-table";
import Button from "@/shared/components/ui/button";
import { plans, features } from "@/shared/data/pricingData";
import { Container } from "@/shared/components/container";

const PricingPage: React.FC = () => {
  return (
    <Container className="relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Тарифные планы
        </h1>
        <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
          Прозрачные условия и гибкие тарифы для бизнеса любого масштаба
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <PricingCard key={index} {...plan} />
        ))}
      </div>

      <div className="relative max-w-full mx-auto px-4 mt-20">
        <h2 className="text-2xl font-semibold text-center mb-10 text-white">
          Сравнение тарифов
        </h2>
        <PricingTable features={features} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 mt-20 pb-20 text-center">
        <div className="border border-white/10 rounded-2xl p-10 bg-white/5">
          <h3 className="text-2xl font-semibold text-white">Готовы начать?</h3>
          <p className="mt-3 text-blue-100">
            Выберите тариф и начните работу уже сегодня
          </p>
          <Button variant="secondary" className="mt-3">
            Подключиться
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default PricingPage;
