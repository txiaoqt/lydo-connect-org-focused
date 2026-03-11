import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Programs } from "./pages/Programs";
import { Events } from "./pages/Events";
import { Organizations } from "./pages/Organizations";
import { Barangays } from "./pages/Barangays";
import { Documents } from "./pages/Documents";
import { TransparencyBoardAdmin } from "./pages/TransparencyBoardAdmin";
import { FinancialDss } from "./pages/FinancialDss";
import { CitizenDeskAdmin } from "./pages/CitizenDesk";
import { UsersPage } from "./pages/Users";
import { Roles } from "./pages/Roles";
import { AuditLogs } from "./pages/AuditLogs";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const tabLabelMap: Record<string, string> = {
    dashboard: "Dashboard",
    programs: "Programs",
    events: "Events",
    organizations: "Organizations",
    barangays: "Barangay Map Data",
    documents: "Transparency Docs",
    "transparency-board": "Transparency Board",
    "financial-dss": "Financial DSS",
    "citizen-desk": "Citizen Desk",
    "audit-logs": "Audit Logs",
    users: "Users",
    roles: "Roles & Permissions",
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setIsSidebarOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousManifest = manifestLink?.getAttribute("href");
    const previousThemeColor = themeColorMeta?.getAttribute("content");

    if (manifestLink) {
      manifestLink.setAttribute("href", "/manifest-admin.webmanifest");
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#1e4f78");
    }

    return () => {
      if (manifestLink) {
        manifestLink.setAttribute("href", previousManifest || "/manifest.webmanifest");
      }
      if (themeColorMeta && previousThemeColor) {
        themeColorMeta.setAttribute("content", previousThemeColor);
      }
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("admin.sidebar.collapsed");
    if (stored === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("admin.sidebar.collapsed", isSidebarCollapsed ? "true" : "false");
  }, [isSidebarCollapsed]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "programs":
        return <Programs />;
      case "events":
        return <Events />;
      case "organizations":
        return <Organizations />;
      case "barangays":
        return <Barangays />;
      case "documents":
        return <Documents />;
      case "transparency-board":
        return <TransparencyBoardAdmin />;
      case "financial-dss":
        return <FinancialDss />;
      case "citizen-desk":
        return <CitizenDeskAdmin />;
      case "audit-logs":
        return <AuditLogs />;
      case "users":
        return <UsersPage />;
      case "roles":
        return <Roles />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="admin-shell flex min-h-screen bg-background text-foreground">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((previous) => !previous)}
        className="hidden md:flex"
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[1px]"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={false}
        onNavigate={() => setIsSidebarOpen(false)}
        className={`md:hidden fixed inset-y-0 left-0 z-50 shadow-2xl transition-transform duration-200 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      <main ref={mainRef} className="flex-1 flex flex-col min-w-0">
        <TopNav
          title={tabLabelMap[activeTab] ?? "Admin Portal"}
          onMenuToggle={() => setIsSidebarOpen((previous) => !previous)}
        />
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
        <footer className="mt-auto p-6 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LYDO Connect Admin Portal. Municipality of San Mateo, Rizal.
        </footer>
      </main>
    </div>
  );
}


