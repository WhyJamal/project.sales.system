import React, { useState } from "react";
import {
  RadioCardGroup,
  RadioCardItem,
  Button,
} from "@shared/components";
import axiosInstance from "@shared/services/axiosInstance";
import { useUserStore } from "@/shared/stores/userStore";

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  organizationId?: number;
  planId?: number;
  productId?: number;
  amount?: number;
  planName?: string;
}

const CLICK_SERVICE_ID = import.meta.env.VITE_CLICK_SERVICE_ID;
const CLICK_MERCHANT_ID = import.meta.env.VITE_CLICK_MERCHANT_ID;

const paymentMethods: RadioCardItem[] = [
  { id: "click", imageSrc: "/images/click.webp" },
  { id: "payme", imageSrc: "/images/payme.webp", disabled: true },
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  onClose,
  organizationId,
  planId,
  productId='stable-ERP',
  amount=1000,
  planName,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useUserStore();
  

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("To'lov usulini tanlang!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.post("/payments/click/create/", {
        organization_id: user?.organization?.inn,
        plan_id: 'starter',
        product_id: productId,
      });

      const { merchant_trans_id, amount: payAmount } = res.data;

      if (selectedMethod === "click") {
        const params = new URLSearchParams({
          service_id: String(CLICK_SERVICE_ID),
          merchant_id: String(CLICK_MERCHANT_ID),
          amount: String(payAmount),
          transaction_param: merchant_trans_id,
          return_url: `${window.location.origin}/payment/success`,
        });

        window.location.href = `https://my.click.uz/services/pay?${params.toString()}`;
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="flex flex-col gap-4">
      {planName && (
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-sm text-gray-500">Tarif rejasi</p>
          <p className="text-lg font-bold text-blue-600">{planName}</p>
          <p className="text-2xl font-bold">{amount.toLocaleString() || 0} UZS</p>
        </div>
      )}

      <h2 className="font-bold">To'lov usulini tanlang:</h2>

      <div className="w-full mx-auto justify-center items-center">
        <RadioCardGroup
          items={paymentMethods}
          selectedId={selectedMethod}
          onSelect={setSelectedMethod}
          className="grid-cols-2"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        {loading ? "Yuklanmoqda..." : "To'lash"}
      </Button>
    </div>
  );
};

export default PaymentModal;