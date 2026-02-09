import React, { useState, useRef, useEffect } from "react";
import { Star, GripVertical } from "lucide-react";
import { ActionIcon, SmallBtn } from "@shared/components";

interface ProductRowProps {
  row: {
    id: number;
    title: string;
    product_url: string;
    product_name: string;
    plan_name: string;
    subscription_end_date: string;
    chosen?: boolean;
  };
  index: number;
  showActions: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  onToggleChosen: (id: number) => void;
  onClickURL: (url: string) => void;
  onPay: (id: number) => void;
  onUpdateProduct: (
    id: number,
    changes: { title?: string }
  ) => Promise<any>;
}

const ProductRow: React.FC<ProductRowProps> = ({
  row,
  index,
  showActions,
  onDragStart,
  onDragOver,
  onDrop,
  onToggleChosen,
  onClickURL,
  onPay,
  onUpdateProduct,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title ?? "");
  const [isSaving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setTitle(row.title ?? "");  
    }
  }, [row.title, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const finishEditing = async () => {
    if (isSaving) return;
    setEditing(false);
    if ((title ?? "") === (row.title ?? "")) return; 

    setSaving(true);
    try {
      await onUpdateProduct(row.id, { title: title }); 
    } catch (error) {
      setTitle(row.title ?? ""); 
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 hover:scale-99 hover:shadow-lg transition-all duration-200"
    >
      <div className="group flex items-center gap-3 min-w-0 flex-1">
        <div
          draggable
          onDragStart={() => onDragStart(index)}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="cursor-grab opacity-0 group-hover:opacity-100 w-3 h-3 text-gray-500 transition-opacity" />
        </div>

        <button
          onClick={() => onToggleChosen(row.id)}
          className="focus:outline-none"
          aria-label={row.chosen ? "Unmark as favorite" : "Mark as favorite"}
        >
          <Star
            className={`w-3 h-3 ${
              row.chosen ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } hover:text-yellow-300 transition-colors`}
          />
        </button>

        <div className="w-24 font-medium truncate">
          {isEditing ? (
            <input  
              ref={inputRef}
              type="text"
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") inputRef.current?.blur();
              }}
              className="w-full border-b border-gray-300 focus:outline-none"
            />
          ) : (
            <span>{row.title ?? "—"}</span>  
          )}
        </div>

        <div className="w-36 font-medium truncate">
          {row.product_name ?? "—"}
        </div>

        <div className="flex-1 truncate">
          <span className="font-medium">{row.plan_name ?? "—"}</span>
        </div>

        <div className="w-36 flex-1 truncate">
          <SmallBtn
            text="Перейти"
            onClick={() => onClickURL(row.product_url)}
            className="!text-blue-700 hover:!bg-blue-50"
          />
        </div>

        {showActions && (
          <div className="flex items-center justify-end w-44 flex-shrink-0">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1">
              <SmallBtn 
                text="Оплатить"
                onClick={() => onPay(row.id)}
              />
              <ActionIcon icon="archive" />
              <ActionIcon onClick={() => setEditing(true)} icon="Edit" />
            </div>
          </div>
        )}

        <div className="w-36 text-right text-xs text-gray-500">
          {row.subscription_end_date ?? "—"}
        </div>
      </div>
    </div>
  );
};

export default ProductRow;
