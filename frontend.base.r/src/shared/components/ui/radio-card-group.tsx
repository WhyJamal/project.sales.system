export interface RadioCardItem {
  id: string | number;
  title?: string;
  description?: string;
  imageSrc?: string;
  disabled?: boolean;
}

interface RadioCardGroupProps {
  items: RadioCardItem[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  className?: string;
  disabled?: boolean;
}

export const RadioCardGroup: React.FC<RadioCardGroupProps> = ({
  items,
  selectedId,
  onSelect,
  className = "",
  disabled = false,
}) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 ${className}`}
    >
      {items.map((item) => {
        const isSelected = selectedId?.toString() === item.id.toString();
        const hasTitle = !!item.title;
        const isImageOnly = !hasTitle && !!item.imageSrc;
        const isDisabled = disabled || item.disabled;

        return (
          <button
            key={item.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(item.id)}
            className={`
              relative p-4 border rounded-lg transition-all overflow-hidden 
              ${
                isSelected
                  ? "border-blue-500 bg-black/90 shadow-md"
                  : "bg-black/85 border border-black/0"
              }
              ${isImageOnly ? "p-0 h-32" : ""}
            `}
          >
            {isImageOnly && item.imageSrc && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <img
                  src={item.imageSrc}
                  alt={`Option ${item.id}`}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 rounded-lg ${
                  isSelected ? 'bg-black/5' : ''
                }`}></div>
              </div>
            )}
            
            {!isImageOnly && (
              <div className="flex items-center gap-4">
                {item.imageSrc && (
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="w-12 h-12 object-contain rounded-md"
                  />
                )}
                <div className="flex-1 text-left">
                  {item.title && (
                    <h3 className="font-medium text-white">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center 
                    ${isSelected ? "border-blue-500" : "border-gray-300"}
                  `}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            )}
            
            {isImageOnly && (
              <div
                className={`
                  absolute top-2 right-2 w-5 h-5 rounded-full border-2 
                  flex items-center justify-center z-10
                  ${isSelected ? "border-blue-500" : "border-gray-300"}
                `}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};