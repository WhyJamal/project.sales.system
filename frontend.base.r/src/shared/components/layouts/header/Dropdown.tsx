import React from "react";
import { DropdownSection } from "./navbar.types";

interface DropdownProps {
  sections: DropdownSection[];
  isMobile?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ sections, isMobile = false }) => {
  const columnCount = sections.length;

  if (isMobile) {
    return (
      <div className="rounded-lg p-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold mb-2 text-gray-800 border-b border-gray-300 pb-1 text-sm">
              {section.title}
            </h3>
            <ul className="space-y-1.5 text-gray-600 pl-2">
              {section.items.map((item) => (
                <li key={item.label} className="hover:text-blue-700 cursor-pointer">
                  <a href={item.url} className="block py-1.5 font-normal text-sm">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 top-11 bg-white rounded-sm shadow-xl p-4 sm:p-6 border z-50 grid gap-4 sm:gap-8"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(150px, 1fr))`,
        width: `min(calc(100vw - 2rem), ${Math.min(columnCount * 300, 900)}px)`,
      }}
    >
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-semibold mb-2 text-sm sm:text-base text-gray-800 border-b-2 border-gray-300 pb-1">
            {section.title}
          </h3>
          <ul className="space-y-1 sm:space-y-2 text-gray-600 pl-2 sm:pl-4">
            {section.items.map((item) => (
              <li key={item.label} className="hover:text-blue-700 cursor-pointer text-sm sm:text-base">
                <a href={item.url}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Dropdown;
