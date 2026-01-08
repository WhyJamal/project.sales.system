import React from "react";

const Spinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
      <div className="loader"></div>
  );
};

export default Spinner;
