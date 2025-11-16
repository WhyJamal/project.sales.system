import { createContext, useContext, useState, ReactNode } from "react";
import { registerUser, loginUser } from "../services/authService";

interface User {
  username: string;
  email: string;
  phone_number?: string;
  organization_url?: string;
}

interface UserContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  const login = async (identifier: string, password: string) => {
    try {
      const res = await loginUser({ identifier, password });
  
      if (res.data.access && res.data.refresh && res.data.user) {
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        
        setUser(res.data.user);
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err: any) {
      throw err;
    }
  };
  
  const register = async (data: Partial<User> & { password: string }) => {
    try {
      const res = await registerUser(data);
  
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
  
      setUser(res.data.user);
    } catch (err: any) {
      throw err;
    }
  };
  

  return (
    <UserContext.Provider value={{ user, setUser, logout, login, register }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
