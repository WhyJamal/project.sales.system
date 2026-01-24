import { Edit, LogOut } from "lucide-react";
import { Button, Spinner } from "@shared/components";
import { useUserStore } from "@/shared/stores/userStore";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import AvatarUpload from "@/features/profile/avatar-upload";

const Modal = lazy(() => import("@/shared/components/common/modal"));
const ProfileEdit = lazy(() => import("@/features/profile/profile-edit"));

export default function ProfileView() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  async function uploadAvatar(file: File) {
    return 0;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">User not found</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-5">
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
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-b from-gray-300 to-gray-500 shadow-md flex-shrink-0 mx-auto sm:mx-0">
              <span className="text-white text-3xl font-medium">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-center sm:text-left">
              <div className="flex flex-col items-center sm:items-start">
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>

                <div className="flex gap-2 mt-3 sm:mt-3 justify-center sm:justify-start">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    Редактировать фотографию
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Выход
                  </Button>
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
          <StatCard label="-" value="0" />
          <StatCard label="-" value="0" />
          <StatCard label="-" value="0" />
        </div>

        <div className="mt-10 space-y-6">
          <Section title="Account">
            <Row label="Имя пользователя" value={user.username} />
            <Row label="Email" value={user.email} />
            <Row label="Телефон" value={user.phone_number || "-"} />
            <Row label="Организация" value={user.organization_name || "-"} />
          </Section>
        </div>
      </div>

      {showEditModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center">
              <Spinner/>
            </div>
          }
        >
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
        </Suspense>
      )}

      {showAvatarModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center">
              <Spinner/>
            </div>
          }
        >
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
        </Suspense>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl p-4 text-center">
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
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
