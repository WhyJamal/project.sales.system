import React, { useEffect, useState } from "react";
import axiosInstance from "@shared/services/axiosInstance";
import { Icon } from "@iconify/react";
import { useApp } from "@app/providers/AppProvider";
import { useUserStore } from "@shared/stores/userStore";
import { usePlanStore } from "@/shared/stores/planStore";
import {
  FloatingInput,
  Button,
  DropdownMenu,
  LoaderOverlay,
} from "@/shared/components";
import { useProductStore } from "@/shared/stores/productsStore";

interface Props {
  onBaseCreated: (url: string) => void;
  initialProductId?: number | null;
}

interface TariffPlan {
  value: string;
  label: string;
}

const CreateOrganization: React.FC<Props> = ({ onBaseCreated, initialProductId }) => {
  const [form, setForm] = useState({ name: "", inn: "", tariff_plan: "basic" });
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { setUser } = useUserStore();
  const { plans: storePlans, loadAll } = usePlanStore();
  const { showToast } = useApp();


  const [productOptions, setProductOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>(initialProductId ? [initialProductId] : []);

  
  const { products, loadProducts } = useProductStore();

  useEffect(() => {
    if (products.length === 0) loadProducts();
  }, [products, loadProducts]);
  
  useEffect(() => {
    setProductOptions(
      products.map((p: any) => ({ value: p.id, label: p.title }))
    );
  }, [products]);

  const tariffOptions: TariffPlan[] = storePlans.map((plan) => ({
    value: plan.name,
    label: plan.name,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTariffChange = (value: string) => {
    setForm({ ...form, tariff_plan: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBaseUrl(null);

    try {

      const payload = {
        ...form,
        products: selectedProducts, 
      };

      const res = await axiosInstance.post("/organizations/", payload);

      if (res.data.url) {
        setBaseUrl(res.data.url);
        showToast("База успешно создана!", "success");

        const userRes = await axiosInstance.get("/users/me/");

        setUser(userRes.data);
        //onBaseCreated(res.data.url); //Close modal
      } else {
        const errorMsg = res.data.error || "Произошла ошибка";
        setError(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err: any) {
      console.error(err);

      let errorMsg = "Не удалось подключиться к серверу";

      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data) {
        errorMsg = JSON.stringify(err.response.data);
      }

      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!baseUrl) return;
    try {
      await navigator.clipboard.writeText(baseUrl);
      showToast("Cкопирован", "success");
    } catch {
      showToast("Невозможно скопировать", "error");
    }
  };

  // const handleCancel = () => {
  //   setBaseUrl(null);
  //   setError("");
  //   onBaseCreated("");
  // };

  return (
    <div className="max-w-md mx-auto">
      <LoaderOverlay show={loading} variant="cloud" text="База создается" />

      {baseUrl ? (
        <div className="text-center">
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
              onClick={() => window.open(baseUrl!, "_blank")}
              className="inline-flex items-center gap-2"
            >
              <Icon icon="mdi:open-in-new" width={18} />
              Открыть в новой вкладке
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* <h2 className="text-lg font-semibold text-[#063e76] mb-4 text-center">
            Создать организацию
          </h2> */}

          <FloatingInput
            label="Название организации"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <FloatingInput
            label="Введите ИНН"
            name="inn"
            value={form.inn}
            onChange={handleChange}
            required
          />

          <DropdownMenu
            options={productOptions.map((p: { value: number; label: string }) => ({ value: String(p.value), label: p.label }))}
            value={selectedProducts[0] ? String(selectedProducts[0]) : ""}
            onChange={(val) => {
              const v = Array.isArray(val) ? val : [val];
              setSelectedProducts(v.map((x) => Number(x)));
            }}
            label="Продукт"
            placeholder="Выберите продукт"
          />

          <DropdownMenu
            options={tariffOptions}
            value={form.tariff_plan}
            onChange={handleTariffChange}
            label="Тарифный план"
            placeholder="Выберите тариф"
            onOpen={loadAll}
            required
          />

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <Icon icon="mdi:alert-circle" width={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:database-plus" width={18} />
              Создать базу
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateOrganization;
