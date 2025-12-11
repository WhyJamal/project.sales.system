import React from "react";
import { DropdownSection } from "./navbar.types";
interface DropdownProps {
  sections: DropdownSection[];
}

const Dropdown: React.FC<DropdownProps> = ({ sections }) => {
  const columnCount = sections.length;

  return (
    <div
      className="absolute left-0 top-11 bg-white rounded-sm shadow-xl p-6 border z-50 grid gap-8"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(200px, 1fr))`,
        width: `${Math.min(columnCount * 300, 900)}px`,
      }}
    >
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-semibold mb-2 text-gray-800 border-b-2 border-gray-300 pb-1">
            {section.title}
          </h3>
          <ul className="space-y-2 text-gray-600 pl-4">
            {section.items.map((item) => (
              <li
                key={item.label}
                className="hover:text-blue-700 cursor-pointer"
              >
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
