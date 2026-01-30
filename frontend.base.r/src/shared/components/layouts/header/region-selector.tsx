import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const RegionSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>("ru");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languageOptions = [
    { code: "uz", title:"UZ", label: "O'zbekcha" },
    { code: "ru", title:"RU", label: "Русский" },
    { code: "en", title:"EN", label: "English" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Язык"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10"
      >
        {selectedRegion}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={closeDropdown}
          ></div>

          <div
            className="fixed inset-0 z-50 flex justify-end
                sm:absolute sm:inset-auto sm:top-14 sm:right-0 sm:mt-0 sm:bg-transparent"
          >
            <div
              ref={dropdownRef}
              className={`bg-white shadow-2xl w-[85%] max-w-[320px] h-full sm:w-[230px] sm:h-auto sm:rounded border-0 sm:border sm:border-gray-200 ${
                isClosing ? "mobile-slide-out" : "mobile-slide-in"
              }`}
            >
              <div className="max-h-[calc(100vh-120px)] sm:max-h-[500px] p-4 overflow-y-auto">
                {languageOptions.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => handleRegionSelect(code)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors text-sm sm:text-[15px] text-black font-normal border-b border-gray-100 last:border-b-0"
                  >
                    <span>{label}</span>
                    {selectedRegion === code && (
                      <Icon
                        icon="mdi:check"
                        width={16}
                        className="text-blue-500"
                      />
                    )}
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
