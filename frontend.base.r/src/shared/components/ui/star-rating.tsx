import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

const StarRating: React.FC<Props> = ({
  value,
  onChange,
  size = 20,
  readOnly = false,
}) => {
  const [hover, setHover] = useState<number | null>(null);

  const displayValue = hover ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${star} star`}
        >
          <Icon
            icon={star <= displayValue ? "mdi:star" : "mdi:star-outline"}
            width={size}
            height={size}
            className={star <= displayValue ? "text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
