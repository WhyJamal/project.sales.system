import React from "react";

interface Props {
  className?: string;
}

export const Container: React.FC<React.PropsWithChildren<Props>> = ({
  className,
  children,
}) => {
  return (
    <div
      className={`${className} min-h-screen bg-gradient-to-br from-blue-600 to-blue-700`}
    >
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-gradient-to-r from-[#04204a] via-[#062046] to-[#071b3f]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 100%)" }}
        ></div>
      </div>

      <div className="absolute inset-0 hidden md:block">
        <div
          className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700"
          style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%, 0 100%)" }}
        ></div>
      </div>

      {children}
    </div>
  );
};
