import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { Star, GripVertical, X, ChevronRight, RefreshCw, Info } from "lucide-react";
import { ActionIcon, SmallBtn, ConfirmModal } from "@shared/components";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
import { ProductVersions } from "@/types";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Payment = lazy(() => import("@/features/payment/payment"));

interface ProductRowProps {
  row: {
    id: number;
    title: string;
    product_url: string;
    product_name: string;
    plan_name: string;
    subscription_end_date: string;
    chosen?: boolean;
    version?: ProductVersions;
  };
  index: number;
  showActions: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  onToggleChosen: (id: number) => void;
  onClickURL: (url: string) => void;
  onPay: (id: number) => void;
  onArchive: (id: number) => void;
  onUpdateProduct: (id: number, changes: { title?: string }) => Promise<any>;
  isActive: boolean;
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
  onArchive,
  onUpdateProduct,
  isActive,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title ?? "");
  const [isSaving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const [showRenewModal, setShowRenewModal] = useState(false);

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
    <>
      <div
        onDragOver={onDragOver}
        onDrop={() => onDrop(index)}
        className={`flex items-center gap-2 px-2 py-1 hover:scale-99 hover:shadow-lg transition-all duration-200
          ${isEditing ? "bg-gray-100" : ""}
          ${isActive ? "hover:bg-gray-50" : "bg-red-50 opacity-80"}
        `}
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
              className={`w-3 h-3 ${row.chosen
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
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
            {isActive ? (
              <SmallBtn
                text="Перейти"
                textSize="sm"
                onClick={() => onClickURL(row.product_url)}
                className="!text-blue-700 hover:!bg-blue-50"
                icon={<ChevronRight className="w-3 h-3" />}
              />
            ) : (
              <SmallBtn
                text="Активировать"
                onClick={() => setShowRenewModal(true)}
                className="!text-orange-600 hover:!bg-orange-50 !border-orange-200"
                icon={<RefreshCw className="w-3 h-3" />}
              />
            )}
          </div>

          {showActions && (
            <div className="flex items-center justify-end w-52 flex-shrink-0">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1">
                <SmallBtn
                  text="Обновления ПО"
                  onClick={() => navigate(`/product/updates/${row.product_name}/${row.version?.version}`)}
                  className="!text-blue-700 hover:!bg-blue-50"
                  icon={<Info className="w-4 h-4" />}
                  iconPosition="left"
                />
                <ActionIcon onClick={() => setShowConfirm(true)} icon="trash" />
                <ActionIcon onClick={() => setEditing(true)} icon="Edit" />
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <div className="w-36 text-right text-xs text-gray-500">
              {formatDate(row.subscription_end_date) ?? "—"}
            </div>
            {!isActive ? (
              <div className="w-36 text-right text-sm text-red-500">
                Неактивный
              </div>
            ) : (
              <div className="w-36 text-right text-sm text-green-500">
                Активный
              </div>
            )}
          </div>

        </div>

        <ConfirmModal
          isOpen={showConfirm}
          title="Удалить базу"
          message={
            <>
              Вы действительно хотите удалить базу?
              <br />
              После удаления восстановление возможно только через
              администратора.
            </>
          }
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            onArchive(row.id);
          }}
        />
      </div>

      <Suspense>
        {showRenewModal && (
          <Modal
            open={showRenewModal}
            onClose={() => setShowRenewModal(false)}
            title="Продлить срок действия продукта"
          >
            <Payment
              show={showRenewModal}
              onClose={() => setShowRenewModal(false)}
              orgProductId={row.id}
              renewProductName={row.product_name || row.title}
            />
          </Modal>
        )}
      </Suspense>
    </>
  );
};

export default ProductRow;