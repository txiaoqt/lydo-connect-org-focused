import { useState } from "react";
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

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
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
      case "users":
        return <UsersPage />;
      case "roles":
        return <Roles />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <div className="p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
        <footer className="mt-auto p-6 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LYDO Connect Admin Portal. Municipality of San Mateo, Rizal.
        </footer>
      </main>
    </div>
  );
}


