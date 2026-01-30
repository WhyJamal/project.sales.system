import axiosInstance from "@shared/services/axiosInstance";

export interface OrgByInnResponse {
    success: boolean;
    name?: string;
    inn?: string;
    address?: string;
    message?: string;
}

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
