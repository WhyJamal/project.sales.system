import React from "react"; 
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { FeatureType } from "./config/types";

interface FeatureCardProps {
  item: FeatureType;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ item }) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
        <Icon icon={item.icon} width={20} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
      <p className="text-sm text-gray-600">{item.desc}</p>
    </motion.div>
  );
};

export default FeatureCard;
