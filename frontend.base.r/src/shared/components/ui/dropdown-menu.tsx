import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownMenuProps {
  options: DropdownOption[];
  value: string | string[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onOpen?: () => void; 
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
  onOpen 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && onOpen) {
        onOpen(); 
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className={`
            w-full rounded-md border border-gray-300 px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-left flex items-center justify-between
            transition-colors duration-200
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-900 hover:border-gray-400'
            }
          `}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Icon 
            icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
            width={20} 
            height={20} 
            className="text-gray-400 flex-shrink-0"
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700
                  transition-colors duration-150
                  ${option.value === value 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-900'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;