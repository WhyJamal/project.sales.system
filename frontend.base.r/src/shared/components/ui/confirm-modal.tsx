import { Button } from "@shared/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Подтвердите действие",
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-sm shadow-lg max-w-sm w-full p-4 space-y-6">
        <div className="space-y-3">
          {title && (
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
          )}
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Подтвердить
          </Button>
        </div>
      </div>
    </div>
  );
}
