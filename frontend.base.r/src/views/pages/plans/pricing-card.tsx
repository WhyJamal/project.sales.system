import React from "react";
import { Check } from "lucide-react";
import Button from "@/shared/components/ui/button";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  highlight?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  period = "в месяц",
  features,
  highlight = false,
}) => {
  return (
    <div
      className={`flex flex-col rounded-2xl border min-h-[520px] ${
        highlight
          ? "border-blue-300 shadow-xl ring-2 ring-offset-4"
          : "border-gray-200 shadow-lg"
      } overflow-hidden`}
    >
      <div
        className="px-5 py-6 bg-gradient-to-br from-[#04204a] via-[#062046] to-[#071b3f]"
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-blue-100">{description}</p>

        <div className="mt-4 flex items-end gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-sm text-blue-100">{period}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between bg-white px-5 py-5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-900">
            Что входит в комплект
          </h4>

          <ul className="mt-3 space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-xs text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant={highlight ? 'primary' : 'secondary'}
          className="font-semibold transition-all duration-200"
        >
          Выбрать тариф
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;
