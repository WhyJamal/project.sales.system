import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../../ui/Button";
import worldMap from "@/assets/images/world-map.png";

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
      <div className="absolute inset-0 bg-white opacity-85" />

      <div className="relative z-10 text-center mb-24 mt-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Нам доверяют и крупные, и небольшие компании по всему миру
        </h2>
        <Button className="inline-flex items-center gap-3">
          <Icon icon="mdi:account-group" width={18} />
          Истории успеха наших клиентов
        </Button>
      </div>

      <div className="relative w-full overflow-hidden flex justify-start items-start py-8 mt-8">
        <div className="relative w-full max-w-7xl mx-auto">
          <div
            className={`flex gap-16 items-center whitespace-nowrap animate-scroll ${
              isPaused ? "animation-paused" : ""
            }`}
            style={{ willChange: "transform" }}
          >
            {[...logos, ...logos].map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt={`logo-${index}`}
                className="h-4 md:h-8 object-contain opacity-90 transition hover:scale-105 duration-300 flex-shrink-0"
              />
            ))}{/*  grayscale hover:grayscale-0 */}
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-4 left-28 flex justify-start w-full">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="rounded-full border-black border-2 p-2"
          title={isPaused ? "Start scrolling logos" : "Pause logo animation"}
          aria-label={isPaused ? "Start" : "Pause"}
        >
          <Icon
            icon={
              isPaused
                ? "material-symbols:play-arrow-rounded"
                : "material-symbols:pause-rounded"
            }
            className="w-5 h-5"
          />
        </button>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 15s linear infinite; 
        }
        .animation-paused {
          animation-play-state: paused;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default TrustedCompanies;
