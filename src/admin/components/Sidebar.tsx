
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  LogOut,
  Briefcase,
  MapPin,
  ShieldCheck,
  MessageSquareWarning,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  key?: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'programs', label: 'Programs', icon: Briefcase },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'barangays', label: 'Barangay Map Data', icon: MapPin },
    { id: 'documents', label: 'Transparency Docs', icon: FileText },
    { id: 'transparency-board', label: 'Transparency Board', icon: ClipboardList },
    { id: 'financial-dss', label: 'Financial DSS', icon: BarChart3 },
    { id: 'citizen-desk', label: 'Citizen Desk', icon: MessageSquareWarning },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <aside className="w-72 bg-card border-r border-border h-screen flex flex-col sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[var(--glow-primary)]">
            L
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-tight">LYDO Connect</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-border">
        <button
          onClick={() => void handleSignOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full text-left font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
