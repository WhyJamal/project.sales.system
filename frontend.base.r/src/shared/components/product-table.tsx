import React, { Suspense, lazy, useState } from "react";
import {
  Inbox,
  LucideTimer,
  RefreshCw,
  CreditCard,
  Bookmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Empty,
  IconBtn,
  ProductRow,
  Tab,
} from "@shared/components";
import { Icon } from "@iconify/react";
import { OrganizationProduct } from "@/types";

import { useProductTable } from "@/hooks/useProductTable";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Payment = lazy(() => import("@/features/payment/payment"));

interface Props {
  products?: OrganizationProduct[];
  showActions?: boolean;
}

const ProductTable: React.FC<Props> = ({
  products,
  showActions = true,
}) => {
  const navigate = useNavigate();

  const {
    rows,
    isLoading,
    activeTab,
    setActiveTab,
    refreshTable,
    handleUpdateProduct,
    handleToggleChosen,
    handleArchiveProduct,
    dragDrop,
  } = useProductTable(products);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const clickURL = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const createBase = () => {
    navigate("/products");
  };

  const openPaymentModal = (productId: number) => {
    setSelectedProductId(productId);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedProductId(null);
  };

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-white">
      {/* Header */}
      <div className="border-b px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              Продукты
            </h2>
          </div>

          {showActions && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={createBase}
                className="hidden sm:flex"
              >
                Создать базу
              </Button>

              <IconBtn onClick={refreshTable} ariaLabel="Refresh">
                <RefreshCw className="h-4 w-4" />
              </IconBtn>
            </div>
          )}
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden border-b px-3 sm:block sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-6">
          <div className="flex min-w-0 gap-7">
            <Tab
              icon={<Bookmark className="h-4 w-4" />}
              label="Наименование"
            />

            <Tab
              icon={<Inbox className="h-4 w-4" />}
              label="Продукты"
            />

            <Tab
              icon={<CreditCard className="h-4 w-4" />}
              label="Тариф"
            />
          </div>

          <Tab
            icon={<LucideTimer className="h-4 w-4" />}
            label="Дата окончания"
          />
        </div>
      </div>

      {/* Mobile controls */}
      {showActions && (
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 sm:hidden">
          <span className="text-xs text-gray-500">
            {rows.length} {rows.length === 1 ? "продукт" : "продуктов"}
          </span>

          <Button
            size="sm"
            variant="primary"
            onClick={createBase}
            className="h-8 px-3 text-xs"
          >
            Создать базу
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="w-full min-w-0 p-2 sm:p-3">
        <div className="w-full min-w-0 divide-y overflow-hidden">
          {!isLoading ? (
            rows.length > 0 ? (
              rows.map((row, index) => (
                <div
                  key={row.id}
                  className="w-full min-w-0 overflow-hidden"
                >
                  <ProductRow
                    row={row}
                    index={index}
                    showActions={showActions}
                    onUpdateProduct={handleUpdateProduct}
                    onDragStart={dragDrop.handleDragStart}
                    onDragOver={dragDrop.handleDragOver}
                    onDrop={dragDrop.handleDrop}
                    onToggleChosen={handleToggleChosen}
                    onClickURL={clickURL}
                    onArchive={handleArchiveProduct}
                    onPay={openPaymentModal}
                    isActive={
                      row.subscription_end_date
                        ? new Date(row.subscription_end_date) > new Date()
                        : false
                    }
                  />
                </div>
              ))
            ) : (
              <div className="flex min-h-[120px] items-center justify-center px-4 text-center text-gray-500">
                <Empty />
              </div>
            )
          ) : (
            <div className="flex h-24 items-center justify-center">
              <Icon
                icon="line-md:loading-twotone-loop"
                className="h-6 w-6 animate-spin"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      <Suspense fallback={null}>
        {showPaymentModal && (
          <Modal
            open={showPaymentModal}
            onClose={closePaymentModal}
            title="Оплата"
          >
            <Payment
              show={showPaymentModal}
              onClose={closePaymentModal}
            />
            {/* productId={selectedProductId} */}
          </Modal>
        )}
      </Suspense>
    </div>
  );
};

export default ProductTable;

