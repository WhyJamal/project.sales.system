import React, { useState, useEffect } from "react";
import { useApp } from "@/app/providers/AppProvider";
import { Icon } from "@iconify/react";
import { Button, DropdownMenu, FloatingInput } from "@/shared/components";
import { useUserStore } from "@/shared/stores/userStore";
import { usePlanStore } from "@/shared/stores/planStore";
import { useProductStore } from "@/shared/stores/productsStore";
import axiosInstance from "@/shared/services/axiosInstance";
import { useTranslation } from "react-i18next";

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

  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const { plans: storePlans, loadAll } = usePlanStore();
  const { products } = useProductStore();

  const tariffOptions: TariffPlan[] = storePlans.map((plan) => ({
    value: plan.id.toString(),
    label: plan.name,
  }));

  const handleTariffChange = (value: string) => {
    setForm({ ...form, plan: value });
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Произошла ошибка при добавлении продукта");
    } finally {
      setLoading(false);
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
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${
        loading ? "pointer-events-none cursor-pointer" : ""
      }`}
    >
      {baseUrl ? (
        <div className="text-center mt-6">
          <h2 className="text-xl font-semibold mb-3 text-[#063e76]">
            База успешно создана!
          </h2>

          <div className="mb-4">
            <label
              htmlFor="base-url"
              className="block text-sm text-gray-600 mb-2"
            >
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

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <Icon icon="mdi:alert-circle" width={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button
              type="submit"
              loading={loading}
              className="flex-1 flex items-center justify-center"
            >
              <Icon icon={"tabler:check"} className="w-4 h-4" />
              {t("commands.create")}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default AddProductToOrganization;
