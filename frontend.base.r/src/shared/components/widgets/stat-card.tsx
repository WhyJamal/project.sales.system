import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion"; 
import { StatCardType } from "./config/types";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  item: StatCardType;
}

const StatCard: React.FC<StatCardProps> = ({ item }) => {
  const { t } = useTranslation("home");
  const { label, value, suffix, icon } = item;

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
        <span className="text-gray-700 font-semibold">{t(label)}</span>
      </div>

      <div className="text-lg font-bold text-gray-900 tracking-tight">
        {value}
        <span className="text-gray-900">{suffix}</span>
      </div>
    </motion.div>
  );
};

export default StatCard;
