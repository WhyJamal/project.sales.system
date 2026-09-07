import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, Check } from "lucide-react";
import {
  fetchProductSettingsInfo,
  applyProductSettings,
  toggle1CUser,
} from "@/actions/productActions";
import { usePlanStore } from "@/shared/stores/planStore";

interface Product1CUser {
  id: string;
  name: string;
  is_active: boolean;
}

interface ProductSettingsModalProps {
  organizationProductId: number;
  productId?: number;
  productTitle?: string;
  onClose: () => void;
}

const ProductSettingsModal: React.FC<ProductSettingsModalProps> = ({
  organizationProductId,
  productId,
  productTitle,
  onClose,
}) => {
  const { plans, loadPlans } = usePlanStore();

  const [isLoading, setLoading] = useState(true);
  const [isApplying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [currentPlanPrice, setCurrentPlanPrice] = useState<number>(0);
  const [currentPlanDuration, setCurrentPlanDuration] = useState<number>(30);
  const [remainingDays, setRemainingDays] = useState<number>(0);

  const [includedUsers, setIncludedUsers] = useState<number>(1);
  const [extraUserPrice, setExtraUserPrice] = useState<number>(0);
  const [oldUserCount, setOldUserCount] = useState<number>(1);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [users1c, setUsers1c] = useState<Product1CUser[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [extraCount, setExtraCount] = useState<number>(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadPlans();
      const data = await fetchProductSettingsInfo(organizationProductId);

      setCurrentPlanId(data.current_plan_id ?? null);
      setSelectedPlanId(data.current_plan_id ?? null);
      setCurrentPlanPrice(Number(data.current_plan_price ?? 0));
      setCurrentPlanDuration(Number(data.current_plan_duration_days ?? 30));
      setRemainingDays(Number(data.remaining_days ?? 0));

      setIncludedUsers(Number(data.included_users ?? 1));
      setExtraUserPrice(Number(data.extra_user_price ?? 0));
      setOldUserCount(Number(data.user_count ?? 1));

      const list: Product1CUser[] = data.users ?? [];
      setUsers1c(list);
      setCheckedIds(new Set(list.filter((u) => u.is_active).map((u) => u.id)));

      const listedActive = list.filter((u) => u.is_active).length;
      setExtraCount(Math.max(0, Number(data.user_count ?? 1) - listedActive));
    } catch (e) {
      setError("Ma'lumotlarni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationProductId]);

  const productPlans = useMemo(
    () =>
      plans.filter(
        (p) => p.is_active && (productId ? p.product === productId : true)
      ),
    [plans, productId]
  );

  const selectedPlan = productPlans.find((p) => p.id === selectedPlanId);
  const selectedPlanPrice = selectedPlan ? Number(selectedPlan.price) : currentPlanPrice;
  const selectedPlanDuration = selectedPlan?.duration_days ?? currentPlanDuration;

  const targetUserCount = checkedIds.size + extraCount;

  const oldDaily =
    (currentPlanPrice + Math.max(0, oldUserCount - includedUsers) * extraUserPrice) /
    (currentPlanDuration || 30);
  const newDaily =
    (selectedPlanPrice + Math.max(0, targetUserCount - includedUsers) * extraUserPrice) /
    (selectedPlanDuration || 30);
  const projectedCharge = Math.max(0, newDaily - oldDaily) * remainingDays;

  const handleToggleUser = async (user: Product1CUser) => {
    const nextStatus = !checkedIds.has(user.id);

    // Kamaytirish faqat ro'yxatdagi real userni o'chirish orqali bo'ladi —
    // shu sabab avval real 1C chaqiruvi bajariladi.
    setTogglingId(user.id);
    setError(null);
    try {
      await toggle1CUser(organizationProductId, user.id, nextStatus);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (nextStatus) next.add(user.id);
        else next.delete(user.id);
        return next;
      });
    } catch (e) {
      setError("1C bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    setMessage(null);
    try {
      const res = await applyProductSettings(organizationProductId, {
        plan_id: selectedPlanId ?? undefined,
        user_count: targetUserCount,
      });
      setMessage(res.message ?? "Saqlandi.");
      setOldUserCount(res.user_count ?? targetUserCount);
      setCurrentPlanId(res.plan_id ?? selectedPlanId);
      setCurrentPlanPrice(selectedPlanPrice);
      setCurrentPlanDuration(selectedPlanDuration);
    } catch (e) {
      setError("Saqlashda xatolik yuz berdi (balans yetarli emasligi mumkin).");
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Sozlash {productTitle ? `— ${productTitle}` : ""}
        </h3>
        <p className="text-xs text-gray-500">
          Muddat tugash sanasi o'zgarmaydi. Qolgan <b>{remainingDays}</b> kun
          uchun faqat narx farqi hisoblanadi.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}

      {/* Tarif tanlash */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Tarif</p>
        <div className="flex flex-col gap-2">
          {productPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlanId === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${isSelected
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {plan.name}
                  {isCurrent && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                      joriy
                    </span>
                  )}
                </span>
                <span className="text-xs font-bold">
                  {Number(plan.price).toLocaleString()} UZS
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Foydalanuvchilar */}
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Пользователи в тарифе: {includedUsers}
          </p>
          <p className="text-sm font-medium text-gray-700 mb-2">
          </p>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Неактивний: {users1c.length - checkedIds.size}
          </p>
        </div>

        {users1c.length > 0 && (
          <div className="mb-3 max-h-32 overflow-y-auto rounded-md border border-gray-100">
            <ul className="divide-y divide-gray-100">
              {users1c.map((u) => {
                const isChecked = checkedIds.has(u.id);
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-800">
                      {u.name || u.id}
                    </span>
                    <button
                      onClick={() => handleToggleUser(u)}
                      disabled={togglingId === u.id}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition disabled:opacity-50 ${isChecked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300"
                        }`}
                    >
                      {togglingId === u.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isChecked ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExtraCount((c) => Math.max(0, c - 1))}
            disabled={extraCount <= 0}
            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold">
            {targetUserCount}
          </span>
          <button
            type="button"
            onClick={() => setExtraCount((c) => c + 1)}
            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-400">jami foydalanuvchi</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Tarifga {includedUsers} ta kiritilgan. Kamaytirish uchun yuqoridagi
          ro'yxatdan real foydalanuvchini o'chiring — "+" bilan faqat
          ko'paytirish mumkin.
        </p>
      </div>

      {/* Narx breakdown */}
      <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Joriy: {oldDaily.toFixed(0)} UZS/kun → Yangi: {newDaily.toFixed(0)} UZS/kun
        <br />
        Qolgan {remainingDays} kun uchun to'lov:{" "}
        <b>{projectedCharge.toLocaleString()} UZS</b>
        {projectedCharge === 0 && " (qo'shimcha to'lov yo'q)"}
      </div>

      <button
        onClick={handleApply}
        disabled={isApplying}
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isApplying ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </div>
  );
};

export default ProductSettingsModal;
