import React from "react";

const Spinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div
      className="rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin"
      style={{ width: size, height: size }}
    ></div>
  );
};

export default Spinner;
