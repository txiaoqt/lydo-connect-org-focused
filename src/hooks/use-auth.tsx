import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "guest" | "youth" | "sk" | "staff" | "admin";
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type SignInParams = {
  email: string;
  password: string;
};

type SignUpParams = {
  email: string;
  password: string;
  fullName?: string;
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

  useEffect(() => {
    if (!supabase) {
      setIsInitialized(true);
      return;
    }

    let mounted = true;

    const applySession = async (session: Session | null) => {
      if (!mounted) return;
      if (!session?.user) {
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
        supabase
          .from("user_profiles")
          .select("display_name,full_name,email")
          .eq("user_id", authUser.id)
          .maybeSingle(),
        supabase.from("user_roles").select("roles(code)").eq("user_id", authUser.id),
      ]);

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

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }: SignInParams) => {
    if (!supabase) {
      return {
        error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async ({ email, password, fullName }: SignUpParams) => {
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
        },
      },
    });

    if (error) return { error: error.message };

    return {
      needsEmailConfirmation: Boolean(data.user && !data.session),
    };
  };

  const signOut = async () => {
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
