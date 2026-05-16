import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useApp } from "@/app/providers/AppProvider";
import { Icon } from "@iconify/react";
import { Button, DropdownMenu, FloatingInput } from "@/shared/components";
import { useUserStore } from "@/shared/stores/userStore";
import { usePlanStore } from "@/shared/stores/planStore";
import { useProductStore } from "@/shared/stores/productsStore";
import axiosInstance from "@/shared/services/axiosInstance";
import { useTranslation } from "react-i18next";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Payment = lazy(() => import("@/features/payment/payment"));

interface TariffPlan {
  value: string;
  label: string;
}

const AddProductToOrganization = ({
  organizationId,
  productId,
}: {
  organizationId?: number;
  productId?: number;
}) => {
  const [form, setForm] = useState({
    product: productId ?? 0,
    subscription: "",
    title: "",
    plan: "",
  });
  const { t } = useTranslation("common");
  const { showToast } = useApp();
  const { profile } = useUserStore();
  const { user } = useUserStore();
  const isSubmitting = useRef(false);

  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const { plans: storePlans, loadAll } = usePlanStore();
  const { products } = useProductStore();

  const tariffOptions: TariffPlan[] = storePlans.map((plan) => ({
    value: plan.id.toString(),
    label: plan.name,
  }));

  const selectedPlan = storePlans.find((p) => p.id.toString() === form.plan);
  const planPrice = selectedPlan?.price ?? null;

  const walletBalance = user?.wallet_balance
    ? Number(user.wallet_balance)
    : 0;

  const hasEnoughBalance =
    planPrice === null || walletBalance >= planPrice;

  const handleTariffChange = (value: string) => {
    setForm({ ...form, plan: value });
    setError("");
    setInsufficientBalance(false);
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setLoading(true);
    setError("");
    setInsufficientBalance(false);

    const payload = {
      organization: organizationId ?? 0,
      product: form.product,
      subscription: form.subscription,
      plan: form.plan,
      title: form.title,
    };

    try {
      const response = await axiosInstance.post(
        `/organizations/product/add/`,
        payload
      );

      if (response.data.product_url) {
        setBaseUrl(response.data.product_url);
      }
      showToast("База успешно создана!", "success");
      profile();
    } catch (err: any) {
      const data = err?.response?.data;

      if (err?.response?.status === 402 || data?.error === "insufficient_balance") {
        setInsufficientBalance(true);
        setError(
          `Недостаточно средств на счёте. Баланс: ${walletBalance.toLocaleString()} UZS, требуется: ${planPrice?.toLocaleString() ?? "?"} UZS`
        );
      } else {
        setError(
          data?.detail || data?.message || "Произошла ошибка при добавлении продукта"
        );
      }
      console.error("Error adding product:", err);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleCopy = async () => {
    if (baseUrl) {
      try {
        await navigator.clipboard.writeText(baseUrl);
        showToast("Cкопирован", "success");
      } catch {
        showToast("Невозможно скопировать", "error");
      }
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`space-y-4 ${loading ? "pointer-events-none cursor-wait opacity-70" : ""}`}
      >
        {baseUrl ? (
          <div className="text-center mt-6">
            <h2 className="text-xl font-semibold mb-3 text-[#063e76]">
              База успешно создана!
            </h2>
            <div className="mb-4">
              <label htmlFor="base-url" className="block text-sm text-gray-600 mb-2">
                URL базы
              </label>
              <div className="relative">
                <input
                  id="base-url"
                  type="text"
                  readOnly
                  value={baseUrl}
                  className="w-full pr-16 rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-sm break-words"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Копировать"
                >
                  <Icon icon="mdi:content-copy" width="20" height="20" />
                </button>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Button
                onClick={() => window.open(baseUrl, "_blank")}
                className="inline-flex items-center gap-2"
              >
                <Icon icon="mdi:open-in-new" width={18} />
                Открыть в новой вкладке
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenu
              options={products.map((product: any) => ({
                value: product.id.toString(),
                label: product.title,
              }))}
              value={form.product.toString()}
              onChange={(val) => setForm({ ...form, product: Number(val) })}
              label={t("modals.product.products")}
              className="hidden"
            />

            <FloatingInput
              label={t("modals.product.nameProduct")}
              name="title"
              value={form.title}
              onChange={handleChange}
            />

            <DropdownMenu
              options={tariffOptions}
              value={form.plan}
              onChange={handleTariffChange}
              label={t("modals.product.plan")}
              placeholder={t("modals.product.choosePlan")}
              onOpen={loadAll}
              required
            />

            {form.plan && (
              <div
                className={`rounded-lg border p-3 text-sm flex items-center justify-between gap-2 ${hasEnoughBalance
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                  }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-500">
                    Баланс:{" "}
                    <span
                      className={`font-semibold ${hasEnoughBalance ? "text-green-700" : "text-red-600"
                        }`}
                    >
                      {walletBalance.toLocaleString()} UZS
                    </span>
                  </span>
                  {planPrice !== null && (
                    <span className="text-gray-500">
                      Цена:{" "}
                      <span className="font-semibold text-gray-800">
                        {planPrice.toLocaleString()} UZS
                      </span>
                    </span>
                  )}
                </div>

                {!hasEnoughBalance && (
                  <button
                    type="button"
                    onClick={() => setShowTopupModal(true)}
                    className="shrink-0 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 transition"
                  >
                    Пополнить
                  </button>
                )}

                {hasEnoughBalance && (
                  <Icon
                    icon="mdi:check-circle"
                    className="text-green-500 shrink-0"
                    width={22}
                  />
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <Icon icon="mdi:alert-circle" width={16} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span>{error}</span>
                  {insufficientBalance && (
                    <button
                      type="button"
                      onClick={() => setShowTopupModal(true)}
                      className="text-left underline font-semibold hover:text-red-800 transition"
                    >
                      Пополнить счёт
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button
                type="submit"
                loading={loading}
                disabled={!!form.plan && !hasEnoughBalance}
                className="flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon={"tabler:check"} className="w-4 h-4" />
                {t("commands.create")}
              </Button>
            </div>
          </>
        )}
      </form>

      <Suspense fallback={null}>
        {showTopupModal && (
          <Modal
            open={showTopupModal}
            onClose={() => {
              setShowTopupModal(false);
              profile();
            }}
            title="Пополнить счёт"
          >
            <Payment
              show={showTopupModal}
              onClose={() => {
                setShowTopupModal(false);
                profile();
              }}
              walletTopup={true}
            />
          </Modal>
        )}
      </Suspense>
    </>
  );
};

export default AddProductToOrganization;