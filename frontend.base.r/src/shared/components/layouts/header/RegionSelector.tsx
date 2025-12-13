import { useState, useRef, useEffect } from "react";
import { Region } from "./navbar.types";
import regionsData from "./config/RegionsData";
interface RegionSelectorProps {
  onCountrySelect?: (country: string) => void;
  children?: React.ReactNode;
}

const RegionSelector = ({
  onCountrySelect,
  children,
}: RegionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedRegion(null);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSearchQuery("");
  };

  const handleBackToRegions = () => {
    setSelectedRegion(null);
    setSearchQuery("");
  };

  const handleCountrySelect = (country: string) => {
    onCountrySelect?.(country);
    setIsOpen(false);
    setSelectedRegion(null);
    setSearchQuery("");
  };

  const filteredCountries =
    selectedRegion?.countries.filter((country) =>
      country.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Язык"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-gray-500 hover:text-blue-900 transition-colors"
      >
        {children}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:bg-transparent">
          <div className="bg-white shadow-2xl w-full h-full sm:w-[360px] sm:h-auto sm:rounded border-0 sm:border sm:border-gray-200 mt-1.5">
            <div className="py-6 sm:py-8 px-4 sm:px-6 border-b border-gray-100">
              <h3 className="text-sm sm:text-[14px] font-semibold text-blue-950 text-center">
                {selectedRegion
                  ? "Выберите Вашу страну"
                  : "Выберите ваш регион"}
              </h3>
            </div>

            <div className="max-h-[calc(100vh-120px)] sm:max-h-[500px] p-4 overflow-y-auto">
              {!selectedRegion ? (
                <div className="py-1 px-1 sm:px-2">
                  {regionsData.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => handleRegionSelect(region)}
                      className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors text-sm sm:text-[15px] text-black font-normal border-b border-gray-100 last:border-b-0"
                    >
                      <span>{region.name}</span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="sm:w-3 sm:h-3"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                    <button
                      onClick={handleBackToRegions}
                      className="flex items-center text-sm sm:text-[14px] text-black hover:text-gray-700"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="mr-2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      <span className="font-normal">{selectedRegion.name}</span>
                    </button>
                  </div>

                  <div className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Поиск"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-[14px] text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 pb-4">
                    {filteredCountries.map((country, index) => (
                      <button
                        key={index}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full text-left py-2.5 hover:text-blue-600 transition-colors text-sm sm:text-[14px] text-gray-800 font-normal"
                      >
                        {country}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="py-4 text-center text-sm sm:text-[14px] text-gray-500">
                        Ничего не найдено
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionSelector;