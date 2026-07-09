import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Download,
    Package,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import axiosInstance from "@shared/services/axiosInstance";
import { useProductStore } from "@shared/stores/productsStore";
import { useUserStore } from "@/shared/stores/userStore";
import { Button } from "@/shared/components/ui/button";
import UpdateModal from "@/features/update/UpdateModal";
import { ProductVersions } from "@/types";

export default function UpdateView() {
    const navigate = useNavigate();
    const { profile } = useUserStore();
    const { productKey, version } = useParams();

    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openedVersion, setOpenedVersion] = useState<number | null>(null);
    const [modal, setModal] = useState<{
        open: boolean;
        status: 'loading' | 'success' | 'error' | 'busy';
        message?: string;
    }>({ open: false, status: 'loading' });

    const { loadProducts, getProductByName } = useProductStore();
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (!productKey) return;

        const fetchVersions = async () => {
            try {
                const { data } = await axiosInstance.get(
                    `/products/versions/?product=${productKey}`
                );

                setVersions(data);
            } catch (error) {
                console.error("Versions load error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, [productKey]);

    const product = productKey
        ? getProductByName(productKey)
        : undefined;

    const userProduct = user?.organization?.products?.find(
        (p) => p.product_name === productKey
    );

    //const currentVersion = userProduct?.version;
    const currentVersion = version;

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-10">
                Загрузка...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-10">
                <h2 className="text-xl font-semibold">
                    Продукт не найден
                </h2>
            </div>
        );
    }

    const handleUpdate = async (version: ProductVersions) => {
        setModal({ open: true, status: 'loading' });
        try {
            const res = await axiosInstance.post('/organizations/product/update-version/', {
                organization_product_id: userProduct?.id,
                version_id: version.id,
            });

            navigate(
                `/product/updates/${productKey}/${version.version}`,
                { replace: true }
            );

            setModal({ open: true, status: 'success' });
            await profile();
        } catch (err: any) {
            const code = err.response?.data?.code;
            const message = err.response?.data?.message;

            if (code === 'database_busy') {
                setModal({ open: true, status: 'busy' });
            } else {
                setModal({ open: true, status: 'error', message });
            }
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8">
            {modal.open && (
                <UpdateModal
                    status={modal.status}
                    message={modal.message}
                    onClose={() => setModal({ open: false, status: 'loading' })}
                />
            )}

            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-black"
            >
                <ArrowLeft size={16} />
                Назад
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Обновления ПО
                </h1>

                <p className="mt-2 text-gray-500">
                    {product.title}
                </p>
            </div>

            {versions.length > 0 && (
                <div className="mb-8 rounded-2xl border bg-white p-5">
                    <div className="flex items-center gap-2">
                        <CheckCircle2
                            className="text-green-500"
                            size={20}
                        />

                        <span className="font-semibold">
                            Текущая версия
                        </span>
                    </div>

                    <div className="mt-2 text-2xl font-bold">
                        v{currentVersion ?? "—"}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {versions.map((version: any, index: number) => {
                    const isCurrent =
                        currentVersion === version.version;

                    const isOpen =
                        openedVersion === version.id;

                    return (
                        <div
                            key={version.id}
                            className="relative rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow hover:border-blue-500 border-2"
                        >
                            {index === 0 && (
                                <span className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                    Последний
                                </span>
                            )}

                            <div
                                className="cursor-pointer"
                                onClick={() =>
                                    setOpenedVersion(
                                        isOpen
                                            ? null
                                            : version.id
                                    )
                                }
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Package size={18} />

                                            <h2 className="text-xl font-semibold">
                                                v{version.version}
                                            </h2>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar size={14} />
                                            {new Date(
                                                version.created_at
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {isOpen ? (
                                        <ChevronUp
                                            size={20}
                                        />
                                    ) : (
                                        <ChevronDown
                                            size={20}
                                        />
                                    )}
                                </div>

                                {version.description && (
                                    <div className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                                        <h1 className="mb-2 text-sm font-bold text-gray-900">
                                            Информация о версиях
                                        </h1>
                                        {version.description}
                                    </div>
                                )}
                            </div>

                            {isOpen && (
                                <div className="mt-6 border-t pt-6">
                                    {version.media?.length >
                                        0 ? (
                                        <div className="grid gap-4">
                                            {version.media.map(
                                                (
                                                    item: any
                                                ) => (
                                                    <div
                                                        key={
                                                            item.id
                                                        }
                                                        className="overflow-hidden rounded-xl border"
                                                    >
                                                        {item.media_type ===
                                                            "image" && (
                                                                <img
                                                                    src={
                                                                        item.media
                                                                    }
                                                                    alt=""
                                                                    className="h-96 w-full object-cover"
                                                                />
                                                            )}

                                                        {item.media_type ===
                                                            "video" && (
                                                                <video
                                                                    controls
                                                                    className="w-full"
                                                                >
                                                                    <source
                                                                        src={
                                                                            item.media
                                                                        }
                                                                    />
                                                                </video>
                                                            )}

                                                        {item.media_type ===
                                                            "file" && (
                                                                <div className="p-4">
                                                                    <a
                                                                        href={
                                                                            item.media
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                                                    >
                                                                        <Download
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                        Скачать
                                                                        файл
                                                                    </a>
                                                                </div>
                                                            )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            Медиафайлы отсутствуют
                                        </div>
                                    )}

                                    {!isCurrent && (
                                        <div className="mt-6 flex justify-end">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleUpdate(version)}
                                            >
                                                <Download size={16} />
                                                Установить обновление
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}