import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { registerUser, loginUser, googleAuth } from "@shared/services/authService";

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  bio?: string;
  organization_name?: string;
  organization_inn?: number;
  organization_url?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
}

const storage: PersistOptions<UserStore, UserStore>["storage"] = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: () => {
        set({ user: null });
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      },

      login: async (identifier, password) => {
        try {
          const res = await loginUser({ identifier, password });
          if (res.data.access && res.data.refresh && res.data.user) {
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            set({ user: res.data.user });
          } else {
            throw new Error(res.data.message || "Login failed");
          }
        } catch (err) {
          throw err;
        }
      },

      register: async (data) => {
        try {
          const res = await registerUser(data);
          localStorage.setItem("access_token", res.data.access);
          localStorage.setItem("refresh_token", res.data.refresh);
          set({ user: res.data.user });
        } catch (err) {
          throw err;
        }
      },

      googleLogin: async (token) => {
        try {
          const res = await googleAuth(token);
          if (res.data.access && res.data.refresh && res.data.user) {
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            set({ user: res.data.user });
          } else {
            throw new Error("Google login failed");
          }
        } catch (err) {
          throw err;
        }
      },
    }),
    {
      name: "user-storage",
      storage, 
    }
  )
);
