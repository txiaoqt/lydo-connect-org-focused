import { createContext, useContext, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "lydo_connect_is_authenticated";

type AuthContextValue = {
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredAuthState = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuthState);

  const signIn = () => {
    setIsAuthenticated(true);
    window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
  };

  const signOut = () => {
    setIsAuthenticated(false);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      signIn,
      signOut,
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
