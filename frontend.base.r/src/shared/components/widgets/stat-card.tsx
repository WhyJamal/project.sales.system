import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion"; // framer-motion qo‘shildi
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
    <motion.div
      className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      whileInView={{ opacity: 1, y: 0, scale: 1 }} 
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <Icon icon={icon} width={25} className="text-blue-600 text-lg" />
        )}
        <span className="text-gray-700 font-semibold">{label}</span>
      </div>

      <div className="text-lg font-bold text-gray-900 tracking-tight">
        {value}
        <span className="text-gray-900">{getSuffix()}</span>
      </div>
    </motion.div>
  );
};

export default StatCard;
