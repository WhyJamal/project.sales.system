import React from "react";
import { Icon } from "@iconify/react";
import { StatCardType } from "./config/types";

interface StatCardProps {
  item: StatCardType;
}

const StatCard: React.FC<StatCardProps> = ({ item }) => {
  const { label, value, icon } = item;

  const getSuffix = () => {
    switch (label) {
      case "Аптайм":
        return "%";
      case "Поддержка 24/7":
        return "ч";
      case "ROI в год":
        return "%";
      case "Клиенты":
        return "+";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <Icon icon={icon} width={25} className="text-blue-600 text-lg" />
        )}
        <span className="text-gray-700 font-semibold">{label}</span>
      </div>

      <div className="text-lg font-bold text-gray-900 tracking-tight">
        {value}
        <span className="text-blue-600">{getSuffix()}</span>
      </div>
    </div>
  );
};

export default StatCard;
