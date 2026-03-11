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
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import EventRecord from "./pages/EventRecord";
import Profile from "./pages/Profile";
import TransparencyReports from "./pages/TransparencyReports";
import FinancialDisclosure from "./pages/FinancialDisclosure";
import BarangayMap from "./pages/BarangayMap";
import TransparencyBoard from "./pages/TransparencyBoard";
import CitizenDesk from "./pages/CitizenDesk";
import ServiceAdvisories from "./pages/ServiceAdvisories";
import AdminPortal from "./admin/AdminPortal";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTopOnRouteChange />
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
                  path="/transparency/citizen-desk"
                  element={
                    <RedirectAdmin>
                      <CitizenDesk />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/transparency/service-advisories"
                  element={
                    <RedirectAdmin>
                      <ServiceAdvisories />
                    </RedirectAdmin>
                  }
                />
                <Route
                  path="/feedback"
                  element={
                    <RedirectAdmin>
                      <CitizenDesk />
                    </RedirectAdmin>
                  }
                />
                <Route path="*" element={<NotFoundRoute />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
