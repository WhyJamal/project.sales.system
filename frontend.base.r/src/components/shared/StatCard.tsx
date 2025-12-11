import React from "react";

export interface StatCardProps {
    label: string;
    current: number;
  }

const StatCard: React.FC<StatCardProps> = ({ label, current }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow">
      <div className="text-3xl font-bold text-blue-600">
        {String(current)}
        {label === "Аптайм" && "%"}
      </div>
      <div className="text-gray-600 text-sm mt-1">{label}</div>
    </div>
  );
};

export default StatCard;
