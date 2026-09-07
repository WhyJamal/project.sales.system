import React, {
  useState,
  useRef,
  useEffect,
  Suspense,
  lazy,
} from "react";
import {
  Star,
  GripVertical,
  X,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { ActionIcon, SmallBtn, ConfirmModal } from "@shared/components";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
import { ProductVersions } from "@/types";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Payment = lazy(() => import("@/features/payment/payment"));
const ProductSettingsModal = lazy(
  () => import("@/shared/components/product-settings-modal")
);

interface ProductRowProps {
  row: {
    id: number;
    title: string;
    product_url: string;
    product_id?: number;
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
  onUpdateProduct: (
    id: number,
    changes: { title?: string }
  ) => Promise<void>;
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
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const navigate = useNavigate();

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

    if ((title ?? "") === (row.title ?? "")) {
      return;
    }

    setSaving(true);

    try {
      await onUpdateProduct(row.id, {
        title: title,
      });
    } catch (error) {
      setTitle(row.title ?? "");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowConfirm(false);
    onArchive(row.id);
  };

  return (
    <>
      <div
        onDragOver={onDragOver}
        onDrop={() => onDrop(index)}
        className={`
          w-full min-w-0
          transition-all duration-200
          ${isEditing ? "bg-gray-100" : ""}
          ${isActive
            ? "hover:bg-gray-50"
            : "bg-red-50 opacity-80"
          }
        `}
      >
        {/* =========================================================
            DESKTOP
        ========================================================== */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-2">
          {/* Drag / favorite */}
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            className="flex shrink-0 cursor-grab items-center active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-300" />

            <button
              onClick={() => onToggleChosen(row.id)}
              className="focus:outline-none"
              aria-label={
                row.chosen
                  ? "Unmark as favorite"
                  : "Mark as favorite"
              }
            >
              <Star
                className={`h-3 w-3 ${
                  row.chosen
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                } transition-colors hover:text-yellow-300`}
              />
            </button>
          </div>

          {/* Title */}
          <div className="w-24 shrink-0 truncate font-medium">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputRef.current?.blur();
                  }

                  if (e.key === "Escape") {
                    setTitle(row.title ?? "");
                    setEditing(false);
                  }
                }}
                className="w-full border-b border-gray-300 bg-transparent focus:outline-none"
              />
            ) : (
              <span title={row.title}>
                {row.title ?? "—"}
              </span>
            )}
          </div>

          {/* Product */}
          <div
            className="w-36 shrink-0 truncate font-medium"
            title={row.product_name}
          >
            {row.product_name ?? "—"}
          </div>

          {/* Plan */}
          <div
            className="min-w-0 flex-1 truncate"
            title={row.plan_name}
          >
            <span className="font-medium">
              {row.plan_name ?? "—"}
            </span>
          </div>

          {/* Open / activate */}
          <div className="w-36 shrink-0 flex items-center gap-1">
            {isActive ? (
              <>
                <SmallBtn
                  text="Перейти"
                  textSize="sm"
                  onClick={() => onClickURL(row.product_url)}
                  className="!text-blue-700 hover:!bg-blue-50"
                  icon={<ChevronRight className="h-3 w-3" />}
                />
                <ActionIcon
                  onClick={() => setShowSettingsModal(true)}
                  icon="settings"
                  label="Sozlash"
                />
              </>
            ) : (
              <SmallBtn
                text="Активировать"
                onClick={() => setShowRenewModal(true)}
                className="!border-orange-200 !text-orange-600 hover:!bg-orange-50"
                icon={<RefreshCw className="h-3 w-3" />}
              />
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex w-52 shrink-0 items-center justify-end">
              <div className="flex items-center gap-1">
                <SmallBtn
                  text="Обновления ПО"
                  onClick={() =>
                    navigate(
                      `/product/updates/${row.product_name}/${row.id}/${row.version?.version}`
                    )
                  }
                  className="!text-blue-700 hover:!bg-blue-50"
                  icon={<Info className="h-4 w-4" />}
                  iconPosition="left"
                />

                <ActionIcon
                  onClick={() => setShowConfirm(true)}
                  icon="trash"
                />

                <ActionIcon
                  onClick={() => setEditing(true)}
                  icon="Edit"
                />
              </div>
            </div>
          )}

          {/* Date / status */}
          <div className="w-36 shrink-0">
            <div className="text-right text-xs text-gray-500">
              {formatDate(row.subscription_end_date) ?? "—"}
            </div>

            {isActive ? (
              <div className="text-right text-sm text-green-500">
                Активный
              </div>
            ) : (
              <div className="text-right text-sm text-red-500">
                Неактивный
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            MOBILE
        ========================================================== */}
        <div className="flex w-full min-w-0 items-start gap-2 px-2 py-3 sm:hidden">
          {/* Drag + favorite */}
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            className="flex shrink-0 cursor-grab flex-col items-center gap-2 pt-1 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-300" />

            <button
              onClick={() => onToggleChosen(row.id)}
              className="focus:outline-none"
              aria-label={
                row.chosen
                  ? "Unmark as favorite"
                  : "Mark as favorite"
              }
            >
              <Star
                className={`h-4 w-4 ${
                  row.chosen
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          </div>

          {/* Main mobile content */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="mb-1 flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        inputRef.current?.blur();
                      }

                      if (e.key === "Escape") {
                        setTitle(row.title ?? "");
                        setEditing(false);
                      }
                    }}
                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm font-semibold focus:outline-none"
                  />
                ) : (
                  <div
                    className="truncate text-sm font-semibold text-gray-900"
                    title={row.title}
                  >
                    {row.title || "Без названия"}
                  </div>
                )}
              </div>

              {!isActive && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  Неактивный
                </span>
              )}
            </div>

            {/* Product name */}
            <div
              className="mb-1 truncate text-xs text-gray-600"
              title={row.product_name}
            >
              {row.product_name || "—"}
            </div>

            {/* Plan */}
            <div
              className="truncate text-xs font-medium text-gray-800"
              title={row.plan_name}
            >
              {row.plan_name || "—"}
            </div>

            {/* Date */}
            <div className="mt-1 text-[11px] text-gray-400">
              До: {formatDate(row.subscription_end_date) ?? "—"}
            </div>

            {/* Mobile actions */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {isActive ? (
                <>
                  <SmallBtn
                    text="Перейти"
                    textSize="sm"
                    onClick={() => onClickURL(row.product_url)}
                    className="!text-blue-700 hover:!bg-blue-50"
                    icon={<ChevronRight className="h-3 w-3" />}
                  />
                  <ActionIcon
                    onClick={() => setShowSettingsModal(true)}
                    icon="settings"
                    label="Sozlash"
                  />
                </>
              ) : (
                <SmallBtn
                  text="Активировать"
                  textSize="sm"
                  onClick={() => setShowRenewModal(true)}
                  className="!border-orange-200 !text-orange-600 hover:!bg-orange-50"
                  icon={<RefreshCw className="h-3 w-3" />}
                />
              )}

              {showActions && (
                <>
                  <SmallBtn
                    text="Обновления"
                    textSize="sm"
                    onClick={() =>
                      navigate(
                        `/product/updates/${row.product_name}/${row.id}/${row.version?.version}`
                      )
                    }
                    className="!text-blue-700 hover:!bg-blue-50"
                    icon={<Info className="h-3 w-3" />}
                    iconPosition="left"
                  />

                  <ActionIcon
                    onClick={() => setShowConfirm(true)}
                    icon="trash"
                  />

                  <ActionIcon
                    onClick={() => setEditing(true)}
                    icon="Edit"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
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
        onConfirm={handleDelete}
      />

      {/* Renew modal */}
      <Suspense fallback={null}>
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

      {/* Settings modal (tarif + userlar, prorate) */}
      <Suspense fallback={null}>
        {showSettingsModal && (
          <Modal
            open={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            title="Sozlash"
            widthModal="max-w-xl"
          >
            <ProductSettingsModal
              organizationProductId={row.id}
              productId={row.product_id}
              productTitle={row.product_name || row.title}
              onClose={() => setShowSettingsModal(false)}
            />
          </Modal>
        )}
      </Suspense>
    </>
  );
};

export default ProductRow;

