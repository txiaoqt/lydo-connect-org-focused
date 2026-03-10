import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Programs } from "./pages/Programs";
import { Events } from "./pages/Events";
import { Organizations } from "./pages/Organizations";
import { Barangays } from "./pages/Barangays";
import { Documents } from "./pages/Documents";
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
      case "users":
        return <UsersPage />;
      case "roles":
        return <Roles />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#071422] text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <div className="p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
        <footer className="mt-auto p-6 border-t border-[#1f3348] text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} LYDO Connect Admin Portal. Municipality of San Mateo, Rizal.
        </footer>
      </main>
    </div>
  );
}

