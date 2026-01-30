import React, { useState } from "react";
import axiosInstance from "@shared/services/axiosInstance";
import { Icon } from "@iconify/react";
import { useApp } from "@app/providers/AppProvider";
import { useUserStore } from "@shared/stores/userStore";
import { FloatingInput, Button } from "@/shared/components";
import { fetchOrgByInn } from "@/shared/services/organizationService";

interface Props {
  onBaseCreated: () => void;
}

const CreateOrganization: React.FC<Props> = ({ onBaseCreated }) => {
  const [form, setForm] = useState({ name: "", inn: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useApp();

  const { user, profile } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "inn") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 12) return;

      setForm({ ...form, inn: digitsOnly });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const validateInn = (inn: string) => {
    if (inn.length !== 9 && inn.length !== 12) {
      return { status: false, message: "ИНН должен содержать 9 или 12 цифр" };
    }
  
    return { status: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { status, message } = validateInn(form.inn);

    if (!status) {
      setError(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        owner: user?.id,
      };

      const res = await axiosInstance.post("/organizations/", payload);

      if (res.data) {
        showToast("База успешно создана!", "success");

        profile();
        onBaseCreated();
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

  const hansleOrgByInn = async (inn: string) => {
    const { status, message } = validateInn(inn);
  
    if (!status) {
      setError(message);
      return;
    }
  
    setLoading(true);
    setError("");
  
    const res = await fetchOrgByInn(inn);
  
    if (res.success && res.name) {
      setForm((prev) => ({
        ...prev,
        name: res.name || prev.name,
        inn: res.inn || prev.inn,
        address: res.address || prev.address,
      }));
  
      showToast("Организация найдена", "success");
    } else {
      showToast(res.message || "Организация не найдена", "info");
    }
  
    setLoading(false);
  };
  

  return (
    <div
      className={`max-w-md mx-auto ${
        loading ? "pointer-events-none cursor-pointer" : ""
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FloatingInput
          label="Название организации"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <div className="flex gap-4 justify-center items-center">
          <FloatingInput
            label="Введите ИНН"
            name="inn"
            value={form.inn}
            onChange={handleChange}
            required
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => hansleOrgByInn(form.inn)}
            className="font-semibold"
            loading={loading}
          >
            Заполнить
          </Button>
        </div>

        <FloatingInput
          label="Адрес"
          name="address"
          value={form.address}
          onChange={handleChange}
        />

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <Icon icon="mdi:alert-circle" width={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button type="submit" loading={loading} className="flex-1  flex">
            <Icon icon="mdi:database-plus" width={18} />
            Создать организацию
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrganization;
