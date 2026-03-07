import { createContext, useContext, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "lydo_connect_is_authenticated";
const AUTH_ROLE_KEY = "lydo_connect_role";
const AUTH_USER_KEY = "lydo_connect_user";

export type UserRole = "guest" | "youth" | "sk";
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  role: UserRole;
  user: AuthUser | null;
  signIn: (params: { role: Exclude<UserRole, "guest">; email: string; displayName: string }) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredAuthState = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
};

const getStoredRole = (): UserRole => {
  if (typeof window === "undefined") return "guest";
  const role = window.localStorage.getItem(AUTH_ROLE_KEY);
  if (role === "youth" || role === "sk") return role;
  return "guest";
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuthState);
  const [role, setRole] = useState<UserRole>(getStoredRole);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const signIn = ({ role: selectedRole, email, displayName }: { role: Exclude<UserRole, "guest">; email: string; displayName: string }) => {
    const userRecord: AuthUser = {
      id: email.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      displayName,
    };
    setIsAuthenticated(true);
    setRole(selectedRole);
    setUser(userRecord);
    window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
    window.localStorage.setItem(AUTH_ROLE_KEY, selectedRole);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userRecord));
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setRole("guest");
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      role,
      user,
      signIn,
      signOut,
    }),
    [isAuthenticated, role, user],
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
