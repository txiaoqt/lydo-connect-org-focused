
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
  BarChart3,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EFFECTIVE_ADMIN_SIGNIN_PATH } from "@/lib/deployment-surface";
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
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
      collapsed && "justify-center px-2",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon size={20} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
  className,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const menuGroups = [
    {
      id: "overview",
      label: "Overview",
      items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      id: "youth",
      label: "Youth Records",
      items: [
        { id: "programs", label: "Programs", icon: Briefcase },
        { id: "events", label: "Events", icon: Calendar },
        { id: "registrations", label: "Registrations", icon: UserCheck },
        { id: "organizations", label: "Organizations", icon: Building2 },
        { id: "barangays", label: "Barangay Map Data", icon: MapPin },
      ],
    },
    {
      id: "transparency",
      label: "Transparency",
      items: [
        { id: "documents", label: "Transparency Docs", icon: FileText },
        { id: "transparency-board", label: "Transparency Board", icon: ClipboardList },
        { id: "financial-dss", label: "Financial DSS", icon: BarChart3 },
        { id: "citizen-desk", label: "Citizen Desk", icon: MessageSquareWarning },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      items: [
        { id: "audit-logs", label: "Audit Logs", icon: History },
        { id: "users", label: "Users", icon: Users },
        { id: "roles", label: "Roles & Permissions", icon: ShieldCheck },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate(EFFECTIVE_ADMIN_SIGNIN_PATH);
    onNavigate?.();
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-screen flex flex-col sticky top-0 transition-[width] duration-200",
        collapsed ? "w-20" : "w-72",
        className,
      )}
    >
      <div className={cn("pb-5", collapsed ? "p-4" : "p-8")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[var(--glow-primary)]">
              L
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-foreground text-lg leading-tight">LYDO Connect</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Admin Portal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto pb-6", collapsed ? "px-2" : "px-6")}>
        <nav className="space-y-5">
          {menuGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className={cn("space-y-2", groupIndex > 0 && "pt-4 border-t border-border/70")}
            >
              {!collapsed && <p className="admin-kicker px-4">{group.label}</p>}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => handleSelectTab(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className={cn("mt-auto border-t border-border flex flex-col gap-2", collapsed ? "p-3" : "p-8")}>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "hidden md:flex items-center gap-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              collapsed ? "h-10 w-full justify-center px-2" : "w-full px-4 py-2.5",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
          </button>
        )}

        <button
          onClick={() => void handleSignOut()}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full text-left font-medium",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
