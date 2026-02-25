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
import { useTranslation } from "react-i18next";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactSection() {
  const { t } = useTranslation("footer");
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
        err.response?.data?.detail || err.message || t("contact.form.error")
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
      showToast(t("contact.form.success"), "success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setPendingSubmit(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t("contact.form.error"), "error");
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
              {t("contact.title")}
            </h2>
            <p className="text-sm text-blue-600">{t("contact.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 text-lg">
                  {t("contact.form.sendMessage")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t("contact.form.fillForm")}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <FloatingInput
                      label={t("contact.form.name")}
                      name="name"
                      value={user?.username || formData.name}
                      onChange={handleChange}
                      required
                      readOnly={!!user}
                    />
                  </div>

                  <div>
                    <FloatingInput
                      label={t("contact.form.email")}
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
                      label={t("contact.form.subject")}
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
                    loading={sending}
                    type="submit"
                  >
                    <Icon
                      icon="iconoir:send-diagonal"
                      className="w-4 h-4 mr-2"
                    />
                    {t("commands.send")}
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
                        title={t(`contact.info.${item.title}`)}
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
                      <span>{t(`contact.worktime.${item.day}`)}</span>
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
            title={isRegister ? t("modals.register") : t("modals.login")}
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
