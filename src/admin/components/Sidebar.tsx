
import React, { useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPin,
  MessageSquareWarning,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EFFECTIVE_ADMIN_SIGNIN_PATH } from "@/lib/deployment-surface";
import BrandLogo from "@/components/BrandLogo";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200",
      collapsed && "justify-center px-2",
      active ? "bg-primary/10 text-primary ring-1 ring-primary/10" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
    )}
  >
    <Icon size={18} />
    {!collapsed && <span className="min-w-0 truncate">{label}</span>}
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

type SidebarGroup = {
  id: string;
  label: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
  }>;
};

const menuGroups: SidebarGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { id: "programs", label: "Programs", icon: Briefcase },
      { id: "events", label: "Events", icon: Calendar },
      { id: "organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    id: "participation",
    label: "Participation",
    items: [{ id: "registrations", label: "Registrations", icon: UserCheck }],
  },
  {
    id: "community-map",
    label: "Community Map",
    items: [{ id: "barangays", label: "Community Map", icon: MapPin }],
  },
  {
    id: "transparency",
    label: "Transparency",
    items: [
      { id: "documents", label: "Transparency Documents", icon: FileText },
      { id: "transparency-board", label: "Accountability Board", icon: ClipboardList },
      { id: "financial-dss", label: "Financial Reports", icon: BarChart3 },
      { id: "youth-desk", label: "Youth Services Desk", icon: MessageSquareWarning },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "roles", label: "Roles and Permissions", icon: ShieldCheck },
      { id: "audit-logs", label: "Audit Logs", icon: History },
    ],
  },
];

const trendsGroup: SidebarGroup = {
  id: "trends-analytics",
  label: "Trends and Analytics",
  items: [{ id: "outcomes-analytics", label: "Trends and Analytics", icon: LineChart }],
};

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
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

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
        "sticky top-0 flex h-screen flex-col border-r border-border/80 bg-background transition-[width] duration-200",
        collapsed ? "w-20" : "w-[18rem]",
        className,
      )}
    >
      <div className={cn("flex items-start justify-between gap-3 border-b border-border/70", collapsed ? "p-3" : "p-4")}>
        <BrandLogo
          imgClassName={collapsed ? "h-9 w-9" : "h-10 w-10"}
          showText={!collapsed}
          subtitle={collapsed ? undefined : "ADMIN PORTAL"}
          className={collapsed ? "w-full justify-center" : "min-w-0"}
          textClassName={collapsed ? "hidden" : "min-w-0"}
        />
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        )}
      </div>

      <div className={cn("flex-1 min-h-0 overflow-y-auto", collapsed ? "px-2 py-3" : "px-3 py-4")}>
        <nav className="space-y-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.id} className={cn("space-y-2", groupIndex > 0 && "pt-4 border-t border-border/70")}>
              {!collapsed && (
                <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                  {group.label}
                </p>
              )}
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

      <div className={cn("border-t border-border/70", collapsed ? "p-2" : "p-3")}>
        <div className="space-y-2">
          {!collapsed && (
            <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              {trendsGroup.label}
            </p>
          )}
          <SidebarItem
            icon={trendsGroup.items[0].icon}
            label={trendsGroup.items[0].label}
            active={activeTab === trendsGroup.items[0].id}
            collapsed={collapsed}
            onClick={() => handleSelectTab(trendsGroup.items[0].id)}
          />
        </div>

        <button
          onClick={() => setIsSignOutDialogOpen(true)}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleSignOut()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
