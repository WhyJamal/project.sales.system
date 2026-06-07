import React, { useEffect, useState } from "react";
import {
  RadioCardGroup,
  RadioCardItem,
  Button,
} from "@shared/components";
import axiosInstance from "@shared/services/axiosInstance";
import { useUserStore } from "@/shared/stores/userStore";
import { usePlanStore } from "@/shared/stores/planStore";

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  productId?: string;
  amount?: number;
  planName?: string;
  walletTopup?: boolean;
  orgProductId?: number;
  renewProductName?: string;
}

const CLICK_SERVICE_ID = import.meta.env.VITE_CLICK_SERVICE_ID;
const CLICK_MERCHANT_ID = import.meta.env.VITE_CLICK_MERCHANT_ID;

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000];

const paymentMethods: RadioCardItem[] = [
  { id: "click", imageSrc: "/images/click.webp" },
  { id: "payme", imageSrc: "/images/payme.webp", disabled: true },
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  onClose,
  productId = "stable-ERP",
  amount,
  planName,
  walletTopup = false,
  orgProductId,
  renewProductName,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(TOPUP_AMOUNTS[1]);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { user, setUser } = useUserStore();
  const { plans, loadPlans } = usePlanStore();

  const isRenew = !!orgProductId;

  useEffect(() => {
    if (isRenew && show) {
      loadPlans();
    }
  }, [isRenew, show]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const walletBalance = Number(user?.wallet_balance ?? 0);

  const finalAmount = walletTopup
    ? customAmount ? Number(customAmount) : topupAmount
    : isRenew
    ? Number(selectedPlan?.price ?? 0)
    : amount ?? 0;

  const hasEnoughBalance = isRenew
    ? selectedPlan ? walletBalance >= Number(selectedPlan.price) : false
    : true;

  const handleRenew = async () => {
    if (!selectedPlanId) {
      setError("Выберите тариф!");
      return;
    }
    if (!hasEnoughBalance) {
      setError(
        `Недостаточно средств. Нужно: ${Number(selectedPlan!.price).toLocaleString()} UZS, ` +
        `баланс: ${walletBalance.toLocaleString()} UZS`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.post("/payments/click/renew/", {
        org_product_id: orgProductId,
        plan_id: selectedPlanId,
      });

      if (res.data.wallet_balance !== undefined && user) {
        setUser({ ...user, wallet_balance: res.data.wallet_balance });
      }

      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Произошла ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleClickPayment = async () => {
    if (!selectedMethod) {
      setError("Выберите способ оплаты!");
      return;
    }
    if (walletTopup && finalAmount < 1000) {
      setError("Минимальная сумма 1 000 UZS");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = walletTopup
        ? {
            organization_id: user?.organization?.inn,
            wallet_topup: true,
            amount: finalAmount,
          }
        : {
            organization_id: user?.organization?.inn,
            plan_id: "starter",
            product_id: productId,
          };

      const res = await axiosInstance.post("/payments/click/create/", payload);
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
      setError(err?.response?.data?.error || "Произошла ошибка. Пожалуйста, попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  // ── РЕЖИМ ПРОДЛЕНИЯ ─────────────────────────────────────────────
  if (isRenew) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-orange-50 p-3 text-center">
          <p className="text-sm text-gray-500">Продление подписки</p>
          {renewProductName && (
            <p className="text-base font-semibold text-gray-700">{renewProductName}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Ваш баланс:{" "}
            <span className="font-bold text-gray-700">
              {walletBalance.toLocaleString()} UZS
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Выберите тариф:</p>
          {plans.filter((p) => p.is_active).length === 0 ? (
            <p className="text-xs text-gray-400">Загрузка...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {plans
                .filter((p) => p.is_active)
                .map((plan) => {
                  const affordable = walletBalance >= Number(plan.price);
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      disabled={!affordable}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition
                        ${isSelected
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : affordable
                          ? "border-gray-200 hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <span className="font-semibold">{plan.name}</span>
                      <span className={`font-bold text-xs ${affordable ? "" : "text-red-400"}`}>
                        {Number(plan.price).toLocaleString()} UZS
                        {!affordable && " — недостаточно средств"}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button
          onClick={handleRenew}
          disabled={loading || !selectedPlanId || !hasEnoughBalance}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
        >
          {loading
            ? "Обработка..."
            : selectedPlan
            ? `Оплатить ${Number(selectedPlan.price).toLocaleString()} UZS с баланса`
            : "Выберите тариф"}
        </Button>
      </div>
    );
  }

  // ── ОБЫЧНЫЙ РЕЖИМ / ПОПОЛНЕНИЕ БАЛАНСА ──────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {walletTopup ? (
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-sm text-gray-500">Текущий баланс</p>
          <p className="text-2xl font-bold text-green-600">
            {walletBalance.toLocaleString()} UZS
          </p>
        </div>
      ) : (
        planName && (
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-sm text-gray-500">Тарифный план</p>
            <p className="text-lg font-bold text-blue-600">{planName}</p>
            <p className="text-2xl font-bold">{finalAmount.toLocaleString()} UZS</p>
          </div>
        )
      )}

      {walletTopup && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Выберите сумму:</p>
          <div className="grid grid-cols-2 gap-2">
            {TOPUP_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setTopupAmount(amt);
                  setCustomAmount("");
                }}
                className={`rounded-lg border py-2 text-sm font-semibold transition ${
                  !customAmount && topupAmount === amt
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {amt.toLocaleString()} UZS
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            placeholder="Введите другую сумму (UZS)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200"
          />
          {finalAmount > 0 && (
            <p className="text-center text-xs text-gray-500">
              Сумма к оплате:{" "}
              <span className="font-bold text-gray-800">
                {finalAmount.toLocaleString()} UZS
              </span>
            </p>
          )}
        </div>
      )}

      <h2 className="font-bold">Выберите способ оплаты:</h2>

      <div className="w-full mx-auto justify-center items-center">
        <RadioCardGroup
          items={paymentMethods}
          selectedId={selectedMethod}
          onSelect={setSelectedMethod}
          className="grid-cols-2"
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <Button
        onClick={handleClickPayment}
        disabled={loading}
        className={`mt-4 w-full text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50 ${
          walletTopup ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading
          ? "Загрузка..."
          : walletTopup
          ? `Пополнить на ${finalAmount.toLocaleString()} UZS`
          : "Оплатить"}
      </Button>
    </div>
  );
};

export default PaymentModal;