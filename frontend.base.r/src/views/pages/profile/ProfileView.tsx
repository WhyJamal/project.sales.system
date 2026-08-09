import { Edit, LogOut } from "lucide-react";
import { Button, Spinner, ProductTable } from "@shared/components";
import { useUserStore } from "@/shared/stores/userStore";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import AvatarUpload from "@/features/profile/avatar-upload";
import axiosInstance from "@/shared/services/axiosInstance";
import { Icon } from "@iconify/react";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const ProfileEdit = lazy(() => import("@/features/profile/profile-edit"));
const Payment = lazy(() => import("@/features/payment/payment"));
const ConfirmModal = lazy(() => import("@shared/components/ui/confirm-modal"));
const InviteCard = lazy(() => import("@/features/organization/invite-card"));

export default function ProfileView() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) return;

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await axiosInstance.patch("/users/me/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const { setUser } = useUserStore.getState();
    setUser(res.data);
  }

  async function handleDeleteAvatar() {
    setShowConfirm(false);
    if (!user) return;
    try {
      await axiosInstance.patch("/users/me/", { delete_avatar: true });

      const { setUser } = useUserStore.getState();
      setUser({ ...user, avatar_url: null });
    } catch (err) {
      console.error("Avatar delete error:", err);
    }
  }

  //
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">User not found</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-10">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Профиль</h1>
          <Button variant="ghost" onClick={() => setShowEditModal(true)}>
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover shadow-md mx-auto sm:mx-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-b from-gray-300 to-gray-500 shadow-md flex-shrink-0 mx-auto sm:mx-0">
                <span className="text-white text-3xl font-medium">
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-center sm:text-left">
              <div className="flex flex-col items-center sm:items-start">
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    Редактировать фото
                  </Button>

                  {user.avatar_url && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowConfirm(true)}
                    >
                      Удалить фото
                    </Button>
                  )}

                  <div className="ml-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Выход
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-gray-700 max-w-2xl break-words line-clamp-3 text-left">
              {user.bio}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <StatCard
            label="Балансы"
            value={
              user.wallet_balance
                ? `${Number(user.wallet_balance).toLocaleString()} UZS`
                : "0 UZS"
            }
          />
          <StatCard label="Базы" value={user.organization?.products.length.toString() || "0"} />
          <StatCard label="-" value="0" />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowPaymentModal(true)}
          >
            <Icon icon="mdi:wallet-plus-outline" width={18} />
            Пополнить баланс
          </Button>

          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Информация о пополнении баланса"
          >
            <Icon icon="mdi:help-circle-outline" width={20} />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          <ProductTable />

          {user.organization && (
            <Suspense fallback={null}>
              <InviteCard />
            </Suspense>
          )}

          <Section title="Account">
            <Row label="Имя пользователя" value={user.username} />
            <Row label="Email" value={user.email} />
            <Row label="Телефон" value={user.phone_number || "-"} />
            <Row label="Организация" value={user.organization?.name || "-"} />
            <Row label="ИНН" value={user.organization?.inn || "-"} />
            <Row label="Адрес" value={user.organization?.address || "-"} />
          </Section>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        }
      >

        <ConfirmModal
          isOpen={showConfirm}
          message="Вы уверены, что хотите удалить фотографию?"
          onConfirm={handleDeleteAvatar}
          onCancel={() => setShowConfirm(false)}
        />

        <ConfirmModal
          isOpen={showLogoutConfirm}
          message="Вы уверены, что хотите выйти?"
          onConfirm={() => {
            logout();
            navigate("/");
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />

        {showEditModal && (
          <Modal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Редактировать профиль"
          >
            <ProfileEdit
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
            />
          </Modal>
        )}

        {showAvatarModal && (
          <Modal
            open={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            title="Изменить фотографию"
          >
            <AvatarUpload
              onSubmit={async (file) => {
                await uploadAvatar(file);
                setShowAvatarModal(false);
              }}
              onCancel={() => setShowAvatarModal(false)}
            />
          </Modal>
        )}

        {showPaymentModal && (
          <Modal
            open={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            title="Баланс пополнить"
          >
            <Payment
              show={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              walletTopup={true}
            />
          </Modal>
        )}

        {showVideoModal && (
          <Modal
            open={showVideoModal}
            onClose={() => setShowVideoModal(false)}
            title="Как пополнить баланс?"
            widthModal="sm:w-[720px]"
          >
            <div className="w-full overflow-hidden rounded-lg bg-black">
              <video
                className="w-full aspect-video"
                controls
                preload="metadata"
              >
                <source
                  src="/videos/balance-help.webm"
                  type="video/mp4"
                />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>
          </Modal>
        )}
      </Suspense>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const isLongValue = value.length > 10;

  return (
    <div className="border rounded-xl p-4 text-center hover:bg-gray-50 min-w-0">
      <div className="relative group">
        <div
          className={`font-semibold truncate ${
            isLongValue ? "text-lg sm:text-xl" : "text-2xl"
          }`}
        >
          {value}
        </div>

        {/* To'liq qiymat hoverda */}
        {isLongValue && (
          <div
            className="
              pointer-events-none
              absolute
              z-50
              bottom-full
              left-1/2
              mb-2
              -translate-x-1/2
              whitespace-nowrap
              rounded-md
              bg-gray-900
              px-3
              py-1.5
              text-xs
              text-white
              opacity-0
              shadow-lg
              transition-opacity
              duration-150
              group-hover:opacity-100
            "
          >
            {value}
          </div>
        )}
      </div>

      <div className="mt-1 text-xs text-gray-500">
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl">
      <div className="px-4 py-3 border-b text-sm font-medium">{title}</div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
