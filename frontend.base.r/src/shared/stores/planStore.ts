import { create } from "zustand";
import axiosInstance from "@/shared/services/axiosInstance";
import { Plan, PlanFeature } from "@/types";

interface PlanStore {
  plans: Plan[];
  features: PlanFeature[];

  loading: boolean;
  error: string | null;

  loadPlans: () => Promise<void>;
  loadFeatures: () => Promise<void>;
  loadAll: () => Promise<void>;

  getDefaultPlan: () => Plan | undefined;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: [],
  features: [],
  loading: false,
  error: null,

  loadPlans: async () => {
    if (get().plans.length) return;

    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/plans/");
      set({ plans: res.data });
    } catch (e) {
      console.error(e);
      set({ error: "Failed to load plans" });
    } finally {
      set({ loading: false });
    }
  },

  loadFeatures: async () => {
    if (get().features.length) return;

    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/plans/plan-features/");
      set({ features: res.data });
    } catch (e) {
      console.error(e);
      set({ error: "Failed to load features" });
    } finally {
      set({ loading: false });
    }
  },

  loadAll: async () => {
    await Promise.all([
      get().loadPlans(),
      get().loadFeatures(),
    ]);
  },

  getDefaultPlan: () => {
    return get().plans.find(p => p.is_default);
  },
}));