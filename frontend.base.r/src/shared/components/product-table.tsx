import React, { Suspense, lazy, useState } from "react";
import {
  Inbox,
  LucideTimer,
  RefreshCw,
  MoreVertical,
  CreditCard,
  Bookmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Empty, IconBtn, ProductRow, Tab } from "@shared/components";
import { Icon } from "@iconify/react";
import { OrganizationProduct } from "@/types";

import { useProductTable } from "@/hooks/useProductTable";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Payment = lazy(() => import("@/features/payment/payment"));

interface Props {
  products?: OrganizationProduct[];
  showActions?: boolean;
}

const ProductTable: React.FC<Props> = ({ products, showActions = true }) => {
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

  const clickURL = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const createBase = () => {
    navigate("/products");
  };

  //
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const openPaymentModal = (productId: number) => {
    setSelectedProductId(productId);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedProductId(null);
  };

  return (
    <div className="bg-white text-sm border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Button
              onClick={createBase}
              size="sm"
              variant="outline"
              className="text-sm px-4 py-0.5 font-semibold"
            >
              Создать базу
            </Button>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <IconBtn onClick={refreshTable} ariaLabel="Refresh">
                <RefreshCw className="w-4 h-4" />
              </IconBtn>

              <IconBtn>
                <MoreVertical className="w-4 h-4" />
              </IconBtn>
            </div>
          )}
        </div>
      </div>

      <div className="border-b px-3">
        <div className="flex justify-between gap-6">
          <div className="flex gap-7">
            <Tab
              active={activeTab === "inbox"}
              onClick={() => setActiveTab("inbox")}
              icon={<Bookmark className="w-4 h-4" />}
              label="Наименование"
            />
            <Tab
              active={activeTab === "product"}
              onClick={() => setActiveTab("product")}
              icon={<Inbox className="w-4 h-4" />}
              label="Продукты"
            />
            <Tab
              active={activeTab === "tariff"}
              onClick={() => setActiveTab("tariff")}
              icon={<CreditCard className="w-4 h-4" />}
              label="Тариф"
            />
          </div>
          <Tab
            active={activeTab === "endDate"}
            onClick={() => setActiveTab("endDate")}
            icon={<LucideTimer className="w-4 h-4" />}
            label="Дата окончания"
          />
        </div>
      </div>

      <div className="p-2">
        <div className="divide-y max-h-64 overflow-y-auto overflow-x-auto">
          {!isLoading ? (
            rows.length > 0 ? (
              rows.map((row, index) => (
                <ProductRow
                  key={row.id}
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
                />
              ))
            ) : (
              <div className="text-center text-gray-500">
                <Empty />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-10">
              <Icon
                icon="line-md:loading-twotone-loop"
                className="w-6 h-6 animate-spin"
              />
            </div>
          )}
        </div>
      </div>

      <Suspense>
        {showPaymentModal && (
          <Modal
            open={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            title="Оплата"
          >
            <Payment
              show={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
            />
          </Modal>
        )}
      </Suspense>
    </div>
  );
};

export default ProductTable;
