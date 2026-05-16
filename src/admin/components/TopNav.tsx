import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, Download, Menu, Search, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type AdminTab =
  | "programs"
  | "events"
  | "organizations"
  | "citizen-desk"
  | "audit-logs";

type AdminActivity = {
  id: string;
  text: string;
  detail: string;
  timestamp: string;
  status: "success" | "update" | "pending" | "completed";
  tab: AdminTab;
};

interface TopNavProps {
  title?: string;
  onMenuToggle?: () => void;
  onNavigateTab?: (tab: AdminTab) => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

export const TopNav = ({ title = "Admin Portal", onMenuToggle, onNavigateTab }: TopNavProps) => {
  const { user } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setActivities([]);
        return;
      }

      setIsLoadingActivities(true);
      const [recentProgramsResp, recentEventsResp, recentOrgsResp, recentTicketsResp] = await Promise.all([
        supabase.from("programs").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("organizations").select("id,name,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("citizen_tickets").select("id,subject,created_at,status").order("created_at", { ascending: false }).limit(5),
      ]);

      const mappedActivities: AdminActivity[] = [
        ...(recentProgramsResp.data ?? []).map((row) => ({
          id: `p-${row.id}`,
          text: row.title,
          detail: "Program created",
          timestamp: row.created_at,
          status: "update" as const,
          tab: "programs" as const,
        })),
        ...(recentEventsResp.data ?? []).map((row) => ({
          id: `e-${row.id}`,
          text: row.title,
          detail: "Event created",
          timestamp: row.created_at,
          status: "success" as const,
          tab: "events" as const,
        })),
        ...(recentOrgsResp.data ?? []).map((row) => ({
          id: `o-${row.id}`,
          text: row.name,
          detail: "Organization registered",
          timestamp: row.created_at,
          status: "pending" as const,
          tab: "organizations" as const,
        })),
        ...(recentTicketsResp.data ?? []).map((row) => ({
          id: `t-${row.id}`,
          text: row.subject,
          detail: `Citizen ticket: ${row.status}`,
          timestamp: row.created_at,
          status: row.status === "resolved" || row.status === "closed" ? ("completed" as const) : ("pending" as const),
          tab: "citizen-desk" as const,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setActivities(mappedActivities);
      setIsLoadingActivities(false);
    };

    void loadActivities();
  }, []);

  const hasNotificationIndicator = useMemo(() => activities.length > 0, [activities.length]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <header className="h-16 md:h-20 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden h-10 w-10 rounded-lg border border-border bg-background text-foreground flex items-center justify-center"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>
        <div className="md:hidden min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        </div>
      </div>

      <div className="relative hidden md:block w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search for programs, events, or users..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {installPrompt && (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="sm:hidden h-9 w-9 rounded-lg border border-border text-primary bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center"
            aria-label="Install admin app"
          >
            <Download size={16} />
          </button>
        )}

        {installPrompt && (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Download size={14} />
            Install App
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
              <Bell size={20} />
              {hasNotificationIndicator && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent border-2 border-card" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[340px] p-0">
            <div className="px-4 py-3">
              <DropdownMenuLabel className="p-0 text-sm font-bold text-foreground">Recent Activity</DropdownMenuLabel>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[360px] overflow-y-auto p-2">
              {isLoadingActivities ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">Loading activity...</div>
              ) : activities.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">No recent activity yet.</div>
              ) : (
                activities.slice(0, 8).map((activity) => (
                  <DropdownMenuItem
                    key={activity.id}
                    className="items-start rounded-lg px-2 py-2 cursor-pointer"
                    onClick={() => onNavigateTab?.(activity.tab)}
                  >
                    <div
                      className={`mt-0.5 mr-2 rounded-md p-1.5 ${
                        activity.status === "success"
                          ? "bg-accent/15 text-accent"
                          : activity.status === "update"
                            ? "bg-primary/10 text-primary"
                            : activity.status === "pending"
                              ? "bg-warning/20 text-warning"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {activity.status === "success" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.detail}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center py-2 text-primary font-semibold" onClick={() => onNavigateTab?.("audit-logs")}>
              View all activity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:block h-8 w-[1px] bg-border mx-1" />

        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 cursor-pointer group min-w-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {user?.displayName || "Admin User"}
            </p>
            <p className="text-xs text-muted-foreground">Super Administrator</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-transparent group-hover:border-primary/20 transition-all">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};
