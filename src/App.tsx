import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import Events from "./pages/Events";
import Organizations from "./pages/Organizations";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import EventRecord from "./pages/EventRecord";
import Profile from "./pages/Profile";
import TransparencyReports from "./pages/TransparencyReports";
import FinancialDisclosure from "./pages/FinancialDisclosure";
import BarangayMap from "./pages/BarangayMap";
import TransparencyBoard from "./pages/TransparencyBoard";
import YouthDesk from "./pages/YouthDesk";
import AdminPortal from "./admin/AdminPortal";
import LegalPolicy from "./pages/LegalPolicy";
import Faqs from "./pages/Faqs";
import Contacts from "./pages/Contacts";
import SiteMap from "./pages/SiteMap";
import { usePolicyAgreement } from "./hooks/use-policy-agreement";
import { TermsPrivacyAgreementModal } from "./components/TermsPrivacyAgreementModal";
import {
  ADMIN_SIGNIN_PATH,
  EFFECTIVE_ADMIN_SIGNIN_PATH,
  IS_ADMIN_SURFACE,
  IS_COMBINED_SURFACE,
  IS_USER_SURFACE,
  USER_SIGNIN_PATH,
} from "./lib/deployment-surface";

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">Loading...</div>
);

const PolicyAgreementGate = ({ children }: { children: JSX.Element }) => {
  const { isInitialized, isAuthenticated, role, user, signOut } = useAuth();
  const shouldCheckPolicy = isInitialized && isAuthenticated && role !== "admin" && Boolean(user?.id);
  const { isChecking, isRequired, activePolicy, accepting, error, accept, refresh } = usePolicyAgreement({
    userId: user?.id ?? null,
    enabled: shouldCheckPolicy,
  });

  if (!isInitialized) return <FullScreenLoader />;
  if (shouldCheckPolicy && isChecking) return <FullScreenLoader />;
  if (shouldCheckPolicy && !activePolicy) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-5 text-center">
          <h2 className="text-lg font-semibold text-foreground">Policy Agreement Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load the active Terms of Service and Privacy Policy right now.
          </p>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              onClick={() => void refresh()}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              onClick={() => void signOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <TermsPrivacyAgreementModal
        open={Boolean(shouldCheckPolicy && isRequired && activePolicy)}
        policy={activePolicy}
        saving={accepting}
        error={error}
        onAccept={async () => {
          await accept();
        }}
        onDecline={async () => {
          await signOut();
        }}
      />
    </>
  );
};

const RedirectAdmin = ({ children }: { children: JSX.Element }) => {
  const { isInitialized, role } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  if (IS_ADMIN_SURFACE) return <Navigate to={EFFECTIVE_ADMIN_SIGNIN_PATH} replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const { isInitialized, role } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  if (role !== "admin") return <Navigate to={EFFECTIVE_ADMIN_SIGNIN_PATH} replace />;
  return children;
};

const NotFoundRoute = () => {
  const { isInitialized, role } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  if (IS_ADMIN_SURFACE) return <Navigate to={EFFECTIVE_ADMIN_SIGNIN_PATH} replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <NotFound />;
};

const ScrollToTopOnRouteChange = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
};

const SurfaceThemeClass = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isAdminPath = pathname.startsWith("/admin");
    const shouldUsePublicTheme = !IS_ADMIN_SURFACE && !isAdminPath;
    document.body.classList.toggle("public-shell", shouldUsePublicTheme);

    return () => {
      document.body.classList.remove("public-shell");
    };
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <PolicyAgreementGate>
          <>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTopOnRouteChange />
              <SurfaceThemeClass />
              <Routes>
            {IS_ADMIN_SURFACE ? (
              <>
                <Route
                  path={ADMIN_SIGNIN_PATH}
                  element={
                    <SignIn forcedMode="admin" />
                  }
                />
                <Route path={USER_SIGNIN_PATH} element={<Navigate to={ADMIN_SIGNIN_PATH} replace />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminPortal />
                    </RequireAdmin>
                  }
                />
                <Route path="/" element={<Navigate to={ADMIN_SIGNIN_PATH} replace />} />
                <Route path="*" element={<Navigate to={ADMIN_SIGNIN_PATH} replace />} />
              </>
            ) : (
              <>
                {IS_COMBINED_SURFACE ? (
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminPortal />
                      </RequireAdmin>
                    }
                  />
                ) : (
                  <Route path="/admin/*" element={<Navigate to="/" replace />} />
                )}
                <Route
                  path="/"
                  element={
                    <RedirectAdmin>
                      <Index />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/programs"
                  element={
                    <RedirectAdmin>
                      <Programs />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <RedirectAdmin>
                      <Events />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/organizations"
                  element={
                    <RedirectAdmin>
                      <Organizations />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <RedirectAdmin>
                      <About />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/faqs"
                  element={
                    <RedirectAdmin>
                      <Faqs />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <RedirectAdmin>
                      <Contacts />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/site-map"
                  element={
                    <RedirectAdmin>
                      <SiteMap />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <RedirectAdmin>
                      <LegalPolicy />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <RedirectAdmin>
                      <LegalPolicy />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/advocacy"
                  element={
                    <RedirectAdmin>
                      <About />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path={USER_SIGNIN_PATH}
                  element={
                    <RedirectAdmin>
                      <SignIn forcedMode={IS_USER_SURFACE ? "user" : undefined} />
                    </RedirectAdmin>
                  }
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/signup"
                  element={
                    <RedirectAdmin>
                      <SignUp />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/events/:eventId"
                  element={
                    <RedirectAdmin>
                      <EventRecord />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/programs/:programId"
                  element={
                    <RedirectAdmin>
                      <EventRecord />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RedirectAdmin>
                      <Profile />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/reports"
                  element={
                    <RedirectAdmin>
                      <TransparencyReports />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/board"
                  element={
                    <RedirectAdmin>
                      <TransparencyBoard />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/financial-disclosure"
                  element={
                    <RedirectAdmin>
                      <FinancialDisclosure />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/barangay-map"
                  element={
                    <RedirectAdmin>
                      <BarangayMap />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/youth-desk"
                  element={
                    <RedirectAdmin>
                      <YouthDesk />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/feedback"
                  element={
                    <RedirectAdmin>
                      <YouthDesk />
                    </RedirectAdmin>
                  }
                />
                <Route path="*" element={<NotFoundRoute />} />
              </>
            )}
              </Routes>
            </BrowserRouter>
          </>
        </PolicyAgreementGate>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
