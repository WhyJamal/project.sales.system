import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import FloatingInput from "@/shared/components/ui/input";
import PhoneInput from "@shared/components/ui/phone-input";
import { useUser } from "@app/providers/UserProvider";
import { Icon } from "@iconify/react";
import { useApp } from "@app/providers/AppProvider";

interface AuthProps {
  closeModal: () => void;
}

const Auth: React.FC<AuthProps> = ({ closeModal }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    username: "",
    email: "",
    phone_code: "",
    phone_number: "",
    password: "",
  });

  const { login, register } = useUser();
  const { showToast, showLoader, hideLoader } = useApp();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader();
    try {
      if (isRegister) {
        const fullPhone = `${formData.phone_code}${formData.phone_number}`;

        await register({
          ...formData,
          phone_number: fullPhone,
        });

        showToast("Вы успешно зарегистрировались.", "success");
      } else {
        await login(formData.identifier, formData.password);
        showToast("Вы успешно вошли в систему.", "success");
      }
      closeModal();
      setFormData({
        identifier: "",
        username: "",
        email: "",
        phone_number: "",
        phone_code: "",
        password: "",
      });
    } catch (err: any) {
      console.error(err.response?.data || err);
      const errorMessage = err.response?.data?.message || "Ошибка";
      showToast(errorMessage, "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-[#063e76] mb-1">
          {isRegister ? "Создать аккаунт" : "С возвращением"}
        </h2>
        <p className="text-gray-500 text-sm">
          {isRegister
            ? "Зарегистрируйтесь, чтобы начать работу с вашей учетной записью"
            : "Войдите в систему, указав имя пользователя или адрес электронной почты"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={isRegister ? "register" : "login"}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {isRegister && (
            <FloatingInput
              label="Имя пользователя"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          )}
          {isRegister ? (
            <FloatingInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          ) : (
            <FloatingInput
              label="Имя или адрес электронной почты"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
            />
          )}
          {isRegister && (
            <PhoneInput
              label="Номер телефона"
              name="phone_number"
              value={formData.phone_number}
              onChange={(e, code) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                setFormData({
                  ...formData,
                  phone_number: onlyNumbers,
                  phone_code: code,
                });
              }}
            />
          )}
          <FloatingInput
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {isRegister && (
            <>
              <div className="flex items-center my-4">
                <span className="flex-grow border-t border-gray-300"></span>
                <span className="mx-2 text-gray-400 text-sm">
                  or sign in with
                </span>
                <span className="flex-grow border-t border-gray-300"></span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <Icon icon="logos:google-icon" width={20} height={20} />
                  Google
                </button>

                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <Icon icon="logos:facebook" width={20} height={20} />
                  Facebook
                </button>
              </div>
            </>
          )}

          <div className="flex justify-between items-center mt-5">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#063e76] text-sm hover:underline"
            >
              {isRegister
                ? "У вас уже есть учетная запись?"
                : "Создать учетную запись"}
            </button>
            <Button variant="primary" size="md" type="submit">{isRegister ? "Зарегистрироваться" : "Войти"}</Button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
};

export default Auth;
