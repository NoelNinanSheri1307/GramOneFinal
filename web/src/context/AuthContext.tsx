import React, { createContext, useContext, useEffect, useState } from "react";
import { User, login as apiLogin, logout as apiLogout, me, register as apiRegister, UserRole } from "../lib/auth";
import { getAccessToken } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const activeToken = getAccessToken();
    if (!activeToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const u = await me();
      setUser(u);
      setToken(activeToken);
    } catch {
      apiLogout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.access_token);
    setUser(res.user);
  };

  const handleRegister = async (name: string, email: string, password: string, role: UserRole = "citizen") => {
    await apiRegister(name, email, password, role);
    await handleLogin(email, password);
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
