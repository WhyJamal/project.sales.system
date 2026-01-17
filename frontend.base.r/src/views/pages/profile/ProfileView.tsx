import { Music, Edit, LogOut } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { useUserStore } from "@/shared/stores/userStore";
import { useNavigate } from "react-router-dom";

export default function ProfileView() {
  const { user, logout } = useUserStore();

  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">User not found</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profile</h1>
          <Button variant="ghost">
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6">
          <div
            className="
                w-24 h-24 rounded-full
                flex items-center justify-center
                bg-gradient-to-b from-gray-300 to-gray-500
                shadow-md
            "
          >
            <span className="text-white text-3xl font-medium">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{user.username}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline">
                Edit profile
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
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <StatCard label="-" value="0" />
          <StatCard label="-" value="0" />
          <StatCard label="-" value="0" />
        </div>

        <div className="mt-10 space-y-6">
          <Section title="Account">
            <Row label="Username" value={user.username} />
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={user.phone_number || "-"} />
            <Row label="Organization" value={user.organization_url || "-"} />
          </Section>

          {/* <Section title="Title">
            <Row label="Row" value="empty" />
          </Section> */}
        </div>
      </div>
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
