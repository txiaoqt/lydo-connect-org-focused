import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ADMIN_SESSION_STORAGE_KEY, PREDEFINED_ADMIN_CREDENTIALS, PREDEFINED_ADMIN_USER } from "@/lib/admin-auth";
import { IS_USER_SURFACE } from "@/lib/deployment-surface";
import { supabase } from "@/lib/supabase";

export type UserRole = "guest" | "youth" | "sk" | "staff" | "admin";
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type SignInParams =
  | {
      mode: "user";
      email: string;
      password: string;
    }
  | {
      mode: "admin";
      username: string;
      password: string;
    };

type SignUpParams = {
  email: string;
  password: string;
  fullName?: string;
  contactNumber?: string;
  barangayId?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitialized: boolean;
  role: UserRole;
  user: AuthUser | null;
  signIn: (params: SignInParams) => Promise<{ error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_USERNAME = PREDEFINED_ADMIN_CREDENTIALS.username;
const ADMIN_PASSWORD = PREDEFINED_ADMIN_CREDENTIALS.password;
const ADMIN_USER: AuthUser = PREDEFINED_ADMIN_USER;
const LOCAL_ADMIN_ALLOWED = !IS_USER_SURFACE;

const readAdminSession = () => {
  if (!LOCAL_ADMIN_ALLOWED) return false;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === "active";
};

const writeAdminSession = (active: boolean) => {
  if (typeof window === "undefined") return;
  if (!LOCAL_ADMIN_ALLOWED) {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return;
  }
  if (active) {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "active");
    return;
  }
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
};

const priorityRole = (codes: string[]): UserRole => {
  if (codes.includes("admin")) return "admin";
  if (codes.includes("staff")) return "staff";
  if (codes.includes("sk")) return "sk";
  if (codes.includes("youth")) return "youth";
  return "youth";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>("guest");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const applySessionVersionRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const supabaseClient = supabase;

    const applySession = async (session: Session | null) => {
      const applyVersion = ++applySessionVersionRef.current;
      if (!mounted) return;

      if (!session?.user) {
        if (readAdminSession()) {
          setIsAuthenticated(true);
          setRole("admin");
          setUser(ADMIN_USER);
          setIsInitialized(true);
          return;
        }

        setIsAuthenticated(false);
        setRole("guest");
        setUser(null);
        setIsInitialized(true);
        return;
      }

      const authUser = session.user;
      const defaultDisplayName =
        (authUser.user_metadata?.display_name as string | undefined) ??
        (authUser.user_metadata?.full_name as string | undefined) ??
        authUser.email?.split("@")[0] ??
        "User";

      const [profileResp, rolesResp] = await Promise.all([
        supabaseClient!
          .from("user_profiles")
          .select("display_name,full_name,email")
          .eq("user_id", authUser.id)
          .maybeSingle(),
        supabaseClient!.from("user_roles").select("roles(code)").eq("user_id", authUser.id),
      ]);

      // Ignore stale async results if a newer auth event was already applied
      // (e.g., signUp emits SIGNED_IN then we immediately force SIGNED_OUT).
      if (!mounted || applyVersion !== applySessionVersionRef.current) return;

      const roleCodes =
        rolesResp.data
          ?.map((entry) => {
            const related = (entry as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
            if (Array.isArray(related)) return related[0]?.code;
            return related?.code;
          })
          .filter((code): code is string => Boolean(code)) ?? [];

      const resolvedRole = priorityRole(roleCodes);
      const resolvedUser: AuthUser = {
        id: authUser.id,
        email: (profileResp.data?.email as string | undefined) ?? authUser.email ?? "",
        displayName:
          (profileResp.data?.display_name as string | undefined) ??
          (profileResp.data?.full_name as string | undefined) ??
          defaultDisplayName,
      };

      setIsAuthenticated(true);
      setRole(resolvedRole);
      setUser(resolvedUser);
      setIsInitialized(true);
    };

    if (readAdminSession()) {
      setIsAuthenticated(true);
      setRole("admin");
      setUser(ADMIN_USER);
      setIsInitialized(true);
    }

    if (!supabaseClient) {
      if (!readAdminSession()) {
        setIsInitialized(true);
      }
      return;
    }

    supabaseClient.auth.getSession().then(({ data }) => {
      void applySession(data.session ?? null);
    });

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (params: SignInParams) => {
    if (params.mode === "admin") {
      if (!LOCAL_ADMIN_ALLOWED) {
        return { error: "Admin login is disabled on this deployment." };
      }

      const username = params.username.trim();
      if (username !== ADMIN_USERNAME || params.password !== ADMIN_PASSWORD) {
        return { error: "Invalid admin credentials." };
      }

      writeAdminSession(true);
      if (supabase) {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(true);
      setRole("admin");
      setUser(ADMIN_USER);
      return {};
    }

    writeAdminSession(false);

    if (!supabase) {
      return {
        error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: params.email.trim(),
      password: params.password,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async ({ email, password, fullName, contactNumber, barangayId }: SignUpParams) => {
    if (!supabase) {
      return {
        error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName ?? "",
          display_name: fullName ?? "",
          contact_number: contactNumber ?? "",
          barangay_id: barangayId ?? "",
          municipality: "Metro Manila",
        },
      },
    });

    if (error) return { error: error.message };

    // Force manual sign-in after registration even when email confirmation is disabled.
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setRole("guest");
    setUser(null);

    return {
      needsEmailConfirmation: Boolean(data.user && !data.session),
    };
  };

  const signOut = async () => {
    writeAdminSession(false);
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setRole("guest");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      isInitialized,
      role,
      user,
      signIn,
      signUp,
      signOut,
    }),
    [isAuthenticated, isInitialized, role, user],
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
