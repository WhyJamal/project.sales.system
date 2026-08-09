import React, { lazy, Suspense, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Spinner, Button } from "@shared/components";
import { useUserStore } from "@shared/stores/userStore";
import {
  fetchInviteInfo,
  InviteInfoResponse,
} from "@shared/services/organizationService";

const Auth = lazy(() => import("@/features/auth/auth-form"));
const CreateOrganization = lazy(
  () => import("@/features/organization/create-organization")
);

const InviteView: React.FC = () => {
  const { t } = useTranslation("common");
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InviteInfoResponse | null>(null);
  const [isRegister, setIsRegister] = useState(true);

  useEffect(() => {
    if (!code) return;

    (async () => {
      setLoading(true);
      const res = await fetchInviteInfo(code);
      setInfo(res);

      if (res.valid) {
        sessionStorage.setItem("invite_code", code.toUpperCase());
      }

      setLoading(false);
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!info || !info.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Icon icon="mdi:link-off" width={48} className="text-gray-300" />
        <p className="text-gray-500">{t("invite.invalidCode")}</p>
        <Button onClick={() => navigate("/")}>{t("commands.create")}</Button>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-white text-gray-900">
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">
          {t("invite.title")}
        </h1>

        <p className="mt-3 text-lg text-white/90">
          {t("invite.subtitle", {
            name: info.organization_name,
          })}
        </p>

        <p className="mt-3 text-white/80">
          {t("invite.description")}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
          <Icon icon="mdi:ticket-percent" width={18} />

          <span>
            {t("invite.promoLabel")}:{" "}
            <b>{info.promo_code}</b>
          </span>
        </div>
      </div>
    </div>

    <div className="max-w-md mx-auto px-4 py-12">
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Spinner />
          </div>
        }
      >
        {!user && (
          <Auth
            closeModal={() => {}}
            isRegister={isRegister}
            setIsRegister={setIsRegister}
          />
        )}

        {user && !user.organization && (
          <CreateOrganization
            onBaseCreated={() => navigate("/")}
          />
        )}

        {user && user.organization && (
          <div className="text-center text-gray-500">
            <Icon
              icon="mdi:check-circle"
              width={40}
              className="text-green-500 mx-auto mb-3"
            />

            <p>
              Вы уже зарегистрированы и у вас есть организация.
            </p>

            <Button
              className="mt-4"
              onClick={() => navigate("/")}
            >
              На главную
            </Button>
          </div>
        )}
      </Suspense>
    </div>
  </div>
);
};

export default InviteView;
