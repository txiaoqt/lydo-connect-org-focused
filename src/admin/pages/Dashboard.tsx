import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Mail,
  MapPin,
  Eye,
  Filter,
  IdCard,
  MessageSquareText,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Bell,
  Users,
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminTab =
  | "dashboard"
  | "outcomes-analytics"
  | "programs"
  | "events"
  | "registrations"
  | "organizations"
  | "barangays"
  | "documents"
  | "transparency-board"
  | "financial-dss"
  | "youth-desk"
  | "audit-logs"
  | "users"
  | "roles";

type DashboardProps = {
  onNavigate: (tab: AdminTab) => void;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  tab: AdminTab;
  type: "section" | "user";
  score: number;
};

type DashboardDateRange = "all" | "7" | "30" | "90";
type ProgramStatusFilter = "all" | "published" | "draft" | "archived";
type EventStatusFilter = "all" | "upcoming" | "draft" | "past" | "cancelled";
type OrganizationStatusFilter = "active-partner" | "all" | "active" | "partner" | "inactive";
type NotificationsFilter = "all" | "enabled" | "disabled";

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

type ProgramRow = {
  id: string;
  status: string | null;
  type?: string | null;
  created_at: string;
  published_at?: string | null;
};

type EventRow = {
  id: string;
  status: string | null;
  created_at: string;
  event_date?: string | null;
};

type OrganizationRow = {
  id: string;
  status: string | null;
  type: string | null;
  created_at: string;
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

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDateTime = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString() : "N/A";
};

const getUserDisplayName = (user: DashboardUser) => user.full_name || user.display_name || user.email;
const getUserRoles = (user: DashboardUser) => (user.role_codes.length > 0 ? user.role_codes : ["youth"]);

type DetailFieldProps = {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
};

const DetailField = ({ icon: Icon, label, value, mono = false }: DetailFieldProps) => (
  <div className="rounded-xl border border-border bg-background/80 p-3.5">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
        <Icon size={15} />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`text-sm font-medium text-foreground break-words ${mono ? "font-mono text-xs leading-relaxed" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  </div>
);

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<DashboardUser[]>([]);
  const [allPrograms, setAllPrograms] = useState<ProgramRow[]>([]);
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<OrganizationRow[]>([]);
  const [overviewSearch, setOverviewSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<DashboardDateRange>("30");
  const [roleFilter, setRoleFilter] = useState("all");
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [municipalityFilter, setMunicipalityFilter] = useState("all");
  const [notificationsFilter, setNotificationsFilter] = useState<NotificationsFilter>("all");
  const [programStatusFilter, setProgramStatusFilter] = useState<ProgramStatusFilter>("published");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>("upcoming");
  const [organizationStatusFilter, setOrganizationStatusFilter] = useState<OrganizationStatusFilter>("active-partner");
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setAllUsers([]);
      setAllPrograms([]);
      setAllEvents([]);
      setAllOrganizations([]);
      setLastRefreshedAt(null);
      setIsLoading(false);
      return;
    }

    const [programsResp, eventsResp, organizationsResp, userProfilesResp, userRolesResp] = await Promise.all([
      supabase.from("programs").select("id,status,created_at,published_at"),
      supabase.from("events").select("id,status,created_at,event_date"),
      supabase.from("organizations").select("id,status,type,created_at"),
      supabase
        .from("user_profiles")
        .select("user_id,full_name,display_name,email,contact_number,municipality,notifications,show_email_public,bio,created_at,barangays(name)")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,roles(code)"),
    ]);

    if (userProfilesResp.error) {
      toast({ title: "Dashboard Load Warning", description: userProfilesResp.error.message });
    }

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

    setAllUsers(mappedUsers);
    setAllPrograms((programsResp.data ?? []) as ProgramRow[]);
    setAllEvents((eventsResp.data ?? []) as EventRow[]);
    setAllOrganizations((organizationsResp.data ?? []) as OrganizationRow[]);
    setLastRefreshedAt(new Date());
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const dateRangeLabel = useMemo(() => {
    if (dateRangeFilter === "all") return "All time";
    return `Last ${dateRangeFilter} days`;
  }, [dateRangeFilter]);

  const rangeStartDate = useMemo(() => {
    if (dateRangeFilter === "all") return null;
    return new Date(Date.now() - Number(dateRangeFilter) * 24 * 60 * 60 * 1000);
  }, [dateRangeFilter]);

  const inSelectedRange = useCallback(
    (rawDate?: string | null) => {
      if (!rangeStartDate) return true;
      const parsed = parseDate(rawDate);
      return Boolean(parsed && parsed >= rangeStartDate);
    },
    [rangeStartDate],
  );

  const roleOptions = useMemo(
    () => ["all", ...Array.from(new Set(allUsers.flatMap((u) => getUserRoles(u)))).sort((a, b) => a.localeCompare(b))],
    [allUsers],
  );

  const barangayOptions = useMemo(
    () => ["all", ...Array.from(new Set(allUsers.map((u) => u.barangay_name).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [allUsers],
  );

  const municipalityOptions = useMemo(
    () => ["all", ...Array.from(new Set(allUsers.map((u) => u.municipality).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [allUsers],
  );

  const organizationTypeOptions = useMemo(
    () => ["all", ...Array.from(new Set(allOrganizations.map((org) => (org.type ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [allOrganizations],
  );

  const filteredPrograms = useMemo(
    () =>
      allPrograms.filter((program) => {
        const matchesStatus = programStatusFilter === "all" ? true : program.status === programStatusFilter;
        const dateSource = program.published_at || program.created_at;
        return matchesStatus && inSelectedRange(dateSource);
      }),
    [allPrograms, inSelectedRange, programStatusFilter],
  );

  const filteredEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const matchesStatus = eventStatusFilter === "all" ? true : event.status === eventStatusFilter;
        const dateSource = event.event_date || event.created_at;
        return matchesStatus && inSelectedRange(dateSource);
      }),
    [allEvents, eventStatusFilter, inSelectedRange],
  );

  const filteredOrganizations = useMemo(
    () =>
      allOrganizations.filter((organization) => {
        const matchesStatus =
          organizationStatusFilter === "all"
            ? true
            : organizationStatusFilter === "active-partner"
              ? organization.status === "active" || organization.status === "partner"
              : organization.status === organizationStatusFilter;
        const matchesType =
          organizationTypeFilter === "all"
            ? true
            : (organization.type ?? "").trim().toLowerCase() === organizationTypeFilter.toLowerCase();
        return matchesStatus && matchesType && inSelectedRange(organization.created_at);
      }),
    [allOrganizations, inSelectedRange, organizationStatusFilter, organizationTypeFilter],
  );

  const filteredUsers = useMemo(
    () =>
      allUsers.filter((user) => {
        const normalizedSearch = userSearch.trim().toLowerCase();
        const roles = getUserRoles(user);
        const matchesSearch =
          normalizedSearch.length === 0
            ? true
            : (user.full_name ?? "").toLowerCase().includes(normalizedSearch) ||
              (user.display_name ?? "").toLowerCase().includes(normalizedSearch) ||
              user.email.toLowerCase().includes(normalizedSearch) ||
              user.municipality.toLowerCase().includes(normalizedSearch) ||
              (user.barangay_name ?? "").toLowerCase().includes(normalizedSearch) ||
              roles.join(",").toLowerCase().includes(normalizedSearch);

        const matchesRole = roleFilter === "all" ? true : roles.includes(roleFilter);
        const matchesBarangay = barangayFilter === "all" ? true : user.barangay_name === barangayFilter;
        const matchesMunicipality = municipalityFilter === "all" ? true : user.municipality === municipalityFilter;
        const matchesNotifications =
          notificationsFilter === "all"
            ? true
            : notificationsFilter === "enabled"
              ? user.notifications
              : !user.notifications;
        const matchesDateRange = inSelectedRange(user.created_at);

        return (
          matchesSearch &&
          matchesRole &&
          matchesBarangay &&
          matchesMunicipality &&
          matchesNotifications &&
          matchesDateRange
        );
      }),
    [
      allUsers,
      barangayFilter,
      inSelectedRange,
      municipalityFilter,
      notificationsFilter,
      roleFilter,
      userSearch,
    ],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Youth Users",
        value: filteredUsers.length.toLocaleString(),
        icon: Users,
        color: "blue" as const,
        tab: "users" as const,
        actionLabel: "View all users",
        keywords: "users youth profiles members",
      },
      {
        label: "Published Programs",
        value: filteredPrograms.length.toLocaleString(),
        icon: Briefcase,
        color: "blue" as const,
        tab: "programs" as const,
        actionLabel: "View programs",
        keywords: "programs projects published",
      },
      {
        label: "Upcoming Events",
        value: filteredEvents.length.toLocaleString(),
        icon: Calendar,
        color: "amber" as const,
        tab: "events" as const,
        actionLabel: "View events",
        keywords: "events upcoming calendar",
      },
      {
        label: "Active/Partner Orgs",
        value: filteredOrganizations.length.toLocaleString(),
        icon: Building2,
        color: "indigo" as const,
        tab: "organizations" as const,
        actionLabel: "View organizations",
        keywords: "organizations partners groups",
      },
    ],
    [filteredEvents.length, filteredOrganizations.length, filteredPrograms.length, filteredUsers.length],
  );

  const sectionShortcuts = useMemo(
    () => [
      { label: "Dashboard", tab: "dashboard" as const, keywords: "overview analytics summary" },
      { label: "Trends and Analytics", tab: "outcomes-analytics" as const, keywords: "program event trends analytics participation performance" },
      { label: "Programs", tab: "programs" as const, keywords: "projects sectors drafts published" },
      { label: "Events", tab: "events" as const, keywords: "schedule upcoming past cancelled" },
      { label: "Registrations", tab: "registrations" as const, keywords: "event program registration attendance" },
      { label: "Organizations", tab: "organizations" as const, keywords: "groups partners active" },
      { label: "Barangay Map Data", tab: "barangays" as const, keywords: "barangay maps youth metrics" },
      { label: "Transparency Docs", tab: "documents" as const, keywords: "documents uploads registry" },
      { label: "Transparency Board", tab: "transparency-board" as const, keywords: "compliance board monthly" },
      { label: "Financial DSS", tab: "financial-dss" as const, keywords: "budget finance dss rows" },
      { label: "Youth Desk", tab: "youth-desk" as const, keywords: "tickets requests complaints" },
      { label: "Audit Logs", tab: "audit-logs" as const, keywords: "audit logs changes history admin edits" },
      { label: "Users", tab: "users" as const, keywords: "accounts profiles members" },
      { label: "Roles & Permissions", tab: "roles" as const, keywords: "roles permissions access" },
    ],
    [],
  );

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
    ];

    const userHits: SearchResult[] = filteredUsers.map((user) => ({
      id: `user-${user.user_id}`,
      title: getUserDisplayName(user),
      subtitle: `${user.email} ${user.barangay_name} ${user.municipality} ${getUserRoles(user).join(", ")}`.trim(),
      tab: "users" as const,
      type: "user" as const,
      score: scoreSearchHit(
        query,
        user.full_name ?? "",
        user.display_name ?? "",
        user.email,
        user.barangay_name ?? "",
        user.municipality ?? "",
        getUserRoles(user).join(" "),
      ),
    }));

    return [...sectionHits, ...userHits]
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);
  }, [filteredUsers, overviewSearch, sectionShortcuts, stats]);

  const activeFilterCount = useMemo(() => {
    const flags = [
      dateRangeFilter !== "30",
      roleFilter !== "all",
      barangayFilter !== "all",
      municipalityFilter !== "all",
      notificationsFilter !== "all",
      programStatusFilter !== "published",
      eventStatusFilter !== "upcoming",
      organizationStatusFilter !== "active-partner",
      organizationTypeFilter !== "all",
    ];
    return flags.filter(Boolean).length;
  }, [
    barangayFilter,
    dateRangeFilter,
    eventStatusFilter,
    municipalityFilter,
    notificationsFilter,
    organizationStatusFilter,
    organizationTypeFilter,
    programStatusFilter,
    roleFilter,
  ]);

  useEffect(() => {
    setUserPage(1);
  }, [filteredUsers.length, userPageSize]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const currentUserPage = Math.min(userPage, totalUserPages);
  const userPageStart = filteredUsers.length === 0 ? 0 : (currentUserPage - 1) * userPageSize + 1;
  const userPageEnd = Math.min(currentUserPage * userPageSize, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(userPageStart > 0 ? userPageStart - 1 : 0, userPageEnd);

  const quickActions = [
    { label: "Add Program", tab: "programs" as const, icon: Plus },
    { label: "Add Event", tab: "events" as const, icon: Plus },
    { label: "Add Organization", tab: "organizations" as const, icon: Plus },
    { label: "Manage Users", tab: "users" as const, icon: Users },
  ];

  const openUserDetails = (user: DashboardUser) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };

  const clearFilters = () => {
    setDateRangeFilter("30");
    setRoleFilter("all");
    setBarangayFilter("all");
    setMunicipalityFilter("all");
    setNotificationsFilter("all");
    setProgramStatusFilter("published");
    setEventStatusFilter("upcoming");
    setOrganizationStatusFilter("active-partner");
    setOrganizationTypeFilter("all");
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Focused admin metrics, quick actions, and live user records from Supabase.
          </p>
        </div>
        <div className="text-xs font-semibold text-muted-foreground">
          {lastRefreshedAt ? `Last refreshed: ${formatDateTime(lastRefreshedAt.toISOString())}` : "Awaiting live data"}
        </div>
      </header>

      <section className="bg-card p-4 rounded-2xl border border-border card-shadow space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Quick Actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant={action.label === "Manage Users" ? "outline" : "default"}
                  size="sm"
                  onClick={() => onNavigate(action.tab)}
                  className="h-9"
                >
                  <action.icon size={16} />
                  {action.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen((prev) => !prev)}
                className="h-9"
              >
                <Filter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{activeFilterCount}</span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadDashboard()}
                className="h-9"
              >
                <RefreshCw size={15} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="w-full xl:w-[220px]">
            <label htmlFor="dashboard-date-range">Date Range</label>
            <select
              id="dashboard-date-range"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as DashboardDateRange)}
              className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{dateRangeLabel}</p>
          </div>
        </div>

        {isFiltersOpen && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div>
                <label htmlFor="dashboard-role-filter">User Role</label>
                <select
                  id="dashboard-role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "all" ? "All roles" : role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-barangay-filter">Barangay</label>
                <select
                  id="dashboard-barangay-filter"
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {barangayOptions.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay === "all" ? "All barangays" : barangay}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-municipality-filter">Municipality</label>
                <select
                  id="dashboard-municipality-filter"
                  value={municipalityFilter}
                  onChange={(e) => setMunicipalityFilter(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {municipalityOptions.map((municipality) => (
                    <option key={municipality} value={municipality}>
                      {municipality === "all" ? "All municipalities" : municipality}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-notifications-filter">Notifications</label>
                <select
                  id="dashboard-notifications-filter"
                  value={notificationsFilter}
                  onChange={(e) => setNotificationsFilter(e.target.value as NotificationsFilter)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-program-status-filter">Program Status</label>
                <select
                  id="dashboard-program-status-filter"
                  value={programStatusFilter}
                  onChange={(e) => setProgramStatusFilter(e.target.value as ProgramStatusFilter)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-event-status-filter">Event Status</label>
                <select
                  id="dashboard-event-status-filter"
                  value={eventStatusFilter}
                  onChange={(e) => setEventStatusFilter(e.target.value as EventStatusFilter)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="draft">Draft</option>
                  <option value="past">Past</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-org-status-filter">Org Status</label>
                <select
                  id="dashboard-org-status-filter"
                  value={organizationStatusFilter}
                  onChange={(e) => setOrganizationStatusFilter(e.target.value as OrganizationStatusFilter)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active-partner">Active + Partner</option>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="partner">Partner</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboard-org-type-filter">Org Type</label>
                <select
                  id="dashboard-org-type-filter"
                  value={organizationTypeFilter}
                  onChange={(e) => setOrganizationTypeFilter(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {organizationTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === "all" ? "All types" : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search dashboard records..."
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
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigate(stat.tab)}
            className="w-full h-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StatsCard label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} actionLabel={stat.actionLabel} />
          </button>
        ))}
      </div>

      <section className="bg-card p-5 rounded-2xl border border-border card-shadow space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">All User Data</h2>
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length.toLocaleString()} of {allUsers.length.toLocaleString()} user profiles shown.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type="text"
                placeholder="Search user data..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={userPageSize}
              onChange={(e) => setUserPageSize(Number(e.target.value))}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rows per page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1120px] table-fixed text-sm">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-3 py-3 font-semibold">User ID</th>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Display Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Contact</th>
                <th className="px-3 py-3 font-semibold">Roles</th>
                <th className="px-3 py-3 font-semibold">Barangay</th>
                <th className="px-3 py-3 font-semibold">Municipality</th>
                <th className="px-3 py-3 font-semibold">Notifications</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={10}>
                    No user records found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-muted/25 transition-colors">
                    <td className="px-3 py-3 align-middle font-mono text-xs text-muted-foreground break-all leading-snug">
                      {user.user_id}
                    </td>
                    <td className="px-3 py-3 align-middle font-semibold text-foreground">
                      <span className="line-clamp-2">{user.full_name || "N/A"}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-muted-foreground">
                      <span className="line-clamp-2">{user.display_name || "N/A"}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-foreground break-all">{user.email}</td>
                    <td className="px-3 py-3 align-middle text-muted-foreground">{user.contact_number || "N/A"}</td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {getUserRoles(user).map((role) => (
                          <Badge
                            key={`${user.user_id}-${role}`}
                            variant="outline"
                            className="border-border bg-muted/60 text-foreground hover:bg-muted"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-muted-foreground">
                      <span className="line-clamp-2">{user.barangay_name || "N/A"}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-muted-foreground">
                      <span className="line-clamp-2">{user.municipality || "N/A"}</span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <Badge
                        variant="outline"
                        className={
                          user.notifications
                            ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/10"
                            : "border-border bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {user.notifications ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Open actions for ${getUserDisplayName(user)}`}
                            className="h-9 w-9"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openUserDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate("users")}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {userPageStart} to {userPageEnd} of {filteredUsers.length.toLocaleString()} results
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setUserPage((page) => Math.max(1, page - 1))}
              disabled={currentUserPage <= 1}
              aria-label="Previous user page"
              className="h-9 w-9"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-10 rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-bold text-primary">
              {currentUserPage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setUserPage((page) => Math.min(totalUserPages, page + 1))}
              disabled={currentUserPage >= totalUserPages}
              aria-label="Next user page"
              className="h-9 w-9"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl p-0 border-border bg-card shadow-xl rounded-2xl overflow-hidden">
          <DialogHeader>
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-border bg-card">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">User Profile Details</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">Full Supabase profile record.</DialogDescription>
            </div>
          </DialogHeader>

          {selectedUser && (
            <div className="max-h-[78vh] overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <CircleUserRound size={26} />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-foreground leading-tight">{getUserDisplayName(selectedUser)}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground break-all">
                        <Mail size={14} />
                        {selectedUser.email}
                      </p>
                      <div className="pt-1">
                        <Badge className="bg-accent/90 hover:bg-accent text-accent-foreground w-fit">
                          <BadgeCheck size={13} />
                          Active Account
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:min-w-[250px]">
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Created Date</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{formatDateTime(selectedUser.created_at)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs text-foreground mt-0.5 break-all leading-relaxed">{selectedUser.user_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-base font-bold text-foreground">Profile Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailField icon={Users} label="Full Name" value={selectedUser.full_name || "N/A"} />
                  <DetailField icon={IdCard} label="Display Name" value={selectedUser.display_name || "N/A"} />
                  <DetailField icon={Phone} label="Contact" value={selectedUser.contact_number || "N/A"} />
                  <DetailField
                    icon={Eye}
                    label="Public Email"
                    value={selectedUser.show_email_public ? "Visible on public profile" : "Hidden from public profile"}
                  />
                  <DetailField icon={MapPin} label="Barangay" value={selectedUser.barangay_name || "N/A"} />
                  <DetailField icon={Building2} label="Municipality" value={selectedUser.municipality || "N/A"} />
                  <DetailField
                    icon={Bell}
                    label="Notifications"
                    value={
                      <Badge
                        variant="outline"
                        className={
                          selectedUser.notifications
                            ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/10"
                            : "border-border bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {selectedUser.notifications ? "Enabled" : "Disabled"}
                      </Badge>
                    }
                  />
                  <DetailField
                    icon={ShieldCheck}
                    label="Roles"
                    value={
                      <div className="flex flex-wrap gap-1.5">
                        {getUserRoles(selectedUser).map((role) => (
                          <Badge key={`${selectedUser.user_id}-${role}`} variant="outline" className="border-border bg-muted/60 text-foreground">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                </div>

                <div className="rounded-xl border border-border bg-background/80 p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <MessageSquareText size={15} />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio</p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">{selectedUser.bio || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <DialogFooter className="px-5 sm:px-6 py-4 border-t border-border bg-card">
            <Button type="button" variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
