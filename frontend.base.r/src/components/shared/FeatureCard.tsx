import React from "react";
import { Icon } from "@iconify/react";

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
        <Icon icon={icon} width={20} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
};

export default FeatureCard;
