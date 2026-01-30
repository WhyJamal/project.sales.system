import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingInput, PhoneInput, Button } from "@/shared/components";
import { useUserStore } from "@shared/stores/userStore";
import { useApp } from "@app/providers/AppProvider";
import { GoogleLogin } from "@react-oauth/google";
import { Icon } from "@iconify/react";

interface AuthProps {
  closeModal: () => void;
  isRegister: boolean;
  setIsRegister: (v: boolean) => void;
}

const Auth: React.FC<AuthProps> = ({
  closeModal,
  isRegister,
  setIsRegister,
}) => {
  const [formData, setFormData] = useState({
    identifier: "",
    username: "",
    email: "",
    phone_code: "",
    phone_number: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setFormData({
      identifier: "",
      username: "",
      email: "",
      phone_number: "",
      phone_code: "",
      password: "",
    });
    setErrors({});
  };

  const { login, register, googleLogin } = useUserStore();
  const { showToast } = useApp();
  const [isLoading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isRegister) {
        const fullPhone = `${formData.phone_code}${formData.phone_number}`;
        await register({ ...formData, phone_number: fullPhone });
        showToast("Вы успешно зарегистрировались.", "success");
      } else {
        await login(formData.identifier, formData.password);
        showToast("Вы успешно вошли в систему.", "success");
      }

      closeModal();
      resetForm();
    } catch (err: any) {
      if (err.response?.data) {
        const data = err.response.data;
        const newErrors: { [key: string]: string } = {};

        for (let key in data) {
          const msg = Array.isArray(data[key]) ? data[key][0] : data[key];
          const fieldName = key === "phone_number" ? "phone_number" : key;
          newErrors[fieldName] = msg;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
          showToast(err.message || "Ошибка сервера", "error");
        }
      } else {
        showToast(err.message || "Ошибка сервера", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    code: string
  ) => {
    const onlyNumbers = e.target.value.replace(/\D/g, "");
    setFormData({
      ...formData,
      phone_number: onlyNumbers,
      phone_code: code,
    });
    if (errors.phone_number) {
      setErrors({ ...errors, phone_number: "" });
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const token = credentialResponse.credential;

      await googleLogin(token);

      showToast("Вы успешно вошли через Google.", "success");
      closeModal();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Ошибка", "error");
    } finally {
      setLoading(true);
    }
  };

  const errorGoogleLogin = () => {
    showToast("Ошибка авторизации Google", "error");
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  return (
    <div className={!isLoading ? "" : "pointer-events-none cursor-pointer"}>
      <div className="text-center mb-4">
        <p className="text-gray-500 text-sm">
          {isRegister
            ? "Зарегистрируйтесь, чтобы начать работу с вашей учетной записью"
            : "Войдите в систему, указав имя пользователя или адрес электронной почты"}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.form
          key={isRegister ? "register" : "login"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {isRegister && (
            <div>
              <FloatingInput
                label="Имя пользователя"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              {errors.username && (
                <div className="text-red-500 text-xs mt-1 ml-1">
                  {errors.username}
                </div>
              )}
            </div>
          )}

          {isRegister ? (
            <div>
              <FloatingInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && (
                <div className="text-red-500 text-xs mt-1 ml-1">
                  {errors.email}
                </div>
              )}
            </div>
          ) : (
            <div>
              <FloatingInput
                label="Имя или адрес электронной почты"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
              />
              {errors.identifier && (
                <div className="text-red-500 text-xs mt-1 ml-1">
                  {errors.identifier}
                </div>
              )}
            </div>
          )}

          {isRegister && (
            <div>
              <PhoneInput
                label="Номер телефона"
                name="phone_number"
                value={formData.phone_number}
                onChange={handlePhoneChange}
              />
              {errors.phone_number && (
                <div className="text-red-500 text-xs mt-1 ml-1">
                  {errors.phone_number}
                </div>
              )}
            </div>
          )}

          <div>
            <FloatingInput
              label="Пароль"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {errors.password && (
              <div className="text-red-500 text-xs mt-1 ml-1">
                {errors.password}
              </div>
            )}
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-3 text-gray-400 text-sm whitespace-nowrap">
              or sign in with
            </span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="w-full flex justify-center sm:justify-stretch"> */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={errorGoogleLogin}
              theme="outline"
              size="large"
            />
          </div>
          {/* </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2
               border border-gray-300 rounded-md
               px-4 py-2 text-sm
               hover:bg-gray-100 transition"
            >
              <Icon icon="logos:facebook" width={20} height={20} />
              Facebook
            </button> 
          </div> */}

          <div className="flex justify-between items-center mt-5">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-[#063e76] text-sm hover:underline"
            >
              {isRegister
                ? "У вас уже есть учетная запись?"
                : "Создать учетную запись"}
            </button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              className={`font-semibold relative ${
                !isRegister ? "px-16" : ""
              }`}
              loading={isLoading}
            >
              {isRegister ? "Зарегистрироваться" : "Войти"}
            </Button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
};

export default Auth;
