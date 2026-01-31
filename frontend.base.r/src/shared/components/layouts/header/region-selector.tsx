import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import languageOptions from "./config/regionSelectorData";

interface RegionSelectorProps {
  onCountrySelect?: (country: string) => void;
}

const RegionSelector = ({ onCountrySelect }: RegionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>("ru");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    closeDropdown();
    if (onCountrySelect) onCountrySelect(region);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button aria-label="Язык" onClick={() => setIsOpen(true)} className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
        <img
          src={languageOptions.find((lang) => lang.code === selectedRegion)?.flag}
          alt={selectedRegion ?? ""}
          className="w-5 h-5 object-cover rounded-full border border-gray-300"
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={closeDropdown}></div>

          <div className="fixed inset-0 z-50 flex justify-end sm:absolute sm:inset-auto sm:top-12 sm:right-0 sm:mt-0 sm:bg-transparent">
            <div
              ref={dropdownRef}
              className={`bg-white shadow-2xl w-[85%] max-w-[320px] h-full sm:w-[230px] sm:h-auto sm:rounded border-0 sm:border sm:border-gray-200 ${isClosing ? "mobile-slide-out" : "mobile-slide-in"}`}
            >
              <div className="max-h-[calc(100vh-120px)] sm:max-h-[500px] p-4 overflow-y-auto">
                {languageOptions.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => handleRegionSelect(code)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={flag} alt={code} className="w-6 h-6 object-cover rounded-full border border-gray-300" />
                      <span className="font-normal">{label}</span>
                    </div>
                    {selectedRegion === code && <Icon icon="mdi:check" width={16} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegionSelector;
