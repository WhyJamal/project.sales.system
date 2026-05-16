import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/shared/stores/userStore";
import { CheckCircle, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const [searchParams] = useSearchParams();

  const paymentStatus = searchParams.get("payment_status");

  const statusNumber = Number(paymentStatus);

  const isSuccess = statusNumber === 2;
  const isError = statusNumber < 0 || statusNumber !== 2;

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
              Произошла ошибка при оплате. Перенаправление в профиль...
            </p>
          </>
        )}
      </div>
    </div>
  );
}