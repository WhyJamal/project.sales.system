import { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import FloatingInput from "@shared/components/ui/input";
import axiosInstance from "@/shared/services/axiosInstance";
import { useUserStore } from "@shared/stores/userStore";
import { Textarea } from "@/shared/components/ui/textarea";

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEdit({ isOpen, onClose }: ProfileEditProps) {
  const { user, setUser } = useUserStore();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone_number: "",
    bio: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        bio: user.bio || "",
        password: "",
        confirm_password: "",
      });
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (form.password && form.password !== form.confirm_password) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        username: form.username,
        email: form.email,
        phone_number: form.phone_number,
        bio: form.bio,
      };
      if (form.password) payload.password = form.password;

      const res = await axiosInstance.patch("/users/me/", payload);
      setUser(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div>
      <div className="space-y-3">
        <FloatingInput
          name="username"
          label="Имя пользователя"
          value={form.username}
          onChange={handleChange}
        />
        <FloatingInput
          name="email"
          type="email"
          label="Email"
          value={form.email}
          onChange={handleChange}
        />
        <FloatingInput
          name="phone_number"
          label="Номер телефона"
          value={form.phone_number}
          onChange={handleChange}
        />
        <Textarea
          rows={3}
          name="bio"
          placeholder="Расскажите нам что-нибудь о себе"
          value={form.bio}
          onChange={handleChange}
          required
        />
        <FloatingInput
          name="password"
          type="password"
          label="Новый пароль"
          value={form.password}
          onChange={handleChange}
        />
        <FloatingInput
          name="confirm_password"
          type="password"
          label="Подтвердите пароль"
          value={form.confirm_password}
          onChange={handleChange}
        />
      </div>

      {error && <div className="text-red-500 text-sm mt-5">{error}</div>}

      <div className="flex justify-end gap-2 mt-6">
        <Button
          size="md"
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          className="flex-1"
        >
          Отменить
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Сохраняется..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
