import React from "react";

interface FloatingInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean; 
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  readOnly = false, 
}) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly} 
        className={`peer w-full border border-gray-300 
          rounded-md px-3 pt-4 pb-1 text-gray-900 placeholder-transparent 
          focus:outline-none focus:border-[#063e76] transition 
          ${readOnly ? "bg-white/50 cursor-not-allowed" : ""}`} 
        placeholder={label}
      />

      <label
        htmlFor={name}
        className={`absolute left-3 -top-2 text-gray-500 text-sm 
          peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
          peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#063e76] 
          bg-white px-1 transition-all duration-200`}
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    </div>
  );
};

export default FloatingInput;
