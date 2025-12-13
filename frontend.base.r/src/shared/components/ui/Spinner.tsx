import React from "react";

const Spinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div className="w-5 h-5 flex items-center justify-center">
      <div className="loader"></div>
    </div>
  );
};

export default Spinner;
