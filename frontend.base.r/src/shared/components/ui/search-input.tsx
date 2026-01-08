import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";

const SearchInput: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleActive = () => {
    setIsActive(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const closeInput = () => {
    setIsActive(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="hidden sm:flex items-center rounded-full overflow-hidden transition-all duration-300">
    <button
      aria-label="Поиск"
      onClick={isActive ? closeInput : toggleActive}
      className="text-gray-500 hover:text-blue-900 transition-all duration-300"
    >
      <Icon icon="mdi:magnify" width={20} />
    </button>
  
    <input
      ref={inputRef}
      type="text"
      placeholder="Поиск..."
      className={`transition-all duration-300 ease-in-out outline-none py-0.5 px-0.5 
        hidden sm:block
        ${isActive ? "sm:w-36 sm:opacity-100" : "sm:w-0 sm:opacity-0"}
      `}
    />
  </div>
  );
};

export default SearchInput;
