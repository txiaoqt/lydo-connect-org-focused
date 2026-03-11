import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  History,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type AdminTab =
  | "dashboard"
  | "programs"
  | "events"
  | "organizations"
  | "barangays"
  | "documents"
  | "transparency-board"
  | "financial-dss"
  | "citizen-desk"
  | "audit-logs"
  | "users"
  | "roles";

type AdminActivity = {
  id: string;
  text: string;
  detail: string;
  timestamp: string;
  status: "success" | "update" | "pending" | "completed";
  tab: AdminTab;
};

type DashboardUser = {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  email: string;
  contact_number: string | null;
  municipality: string;
  barangay_name: string;
  role_codes: string[];
  notifications: boolean;
  show_email_public: boolean;
  bio: string | null;
  created_at: string;
};

type DashboardProps = {
  onNavigate: (tab: AdminTab) => void;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  tab: AdminTab;
  type: "section" | "activity" | "user";
  score: number;
};

const scoreSearchHit = (query: string, ...parts: string[]) => {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const text = parts.join(" ").toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  if (text === q) score += 12;
  if (text.startsWith(q)) score += 8;
  if (text.includes(q)) score += 5;
  for (const token of tokens) {
    if (text.includes(token)) score += 2;
  }
  return score;
};

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    users: 0,
    programs: 0,
    events: 0,
    organizations: 0,
  });
  const [moduleCounts, setModuleCounts] = useState({
    documents: 0,
    advisories: 0,
    ticketTypes: 0,
    financialRows: 0,
    youthMetricsRows: 0,
    boardRows: 0,
    monthlyRows: 0,
  });
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [overviewSearch, setOverviewSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();

  const loadDashboard = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setTotals({ users: 0, programs: 0, events: 0, organizations: 0 });
      setModuleCounts({
        documents: 0,
        advisories: 0,
        ticketTypes: 0,
        financialRows: 0,
        youthMetricsRows: 0,
        boardRows: 0,
        monthlyRows: 0,
      });
      setRecentActivities([]);
      setDashboardUsers([]);
      setIsLoading(false);
      return;
    }

    const [
      usersResp,
      programsResp,
      eventsResp,
      orgResp,
      docsResp,
      advisoriesResp,
      ticketTypesResp,
      financialResp,
      youthMetricsResp,
      boardResp,
      monthlyResp,
      recentProgramsResp,
      recentEventsResp,
      recentOrgsResp,
      recentTicketsResp,
      userProfilesResp,
      userRolesResp,
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("programs").select("*", { count: "exact", head: true }).in("status", ["published"]),
      supabase.from("events").select("*", { count: "exact", head: true }).in("status", ["upcoming"]),
      supabase.from("organizations").select("*", { count: "exact", head: true }).in("status", ["active", "partner"]),
      supabase.from("disclosure_documents").select("*", { count: "exact", head: true }),
      supabase.from("service_advisories").select("*", { count: "exact", head: true }),
      supabase.from("ticket_types").select("*", { count: "exact", head: true }),
      supabase.from("barangay_financials").select("*", { count: "exact", head: true }),
      supabase.from("barangay_youth_metrics").select("*", { count: "exact", head: true }),
      supabase.from("compliance_board_status").select("*", { count: "exact", head: true }),
      supabase.from("monthly_compliance").select("*", { count: "exact", head: true }),
      supabase.from("programs").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("events").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("organizations").select("id,name,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("citizen_tickets").select("id,subject,created_at,status").order("created_at", { ascending: false }).limit(3),
      supabase
        .from("user_profiles")
        .select("user_id,full_name,display_name,email,contact_number,municipality,notifications,show_email_public,bio,created_at,barangays(name)")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,roles(code)"),
    ]);

    if (userProfilesResp.error) {
      toast({ title: "Dashboard Load Warning", description: userProfilesResp.error.message });
    }

    setTotals({
      users: usersResp.count ?? 0,
      programs: programsResp.count ?? 0,
      events: eventsResp.count ?? 0,
      organizations: orgResp.count ?? 0,
    });

    setModuleCounts({
      documents: docsResp.count ?? 0,
      advisories: advisoriesResp.count ?? 0,
      ticketTypes: ticketTypesResp.count ?? 0,
      financialRows: financialResp.count ?? 0,
      youthMetricsRows: youthMetricsResp.count ?? 0,
      boardRows: boardResp.count ?? 0,
      monthlyRows: monthlyResp.count ?? 0,
    });

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
      .slice(0, 6);

    setRecentActivities(mappedActivities);

    const rolesByUser = (userRolesResp.data ?? []).reduce<Record<string, string[]>>((acc, row) => {
      const relation = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
      const code = Array.isArray(relation) ? relation[0]?.code : relation?.code;
      if (!code) return acc;
      if (!acc[row.user_id]) acc[row.user_id] = [];
      acc[row.user_id].push(code);
      return acc;
    }, {});

    const mappedUsers: DashboardUser[] = (
      (userProfilesResp.data ?? []) as Array<{
        user_id: string;
        full_name: string | null;
        display_name: string | null;
        email: string;
        contact_number: string | null;
        municipality: string;
        notifications: boolean;
        show_email_public: boolean;
        bio: string | null;
        created_at: string;
        barangays?: { name?: string } | Array<{ name?: string }>;
      }>
    ).map((row) => {
      const barangayRef = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
      return {
        user_id: row.user_id,
        full_name: row.full_name,
        display_name: row.display_name,
        email: row.email,
        contact_number: row.contact_number,
        municipality: row.municipality,
        barangay_name: barangayRef?.name ?? "",
        role_codes: rolesByUser[row.user_id] ?? [],
        notifications: row.notifications,
        show_email_public: row.show_email_public,
        bio: row.bio,
        created_at: row.created_at,
      };
    });

    setDashboardUsers(mappedUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = [
    {
      label: "Total Youth Users",
      value: totals.users.toLocaleString(),
      icon: Users,
      color: "blue" as const,
      tab: "users" as const,
      keywords: "users youth profiles members",
    },
    {
      label: "Published Programs",
      value: totals.programs.toLocaleString(),
      icon: Briefcase,
      color: "blue" as const,
      tab: "programs" as const,
      keywords: "programs projects published",
    },
    {
      label: "Upcoming Events",
      value: totals.events.toLocaleString(),
      icon: Calendar,
      color: "amber" as const,
      tab: "events" as const,
      keywords: "events upcoming calendar",
    },
    {
      label: "Active/Partner Orgs",
      value: totals.organizations.toLocaleString(),
      icon: Building2,
      color: "indigo" as const,
      tab: "organizations" as const,
      keywords: "organizations partners groups",
    },
  ];

  const sectionShortcuts = [
    { label: "Dashboard", tab: "dashboard" as const, icon: LayoutDashboard, keywords: "overview analytics summary" },
    { label: "Programs", tab: "programs" as const, icon: Briefcase, keywords: "projects sectors drafts published" },
    { label: "Events", tab: "events" as const, icon: Calendar, keywords: "schedule upcoming past cancelled" },
    { label: "Organizations", tab: "organizations" as const, icon: Building2, keywords: "groups partners active" },
    { label: "Barangay Map Data", tab: "barangays" as const, icon: MapPin, keywords: "barangay maps youth metrics" },
    { label: "Transparency Docs", tab: "documents" as const, icon: FileText, keywords: "documents advisories uploads registry" },
    { label: "Transparency Board", tab: "transparency-board" as const, icon: ClipboardList, keywords: "compliance board monthly" },
    { label: "Financial DSS", tab: "financial-dss" as const, icon: BarChart3, keywords: "budget finance dss rows" },
    { label: "Citizen Desk", tab: "citizen-desk" as const, icon: MessageSquareWarning, keywords: "tickets requests complaints" },
    { label: "Audit Logs", tab: "audit-logs" as const, icon: History, keywords: "audit logs changes history admin edits" },
    { label: "Users", tab: "users" as const, icon: Users, keywords: "accounts profiles members" },
    { label: "Roles & Permissions", tab: "roles" as const, icon: ShieldCheck, keywords: "roles permissions access" },
  ];

  const moduleCoverageCards = [
    { label: "Disclosure Documents", count: moduleCounts.documents, tab: "documents" as const, keywords: "documents disclosure files" },
    { label: "Service Advisories", count: moduleCounts.advisories, tab: "documents" as const, keywords: "advisories notices service" },
    { label: "Ticket Types", count: moduleCounts.ticketTypes, tab: "citizen-desk" as const, keywords: "tickets categories citizen desk" },
    { label: "Barangay Financial Rows", count: moduleCounts.financialRows, tab: "financial-dss" as const, keywords: "finance budget rows" },
    { label: "Barangay Youth Metrics", count: moduleCounts.youthMetricsRows, tab: "barangays" as const, keywords: "barangay metrics youth" },
    { label: "Compliance Board Rows", count: moduleCounts.boardRows, tab: "transparency-board" as const, keywords: "compliance board" },
    { label: "Monthly Compliance Rows", count: moduleCounts.monthlyRows, tab: "transparency-board" as const, keywords: "monthly compliance reports" },
  ];

  const overviewResults = useMemo(() => {
    const query = overviewSearch.trim().toLowerCase();
    if (!query) return [] as SearchResult[];

    const sectionHits: SearchResult[] = [
      ...sectionShortcuts.map((section) => ({
        id: `section-${section.tab}`,
        title: section.label,
        subtitle: "Open admin section",
        tab: section.tab,
        type: "section" as const,
        score: scoreSearchHit(query, section.label, section.keywords),
      })),
      ...stats.map((stat) => ({
        id: `stat-${stat.tab}`,
        title: stat.label,
        subtitle: `${stat.value} records`,
        tab: stat.tab,
        type: "section" as const,
        score: scoreSearchHit(query, stat.label, stat.keywords),
      })),
      ...moduleCoverageCards.map((card) => ({
        id: `coverage-${card.label}`,
        title: card.label,
        subtitle: `${card.count} rows`,
        tab: card.tab,
        type: "section" as const,
        score: scoreSearchHit(query, card.label, card.keywords),
      })),
    ];

    const activityHits: SearchResult[] = recentActivities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: activity.text,
      subtitle: activity.detail,
      tab: activity.tab,
      type: "activity" as const,
      score: scoreSearchHit(query, activity.text, activity.detail, activity.tab),
    }));

    const userHits: SearchResult[] = dashboardUsers.map((user) => ({
      id: `user-${user.user_id}`,
      title: user.full_name || user.display_name || user.email,
      subtitle: `${user.email} ${user.barangay_name} ${user.municipality} ${user.role_codes.join(", ")}`.trim(),
      tab: "users" as const,
      type: "user" as const,
      score: scoreSearchHit(
        query,
        user.full_name ?? "",
        user.display_name ?? "",
        user.email,
        user.barangay_name ?? "",
        user.municipality ?? "",
        user.role_codes.join(" "),
      ),
    }));

    return [...sectionHits, ...activityHits, ...userHits]
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);
  }, [dashboardUsers, moduleCoverageCards, overviewSearch, recentActivities, sectionShortcuts, stats]);

  const filteredUsers = useMemo(
    () =>
      dashboardUsers.filter((user) => {
        const term = userSearch.toLowerCase();
        return (
          (user.full_name ?? "").toLowerCase().includes(term) ||
          (user.display_name ?? "").toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.municipality.toLowerCase().includes(term) ||
          (user.barangay_name ?? "").toLowerCase().includes(term) ||
          user.role_codes.join(",").toLowerCase().includes(term)
        );
      }),
    [dashboardUsers, userSearch],
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Live Supabase metrics with smart navigation across all admin modules.
        </p>
      </header>

      <section className="bg-card p-5 rounded-2xl border border-border card-shadow space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Smart search: users, modules, tickets, programs, events..."
            value={overviewSearch}
            onChange={(e) => setOverviewSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
          />
        </div>
        {overviewSearch.trim() && (
          <div className="rounded-xl border border-border overflow-hidden">
            {overviewResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No overview results found.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {overviewResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(result.tab)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <p className="text-sm font-semibold text-foreground">{result.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.subtitle} - {result.type}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {sectionShortcuts.map((section) => (
            <button
              key={section.tab}
              type="button"
              onClick={() => onNavigate(section.tab)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <section.icon size={13} />
              {section.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigate(stat.tab)}
            className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StatsCard label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Portal Data Coverage</h2>
            <span className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Live from Supabase"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moduleCoverageCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => onNavigate(card.tab)}
                className={`rounded-xl border border-border bg-muted/40 px-4 py-3 text-left hover:bg-muted/60 transition-colors ${
                  card.label === "Monthly Compliance Rows" ? "md:col-span-2" : ""
                }`}
              >
                <p className="font-semibold text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.count} rows</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border card-shadow">
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
          <div className="space-y-5">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent Supabase activity yet.</p>
            ) : (
              recentActivities.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => onNavigate(activity.tab)}
                  className="flex gap-4 w-full text-left hover:bg-muted/30 rounded-xl p-2 -mx-2 transition-colors"
                >
                  <div
                    className={`mt-1 p-2 rounded-lg shrink-0 ${
                      activity.status === "success"
                        ? "bg-accent/15 text-accent"
                        : activity.status === "update"
                          ? "bg-primary/10 text-primary"
                          : activity.status === "pending"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {activity.status === "success" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="w-full mt-8 py-3 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>

      <section className="bg-card p-6 rounded-2xl border border-border card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">All User Data</h2>
            <p className="text-sm text-muted-foreground">
              Full user-profile rows fetched from Supabase (`{dashboardUsers.length}` records).
            </p>
          </div>
          <input
            type="text"
            placeholder="Search user data..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full md:w-80 h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Display</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Barangay</th>
                <th className="px-4 py-3 font-semibold">Municipality</th>
                <th className="px-4 py-3 font-semibold">Notifications</th>
                <th className="px-4 py-3 font-semibold">Public Email</th>
                <th className="px-4 py-3 font-semibold">Bio</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={12}>
                    No user records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-mono text-xs">{user.user_id}</td>
                    <td className="px-4 py-3">{user.full_name || ""}</td>
                    <td className="px-4 py-3">{user.display_name || ""}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.contact_number || ""}</td>
                    <td className="px-4 py-3">{user.role_codes.join(", ") || "youth"}</td>
                    <td className="px-4 py-3">{user.barangay_name || ""}</td>
                    <td className="px-4 py-3">{user.municipality}</td>
                    <td className="px-4 py-3">{user.notifications ? "true" : "false"}</td>
                    <td className="px-4 py-3">{user.show_email_public ? "true" : "false"}</td>
                    <td className="px-4 py-3 max-w-[260px] truncate">{user.bio || ""}</td>
                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
