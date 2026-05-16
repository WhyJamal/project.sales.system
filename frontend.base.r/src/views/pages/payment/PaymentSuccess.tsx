import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/shared/stores/userStore";
import { CheckCircle, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const error = searchParams.get("error");

  const isSuccess = status === "2" && (!error || error === "0");

  useEffect(() => {
    profile();

    const timer = setTimeout(() => {
      navigate("/profile");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, profile]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center flex flex-col items-center">
        {isSuccess ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mb-3" />

            <h1 className="text-2xl font-bold text-green-600">
              Платёж успешно выполнен!
            </h1>

            <p className="text-gray-500 mt-2">
              Баланс обновлён. Перенаправление в профиль...
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-3" />

            <h1 className="text-2xl font-bold text-red-500">
              Платёж не выполнен
            </h1>

            <p className="text-gray-500 mt-2">
              Оплата была отменена или произошла ошибка. Перенаправление в профиль...
            </p>
          </>
        )}
      </div>
    </div>
  );
}