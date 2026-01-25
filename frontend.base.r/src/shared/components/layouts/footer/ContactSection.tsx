import React, { useState, Suspense, lazy, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  FloatingInput,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components";

import { useUserStore } from "@shared/stores/userStore";
import axiosInstance from "@/shared/services/axiosInstance";
import { useApp } from "@/app/providers/AppProvider";
import { CONTACT_INFO, WORK_TIME } from "./contact.config";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactSection() {
  const { user } = useUserStore();
  const { showToast, showLoader, hideLoader } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function sendContact(data: FormData) {
    try {
      const res = await axiosInstance.post("/contact/", data);
      return res.data;
    } catch (err: any) {
      throw new Error(
        err.response?.data?.detail || err.message || "Ошибка при отправке"
      );
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!user) {
      setPendingSubmit(formData);
      setShowAuthModal(true);
      return;
    }

    const payload: FormData = {
      ...formData,
      email: formData.email || user.email || "",
      name: formData.name || user.username || "",
    };

    try {
      setSending(true);
      await sendContact(payload);
      showToast(
        "Сообщение успешно отправлено! На вашу почту придёт подтверждение.",
        "success"
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
      setPendingSubmit(null);
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || "Ошибка при отправке, попробуйте позже",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (user && pendingSubmit) {
      setFormData(pendingSubmit);
      handleSubmit();
    }
  }, [user]);

  return (
    <>
      <section className="w-full py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-2">
              Связаться с нами
            </h2>
            <p className="text-sm text-blue-600">
              Оставьте сообщение, и мы свяжемся с вами в ближайшее время
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 text-lg">
                  Отправить сообщение
                </CardTitle>
                <CardDescription className="text-sm">
                  Заполните форму ниже
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <FloatingInput
                      label="Имя"
                      name="name"
                      value={user?.username || formData.name}
                      onChange={handleChange}
                      required
                      readOnly={!!user}
                    />
                  </div>

                  <div>
                    <FloatingInput
                      label="Email"
                      type="email"
                      name="email"
                      value={user?.email || formData.email}
                      onChange={handleChange}
                      required
                      readOnly={!!user}
                    />
                  </div>

                  <div>
                    <FloatingInput
                      label="Тема"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Textarea
                      rows={3}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button
                    className="w-full relative flex items-center justify-center h-8"
                    disabled={sending}
                    type="submit"
                  >
                    {!sending ? (
                      <span className="flex items-center">
                        <Icon
                          icon="iconoir:send-diagonal"
                          className="w-4 h-4 mr-2"
                        />
                        Отправить
                      </span>
                    ) : (
                      <Icon
                        icon="line-md:loading-twotone-loop"
                        className="w-5 h-5 animate-spin"
                      />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-blue-100">
                <CardContent className="pt-5 space-y-3">
                  {CONTACT_INFO.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <InfoItem
                        key={index}
                        icon={<Icon />}
                        title={item.title}
                        value={item.value}
                      />
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="bg-blue-600 text-white">
                <CardContent className="pt-4 text-sm space-y-1">
                  {WORK_TIME.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.day}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Suspense>
        {showAuthModal && (
          <Modal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            title={isRegister ? "Создать аккаунт" : "С возвращением"}
          >
            <Auth
              closeModal={() => setShowAuthModal(false)}
              isRegister={isRegister}
              setIsRegister={setIsRegister}
            />
          </Modal>
        )}
      </Suspense>
    </>
  );
}

function InfoItem({
  icon,
  title,
  value,
}: {
  icon: JSX.Element;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm font-medium text-blue-700">{title}</p>
        <p className="text-sm text-blue-600">{value}</p>
      </div>
    </div>
  );
}

export default ContactSection;
