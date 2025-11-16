import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Country {
  name: string;
  code: string;
  flag: JSX.Element;
  placeholder: string;
}

interface PhoneInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, code: string) => void;
}

const countries: Country[] = [
  {
    name: "Uzbekistan",
    code: "+998",
    flag: <span className="fi fi-uz mr-2"></span>,
    placeholder: "__-___-__-__",
  },
  {
    name: "Russia",
    code: "+7",
    flag: <span className="fi fi-ru mr-2"></span>,
    placeholder: "(___) ___-__-__",
  },
  {
    name: "United States",
    code: "+1",
    flag: <span className="fi fi-us mr-2"></span>,
    placeholder: "(___) ___-____",
  },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name,
  value,
  onChange,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/\D/g, "");
    onChange(e, selectedCountry.code);
  };

  return (
    <div className="flex flex-col w-full relative">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center border border-gray-300 rounded-md overflow-visible bg-white">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:outline-none border-r border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            {selectedCountry.flag}
            <span className="text-gray-700">{selectedCountry.code}</span>
            <svg
              className={`w-3 h-3 ml-1 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 z-50 mt-1 w-56 bg-white border border-gray-300 rounded-sm shadow-lg">
              <ul className="py-1 text-sm text-gray-700 max-h-60 overflow-auto">
                {countries.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center ${
                        selectedCountry.code === country.code
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      }`}
                    >
                      {country.flag}
                      <span className="flex-1">{country.name}</span>
                      <span className="text-gray-500">{country.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          type="tel"
          id={name}
          name={name}
          value={value}
          placeholder={selectedCountry.placeholder} 
          pattern="[0-9\s]+"
          onChange={handleChange}
          className="flex-1 p-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none min-w-0"
        />
      </div>
    </div>
  );
};

export default PhoneInput;
