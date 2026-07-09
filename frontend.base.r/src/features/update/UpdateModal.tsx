import { AlertTriangle, CheckCircle2, XCircle, Loader2, X } from "lucide-react";

export default function UpdateModal({ 
    status, 
    message, 
    onClose 
}: { 
    status: 'loading' | 'success' | 'error' | 'busy', 
    message?: string,
    onClose: () => void 
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                
                {status !== 'loading' && (
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Loader2 size={48} className="animate-spin text-blue-500" />
                        <h2 className="text-xl font-semibold">Установка обновления...</h2>
                        <p className="text-center text-sm text-gray-500">
                            Пожалуйста, подождите. Это может занять несколько минут.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <CheckCircle2 size={48} className="text-green-500" />
                        <h2 className="text-xl font-semibold">Обновление установлено!</h2>
                        <p className="text-center text-sm text-gray-500">
                            Конфигурация успешно обновлена.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-2 rounded-xl bg-green-500 px-6 py-2 text-white hover:bg-green-600"
                        >
                            Отлично
                        </button>
                    </div>
                )}

                {status === 'busy' && (
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={28} className="shrink-0 text-yellow-500" />
                            <h2 className="text-lg font-semibold">Невозможно установить обновление</h2>
                        </div>
                        <p className="text-sm text-gray-600">
                            Обновление конфигурации требует монопольного доступа к базе данных. 
                            Пожалуйста, убедитесь, что выполнены следующие условия:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-600">1</span>
                                Все пользователи вышли из базы данных
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-600">2</span>
                                Нет активных фоновых заданий или регламентных операций
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-600">3</span>
                                Подождите несколько минут и попробуйте снова
                            </li>
                        </ul>
                        <button
                            onClick={onClose}
                            className="mt-2 rounded-xl bg-yellow-500 px-6 py-2 text-white hover:bg-yellow-600"
                        >
                            Понятно
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex items-center gap-3">
                            <XCircle size={28} className="shrink-0 text-red-500" />
                            <h2 className="text-lg font-semibold">Ошибка при обновлении</h2>
                        </div>
                        <p className="text-sm text-gray-600">
                            {message || "Произошла неизвестная ошибка. Обратитесь к администратору."}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-2 rounded-xl bg-red-500 px-6 py-2 text-white hover:bg-red-600"
                        >
                            Закрыть
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}