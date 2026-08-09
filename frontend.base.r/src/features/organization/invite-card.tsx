import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components";
import { useApp } from "@app/providers/AppProvider";
import {
  fetchMyInvite,
  MyInviteResponse,
} from "@/shared/services/organizationService";

const InviteCard: React.FC = () => {
  const { t } = useTranslation("common");
  const { showToast } = useApp();
  const [invite, setInvite] = useState<MyInviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMyInvite();
        setInvite(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !invite) return null;

  const inviteLink = `${window.location.origin}/invite/${invite.promo_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast(t("invite.myInvite.copied"), "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="border rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Icon icon="mdi:gift-outline" width={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {t("invite.myInvite.title")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("invite.myInvite.description", {
              percent: invite.referral_bonus_percent,
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            {t("invite.myInvite.yourCode")}
          </div>
          <div className="font-mono font-semibold tracking-wider text-lg">
            {invite.promo_code}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">
            {t("invite.myInvite.invitedCount")}
          </div>
          <div className="font-semibold text-lg">{invite.invited_count}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-gray-400 mb-1">
          {t("invite.myInvite.yourLink")}
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 text-sm bg-white border rounded-md px-3 py-2 text-gray-600 truncate"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
            <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} width={16} />
            {t("invite.myInvite.copy")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteCard;
