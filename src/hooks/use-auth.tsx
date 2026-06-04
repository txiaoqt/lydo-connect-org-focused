import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { readAdminSession, type SeededAdminUser, writeAdminSession } from "@/lib/admin-auth";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
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

const LOCAL_ADMIN_ALLOWED = !IS_USER_SURFACE;

const toAuthUser = (adminUser: SeededAdminUser): AuthUser => ({
  id: adminUser.id,
  email: adminUser.email,
  displayName: adminUser.displayName,
});

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
        const storedAdmin = LOCAL_ADMIN_ALLOWED ? readAdminSession() : null;
        if (storedAdmin) {
          if (supabaseClient) {
            const { data, error } = await supabaseClient.rpc("validate_admin_session_token", {
              _session_token: storedAdmin.sessionToken,
            });
            const validatedAdmin = Array.isArray(data) ? data[0] : null;
            if (error || !validatedAdmin) {
              writeAdminSession(null);
              setIsAuthenticated(false);
              setRole("guest");
              setUser(null);
              setIsInitialized(true);
              return;
            }
          }
          setIsAuthenticated(true);
          setRole("admin");
          setUser(toAuthUser(storedAdmin));
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

    const storedAdmin = LOCAL_ADMIN_ALLOWED ? readAdminSession() : null;
    if (storedAdmin) {
      setIsAuthenticated(true);
      setRole("admin");
      setUser(toAuthUser(storedAdmin));
      setIsInitialized(true);
    }

    if (!supabaseClient) {
      if (!storedAdmin) {
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

      if (!supabase) {
        return {
          error: "Supabase is not configured. Admin login now requires the seeded Supabase admin account table.",
        };
      }

      const { data, error } = await supabase.rpc("authenticate_admin_account", {
        _username: params.username.trim(),
        _password: params.password,
      });

      if (error) return { error: error.message };

      const adminAccount = Array.isArray(data) ? data[0] : null;
      if (!adminAccount) {
        return { error: "Invalid admin credentials." };
      }

      const adminUser: SeededAdminUser = {
        id: String(adminAccount.admin_id),
        username: String(adminAccount.username ?? params.username.trim()),
        email: String(adminAccount.email ?? ""),
        displayName: String(adminAccount.display_name ?? "Admin User"),
        sessionToken: String(adminAccount.session_token ?? ""),
        expiresAt: String(adminAccount.expires_at ?? ""),
      };

      await supabase.auth.signOut();
      writeAdminSession(adminUser);
      setIsAuthenticated(true);
      setRole("admin");
      setUser(toAuthUser(adminUser));
      return {};
    }

    writeAdminSession(null);

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
        emailRedirectTo: getAuthCallbackUrl(),
        data: {
          full_name: fullName ?? "",
          display_name: fullName ?? "",
          contact_number: contactNumber ?? "",
          barangay_id: barangayId ?? "",
          municipality: "Prototype Municipality",
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
    const storedAdmin = readAdminSession();
    if (supabase && storedAdmin?.sessionToken) {
      await supabase.rpc("revoke_admin_session_token", {
        _session_token: storedAdmin.sessionToken,
      });
    }
    writeAdminSession(null);
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
