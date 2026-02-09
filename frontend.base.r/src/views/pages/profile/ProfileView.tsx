import { Edit, LogOut } from "lucide-react";
import { Button, Spinner, ProductTable } from "@shared/components";
import { useUserStore } from "@/shared/stores/userStore";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import AvatarUpload from "@/features/profile/avatar-upload";
import axiosInstance from "@/shared/services/axiosInstance";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const ProfileEdit = lazy(() => import("@/features/profile/profile-edit"));
const Payment = lazy(() => import("@/features/payment/payment"));
const ConfirmModal = lazy(() => import("@shared/components/ui/confirm-modal"));

export default function ProfileView() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <StatCard label="Балансы" value="0" />
          <StatCard label="Базы" value="0" />
          <StatCard label="-" value="0" />
        </div>

        <div className="mt-5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPaymentModal(true)}          
          >
            Пополнить баланс
          </Button>
        </div>
        <div className="mt-5 space-y-6">
          <ProductTable />

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
            title="Оплата"
          >
            <Payment
              show={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
            />
          </Modal>
        )}
      </Suspense>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl p-4 text-center hover:bg-gray-50">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
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
