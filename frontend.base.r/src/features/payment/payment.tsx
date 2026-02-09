import React, { useState } from "react";
import {
  RadioCardGroup,
  RadioCardItem,
  FloatingInput,
  Button,
} from "@shared/components";

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
}

const paymentMethods: RadioCardItem[] = [
  { id: "click", imageSrc: "images/click.webp" },
  { id: "payme", imageSrc: "images/payme.webp", disabled: true },
];

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onClose }) => {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | number | null>(
    null
  );

  const handlePayment = () => {
    if (!amount) {
      alert("Введите сумму!");
      return;
    } else if (!selectedMethod) {
      alert("Выберите платежную систему!");
      return;
    }

    if (selectedMethod === "click") {
      const merchantId = "911";
      const clickUrl = `https://click.uz/payment?merchant_id=${merchantId}`;
      window.location.href = clickUrl; 
    }

    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <FloatingInput
        label="Укажите сумму"
        name="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <h1 className="font-bold">Способ оплаты:</h1>

      <div className="w-full mx-auto justify-center items-center">
        <RadioCardGroup
          items={paymentMethods}
          selectedId={selectedMethod}
          onSelect={setSelectedMethod}
          className="grid-cols-2 lg:grid-cols-2"
        />
      </div>

      <Button
        onClick={handlePayment}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition"
      >
        Оплатить
      </Button>
    </div>
  );
};

export default PaymentModal;
