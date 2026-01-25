import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../../ui/button";
import worldMap from "@/assets/images/world-map.webp";

interface TrustedCompaniesProps {
  logos: string[];
}

const TrustedCompanies: React.FC<TrustedCompaniesProps> = ({ logos }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!logos || logos.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col items-center justify-center bg-center bg-cover min-h-screen"
      style={{ backgroundImage: `url(${worldMap})` }}
    >
      <div className="absolute inset-0 bg-white/85" />

      <div className="relative z-10 text-center mb-24 mt-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Нам доверяют и крупные, и небольшие компании по всему миру
        </h2>
        <Button className="inline-flex items-center gap-3">
          <Icon icon="mdi:account-group" width={18} />
          Истории успеха наших клиентов
        </Button>
      </div>

      <div className="relative w-full overflow-hidden flex justify-start py-8 mt-8">
        <div className="relative w-full max-w-7xl mx-auto">
          <div
            className={`flex gap-16 items-center whitespace-nowrap animate-scroll ${
              isPaused ? "animation-paused" : ""
            }`}
            style={{ willChange: "transform" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {[...logos, ...logos].map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt={`logo-${index}`}
                className="h-4 md:h-8 object-contain opacity-90 transition-transform duration-300 hover:scale-105 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 left-28 flex justify-start w-full">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="rounded-full border border-gray-300 p-2 bg-white/80 shadow-sm hover:bg-white hover:shadow-md transition-all duration-300 ease-in-out"
          title={isPaused ? "Start scrolling logos" : "Pause logo animation"}
          aria-label={isPaused ? "Start" : "Pause"}
        >
          {isPaused ? (
            <Icon
              icon="material-symbols:play-arrow-rounded"
              className="w-5 h-5 text-gray-800"
            />
          ) : (
            <Icon
              icon="material-symbols:pause-rounded"
              className="w-5 h-5 text-gray-800"
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default TrustedCompanies;
