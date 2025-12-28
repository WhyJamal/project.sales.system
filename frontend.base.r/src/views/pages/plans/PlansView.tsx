import React from "react";
import PricingCard from "./PricingCard";
import PricingTable from "./PricingTable";
import Button from "@/shared/components/ui/Button";
import { plans, features } from "@/shared/data/pricingData";

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-700"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        ></div>
      </div>

      <div className="absolute inset-0 hidden md:block">
        <div
          className="w-full h-full bg-gradient-to-br from-[#04204a] via-[#062046] to-[#071b3f]"
          style={{ clipPath: "polygon(0 50%, 100% 0, 100% 50%, 0 100%)" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
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
        <h2 className="text-2xl font-semibold text-center mb-10">
          Сравнение тарифов
        </h2>
        <PricingTable features={features} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 mt-20 pb-20 text-center">
        <div className="border border-white/10 rounded-2xl p-10 bg-white/5">
          <h3 className="text-2xl font-semibold">Готовы начать?</h3>
          <p className="mt-3 text-blue-100">
            Выберите тариф и начните работу уже сегодня
          </p>
          <Button variant="secondary" className="mt-3">
            Подключиться
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
