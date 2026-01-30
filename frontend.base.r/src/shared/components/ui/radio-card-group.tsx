"use client";

import React from "react";

export interface RadioCardItem {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string;
}

interface RadioCardGroupProps {
  items: RadioCardItem[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  className?: string;
}

export const RadioCardGroup: React.FC<RadioCardGroupProps> = ({
  items,
  selectedId,
  onSelect,
  className = "",
}) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 ${className}`}
    >
      {items.map((item) => {
        const isSelected = selectedId?.toString() === item.id.toString();
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`
              flex items-center gap-4 p-4 border rounded-lg transition-all   
              ${
                isSelected
                  ? "border-blue-500 bg-black/90 shadow-md"
                  : "bg-black/85 border-none"
              }
            `}
          >
            {item.imageSrc && (
              <img
                src={item.imageSrc}
                alt={item.title}
                className="w-12 h-12 object-contain rounded-md"
              />
            )}
            <div className="flex-1 text-left">
              <h3 className="font-medium text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center 
                ${isSelected ? "border-blue-500" : "border-gray-300"}
              `}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
