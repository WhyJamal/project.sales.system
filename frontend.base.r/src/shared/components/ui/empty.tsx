import React from "react";

interface EmptyProps {
  message?: string;
  imgSrc?: string;
}

const Empty: React.FC<EmptyProps> = ({
  message = "No data",
  imgSrc = "/images/empty.png",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 w-full select-none pointer-events-none">
      <img
        src={imgSrc}
        alt="Empty"
        className="max-w-xs w-24 h-24 object-contain"
      />
      <p className="mt-4 text-gray-500 text-center">{message}</p>
    </div>
  );
};

export default Empty;
