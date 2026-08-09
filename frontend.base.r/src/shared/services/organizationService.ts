import axiosInstance from "@shared/services/axiosInstance";

export interface OrgByInnResponse {
    success: boolean;
    name?: string;
    inn?: string;
    address?: string;
    message?: string;
}

export interface InviteInfoResponse {
    valid: boolean;
    promo_code?: string;
    organization_name?: string;
    detail?: string;
}

export interface MyInviteResponse {
    promo_code: string;
    invited_count: number;
    referral_bonus_percent: string;
}

export const fetchInviteInfo = async (code: string): Promise<InviteInfoResponse> => {
    try {
        const res = await axiosInstance.get(`/organizations/invite/${code}/`);
        return res.data;
    } catch (err: any) {
        return {
            valid: false,
            detail: err.response?.data?.detail || "Промо-код не найден.",
        };
    }
};

export const fetchMyInvite = async (): Promise<MyInviteResponse> => {
    const res = await axiosInstance.get(`/organizations/invite/mine/`);
    return res.data;
};

export const fetchOrgByInn = async (inn: string): Promise<OrgByInnResponse> => {
    const API_URL = import.meta.env.VITE_ORG_FOUND_API_URL;
    const API_TOKEN = import.meta.env.VITE_ORG_FOUND_API_TOKEN;

    try {
        const res = await axiosInstance.get(
            `${API_URL}/${inn}`,
            {
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`,
                },
            }
        );

        if (res.data && res.data.name) {
            return {
                success: true,
                name: res.data.name,
                inn: res.data.tin ?? inn,
                address: res.data.address,
            };
        } else {
            return { success: false, message: "Организация не найдена" };
        }
    } catch (err) {
        console.error(err);
        return { success: false, message: "Организация не найдена" };
    }
};
