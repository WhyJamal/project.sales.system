import React from "react";
import { Check, X } from "lucide-react";

interface Feature {
  category: string;
  name: string;
  starter: boolean | string;
  growth: boolean | string;
  scale: boolean | string;
}

interface PricingTableProps {
  features: Feature[];
}

const PricingTable: React.FC<PricingTableProps> = ({ features }) => {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
      ) : (
        <X className="w-4 h-4 text-gray-300 mx-auto" />
      );
    }
    return <span className="text-sm font-medium text-gray-800">{value}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">
              Возможности
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              Старт
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              Бизнес
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              Корпоративный
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {features.map((feature, idx) => (
            <React.Fragment key={idx}>
              {feature.category && (
                <tr className="bg-gray-50">
                  <td
                    colSpan={4}
                    className="py-3 px-6 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {feature.category}
                  </td>
                </tr>
              )}

              <tr className="hover:bg-gray-50 transition">
                <td className="py-4 px-6 text-sm text-gray-700">
                  {feature.name}
                </td>
                <td className="py-4 px-4 text-center">
                  {renderValue(feature.starter)}
                </td>
                <td className="py-4 px-4 text-center">
                  {renderValue(feature.growth)}
                </td>
                <td className="py-4 px-4 text-center">
                  {renderValue(feature.scale)}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;
    