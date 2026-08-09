import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/shared/components/common/modal";
import OfertaContent from "@/shared/components/common/oferta-content";
import { Button } from "@/shared/components";

interface Props {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const OfertaModal: React.FC<Props> = ({ open, onClose, onAccept }) => {
  const { t } = useTranslation("common");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modals.org.oferta")}
      widthModal="sm:w-[680px]"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <OfertaContent />
      </div>
      <div className="flex justify-end mt-5">
        <Button
          type="button"
          onClick={() => {
            onAccept?.();
            onClose();
          }}
        >
          {t("modals.org.ofertaAccept")}
        </Button>
      </div>
    </Modal>
  );
};

export default OfertaModal;
