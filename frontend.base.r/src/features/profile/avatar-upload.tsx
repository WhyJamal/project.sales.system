import { useRef, useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Icon } from "@iconify/react";

interface Props {
  onSubmit: (file: File) => Promise<void> | void;
  onCancel: () => void;
}

export default function AvatarUploadForm({ onSubmit, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await onSubmit(file);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center w-full h-56 border border-dashed rounded-base cursor-pointer hover:bg-neutral-tertiary-medium"
      >
        {!preview ? (
          <div className="text-center text-sm text-gray-500">
            <p className="font-medium">Click to upload</p>
            <p className="text-xs mt-1">PNG, JPG, GIF up to 30MB</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={preview}
              className="max-h-full max-w-full object-contain rounded"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleSelect(f);
        }}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={handleSubmit}
          disabled={!file || loading}
          className="flex"
        >
          <span className={loading ? "opacity-0" : "opacity-100 font-semibold"}>
            Сохранить
          </span>

          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Icon
                icon="line-md:loading-twotone-loop"
                className="w-5 h-5 animate-spin"
              />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
