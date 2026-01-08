import React, { useState, Suspense, lazy, useEffect } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Button from "../../ui/button";
import FloatingInput from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { useUser } from "@/app/providers/UserProvider";

const Modal = lazy(() => import("@shared/components/common/Modal"));
const Auth = lazy(() => import("@/features/auth/Auth"));

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactSection() {
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null);

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
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Ошибка при отправке");
    }
    return res.json();
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
      alert(
        "Сообщение успешно отправлено! На вашу почту придёт подтверждение."
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
      setPendingSubmit(null);
    } catch (err: any) {
      console.error(err);
      alert("Ошибка при отправке: " + (err.message || "Попробуйте позже"));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (user && pendingSubmit) {
      setFormData(pendingSubmit);
      handleSubmit();
    }
  }, [user]); // запускается при изменении user

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
                      value={formData.name}
                      onChange={handleChange}
                      required
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
                    <span
                      className={
                        sending ? "opacity-0" : "opacity-100 flex items-center"
                      }
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Отправить
                    </span>

                    {sending && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-blue-100">
                <CardContent className="pt-5 space-y-3">
                  <InfoItem
                    icon={<Mail />}
                    title="Email"
                    value="info@site.uz"
                  />
                  <InfoItem
                    icon={<Phone />}
                    title="Телефон"
                    value="+998 90 000 00 00"
                  />
                  <InfoItem
                    icon={<MapPin />}
                    title="Адрес"
                    value="Ташкент, Узбекистан"
                  />
                </CardContent>
              </Card>

              <Card className="bg-blue-600 text-white">
                <CardContent className="pt-4 text-sm">
                  <div className="flex justify-between">
                    <span>Пн – Пт</span>
                    <span>09:00 – 18:00</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Сб</span>
                    <span>10:00 – 14:00</span>
                  </div>
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
            title=""
          >
            <Auth closeModal={() => setShowAuthModal(false)} />
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
