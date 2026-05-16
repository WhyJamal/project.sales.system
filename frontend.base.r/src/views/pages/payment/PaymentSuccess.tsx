import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/shared/stores/userStore";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const { profile } = useUserStore();

    useEffect(() => {
        profile();
        setTimeout(() => navigate("/profile"), 3000);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-600 mb-3" />

                <h1 className="text-2xl font-bold text-green-600">
                    Платёж успешно выполнен!
                </h1>

                <p className="text-gray-500 mt-2">
                    Баланс обновлён. Перенаправление в профиль...
                </p>
            </div>
        </div>
    );
}