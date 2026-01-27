import { Button } from "@shared/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
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
      <div className="bg-white rounded-sm shadow-lg max-w-sm w-full p-4 space-y-10">
        <div className="space-y-3">
          {title && <h2 className="text-mg font-semibold">{title}</h2>}
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}          
          >
            Подтвердить
          </Button>
        </div>
      </div>
    </div>
  );
}
