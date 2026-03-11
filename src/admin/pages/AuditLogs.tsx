import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Filter, RefreshCw, Search } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuditLogEntry, AuditOperation } from "../types";

type ComparisonRow = {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

const OPERATION_META: Record<AuditOperation, { label: string; badgeClass: string }> = {
  INSERT: { label: "Created", badgeClass: "bg-accent/15 text-accent" },
  UPDATE: { label: "Updated", badgeClass: "bg-primary/10 text-primary" },
  DELETE: { label: "Deleted", badgeClass: "bg-destructive/10 text-destructive" },
};

const TABLE_LABELS: Record<string, string> = {
  programs: "Programs",
  events: "Events",
  organizations: "Organizations",
  user_profiles: "Users",
  user_roles: "User Roles",
  roles: "Role Settings",
  barangays: "Barangays",
  offices: "Offices",
  disclosure_documents: "Transparency Documents",
  barangay_financials: "Barangay Financials",
  barangay_youth_metrics: "Barangay Youth Metrics",
  compliance_board_status: "Compliance Board",
  monthly_compliance: "Monthly Compliance",
  service_advisories: "Service Advisories",
  ticket_types: "Citizen Desk Ticket Types",
  citizen_tickets: "Citizen Desk Tickets",
  event_registrations: "Event Registrations",
  program_registrations: "Program Registrations",
  admin_accounts: "Admin Accounts",
};

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  display_name: "Display Name",
  contact_number: "Contact Number",
  show_email_public: "Show Email Publicly",
  notifications: "Notifications",
  source_post_url: "Source Post Link",
  published_at: "Published At",
  start_date: "Start Date",
  end_date: "End Date",
  event_date: "Event Date",
  start_time: "Start Time",
  end_time: "End Time",
  barangay_id: "Barangay",
  created_by: "Created By",
  reference_no: "Reference Number",
  requester_email: "Requester Email",
  registration_status: "Registration Status",
  cancelled_at: "Cancelled At",
  location_latitude: "Location Latitude",
  location_longitude: "Location Longitude",
  applies_to_all_barangays: "Applies to All Barangays",
  completion_percent: "Completion Percent",
  storage_path: "Storage Path",
  public_url: "Public URL",
  document_type: "Document Type",
  document_type_other: "Document Type (Other)",
  fiscal_year: "Fiscal Year",
  month_no: "Month",
  due_date: "Due Date",
  created_at: "Created At",
  updated_at: "Updated At",
};

const PRIORITY_KEYS = [
  "title",
  "name",
  "subject",
  "status",
  "sector",
  "event_date",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "location",
  "email",
  "full_name",
  "display_name",
  "reference_no",
  "doc_code",
  "id",
];

const SUMMARY_KEYS = [
  "title",
  "name",
  "subject",
  "status",
  "sector",
  "event_date",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "location",
  "email",
  "full_name",
  "display_name",
  "reference_no",
  "doc_code",
  "id",
];

const RECORD_TITLE_KEYS = ["title", "name", "subject", "full_name", "display_name", "reference_no", "doc_code", "email"];
const HIDDEN_CHANGED_KEYS = new Set(["updated_at"]);

const toTitleWords = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toJsonObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTimeOnly = (value: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(value);
const isIsoTimestamp = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value);

const formatTime = (value: string) => {
  const [hh, mm] = value.slice(0, 5).split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const formatValue = (value: unknown, fieldKey?: string): string => {
  if (value == null || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString() : String(value);
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return "Not set";

    if ((fieldKey?.endsWith("_at") || fieldKey === "published_at") && isIsoTimestamp(raw)) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
    }
    if ((fieldKey?.includes("date") || fieldKey === "due_date") && isDateOnly(raw)) {
      const parsed = new Date(`${raw}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString();
    }
    if ((fieldKey?.includes("time") || fieldKey?.endsWith("_time")) && isTimeOnly(raw)) {
      return formatTime(raw);
    }
    return raw;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    if (value.every((item) => item == null || ["string", "number", "boolean"].includes(typeof item))) {
      return value.map((item) => formatValue(item)).join(", ");
    }
    return `${value.length} items`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const areEqual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const sortKeys = (keys: string[]) => {
  const priorityMap = new Map(PRIORITY_KEYS.map((key, index) => [key, index]));
  return Array.from(new Set(keys)).sort((left, right) => {
    const leftPriority = priorityMap.has(left) ? priorityMap.get(left)! : Number.MAX_SAFE_INTEGER;
    const rightPriority = priorityMap.has(right) ? priorityMap.get(right)! : Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.localeCompare(right);
  });
};

const toTableLabel = (tableName: string) => TABLE_LABELS[tableName] ?? toTitleWords(tableName);
const toFieldLabel = (key: string) => FIELD_LABELS[key] ?? toTitleWords(key);

const toActorLabel = (entry: AuditLogEntry) => {
  const raw = entry.actor_name?.trim() || entry.actor_email?.trim() || entry.actor_user_id?.trim() || "";
  if (!raw) return "Unknown Admin";
  if (raw === "anon-admin-session") return "Admin Session";
  return raw;
};

const toActorRoleLabel = (entry: AuditLogEntry) => {
  const role = (entry.actor_role || "").trim().toLowerCase();
  if (!role) return "Unknown Role";
  if (role === "anon") return "Local Admin";
  if (role === "authenticated") return "Authenticated User";
  if (role === "unknown") return "Unknown Role";
  return role
    .split(",")
    .map((part) => toTitleWords(part.trim().replace(/\s+/g, "_")))
    .join(", ");
};

const toRowPkLabel = (entry: AuditLogEntry) => {
  const payload = toJsonObject(entry.row_pk);
  const pairs = Object.entries(payload);
  if (pairs.length === 0) return "N/A";
  return pairs.map(([key, value]) => `${key}: ${formatValue(value, key)}`).join(" | ");
};

const toRecordTitle = (entry: AuditLogEntry) => {
  const primary = entry.operation === "DELETE" ? toJsonObject(entry.old_data) : toJsonObject(entry.new_data);
  const fallback = entry.operation === "DELETE" ? toJsonObject(entry.new_data) : toJsonObject(entry.old_data);

  for (const key of RECORD_TITLE_KEYS) {
    const candidate = primary[key] ?? fallback[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number") return candidate.toLocaleString();
  }

  const rowPk = toJsonObject(entry.row_pk);
  if (rowPk.id != null) return String(rowPk.id);
  return `${toTableLabel(entry.table_name)} record`;
};

const toRecordId = (entry: AuditLogEntry) => {
  const rowPk = toJsonObject(entry.row_pk);
  if (rowPk.id != null) return String(rowPk.id);
  const pairs = Object.entries(rowPk);
  if (pairs.length === 0) return "N/A";
  return pairs.map(([key, value]) => `${key}: ${formatValue(value, key)}`).join(" | ");
};

const getChangedKeys = (entry: AuditLogEntry) => {
  const oldData = toJsonObject(entry.old_data);
  const newData = toJsonObject(entry.new_data);

  if (entry.operation === "UPDATE") {
    const keysFromLog = (entry.changed_fields ?? []).filter((key) => key && !HIDDEN_CHANGED_KEYS.has(key));
    if (keysFromLog.length > 0) return sortKeys(keysFromLog);

    const diffKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).filter(
      (key) => !HIDDEN_CHANGED_KEYS.has(key) && !areEqual(oldData[key], newData[key]),
    );
    return sortKeys(diffKeys);
  }

  if (entry.operation === "INSERT") {
    return sortKeys(Object.keys(newData));
  }

  return sortKeys(Object.keys(oldData));
};

const toChangedFieldsSummary = (entry: AuditLogEntry) => {
  if (entry.operation === "INSERT") return "New record created";
  if (entry.operation === "DELETE") return "Record deleted";
  const keys = getChangedKeys(entry);
  if (keys.length === 0) return "Details updated";
  const labels = keys.map(toFieldLabel);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
};

const buildComparisonRows = (entry: AuditLogEntry): ComparisonRow[] => {
  const oldData = toJsonObject(entry.old_data);
  const newData = toJsonObject(entry.new_data);
  const keys = getChangedKeys(entry).slice(0, 30);

  return keys.map((key) => {
    const before = formatValue(oldData[key], key);
    const after = formatValue(newData[key], key);
    const changed = entry.operation === "UPDATE" ? !areEqual(oldData[key], newData[key]) : true;

    return {
      key,
      label: toFieldLabel(key),
      before,
      after,
      changed,
    };
  });
};

const buildSummaryFields = (entry: AuditLogEntry): Array<{ key: string; label: string; value: string }> => {
  const primary = entry.operation === "DELETE" ? toJsonObject(entry.old_data) : toJsonObject(entry.new_data);
  const fallback = entry.operation === "DELETE" ? toJsonObject(entry.new_data) : toJsonObject(entry.old_data);

  let keys = SUMMARY_KEYS.filter((key) => primary[key] != null || fallback[key] != null);
  if (keys.length === 0) {
    keys = sortKeys(Object.keys(primary)).slice(0, 10);
  }
  if (!keys.includes("id") && (primary.id != null || fallback.id != null)) {
    keys = ["id", ...keys];
  }

  return keys.slice(0, 10).map((key) => ({
    key,
    label: toFieldLabel(key),
    value: formatValue(primary[key] ?? fallback[key], key),
  }));
};

const toJsonPreview = (value: unknown) => {
  if (value == null) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [operationFilter, setOperationFilter] = useState<"all" | AuditOperation>("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        "id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,operation,table_schema,table_name,row_pk,changed_fields,old_data,new_data",
      )
      .order("occurred_at", { ascending: false })
      .limit(500);

    if (error) {
      toast({
        title: "Audit Logs Load Failed",
        description: error.message,
      });
      setLogs([]);
      setIsLoading(false);
      return;
    }

    setLogs((data ?? []) as AuditLogEntry[]);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const availableTables = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((entry) => entry.table_name).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [logs],
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((entry) => {
        const term = searchTerm.trim().toLowerCase();
        const haystack = [
          toActorLabel(entry).toLowerCase(),
          toActorRoleLabel(entry).toLowerCase(),
          toTableLabel(entry.table_name).toLowerCase(),
          toRecordTitle(entry).toLowerCase(),
          toRowPkLabel(entry).toLowerCase(),
          toChangedFieldsSummary(entry).toLowerCase(),
          OPERATION_META[entry.operation].label.toLowerCase(),
        ].join(" ");

        const matchesSearch = term.length === 0 ? true : haystack.includes(term);
        const matchesOperation = operationFilter === "all" ? true : entry.operation === operationFilter;
        const matchesTable = tableFilter === "all" ? true : entry.table_name === tableFilter;
        return matchesSearch && matchesOperation && matchesTable;
      }),
    [logs, operationFilter, searchTerm, tableFilter],
  );

  const totalToday = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((entry) => new Date(entry.occurred_at).toDateString() === today).length;
  }, [logs]);

  const uniqueActors = useMemo(() => new Set(logs.map((entry) => toActorLabel(entry))).size, [logs]);

  const selectedRows = useMemo(() => (selectedLog ? buildComparisonRows(selectedLog) : []), [selectedLog]);
  const selectedSummary = useMemo(() => (selectedLog ? buildSummaryFields(selectedLog) : []), [selectedLog]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            See who changed records, where the change happened, and exactly what was updated.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadLogs()}>
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Changes</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{totalToday}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admins</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{uniqueActors}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-4 rounded-2xl border border-border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search admin, section, record, or change..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className={`flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-xl transition-all border ${
            showFilters
              ? "text-primary bg-primary/10 border-primary/30"
              : "text-muted-foreground hover:bg-muted border-border"
          }`}
        >
          <Filter size={18} />
          Filter
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card p-4 rounded-2xl border border-border card-shadow">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Action</label>
            <select
              value={operationFilter}
              onChange={(event) => setOperationFilter(event.target.value as "all" | AuditOperation)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All actions</option>
              <option value="INSERT">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Section</label>
            <select
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {availableTables.map((tableName) => (
                <option key={tableName} value={tableName}>
                  {tableName === "all" ? "All sections" : toTableLabel(tableName)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOperationFilter("all");
                setTableFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Changes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground" colSpan={7}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground" colSpan={7}>
                    No audit entries found for current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                      {new Date(entry.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-foreground">{toActorLabel(entry)}</p>
                      <p className="text-xs text-muted-foreground">{toActorRoleLabel(entry)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${OPERATION_META[entry.operation].badgeClass}`}>
                        {OPERATION_META[entry.operation].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium text-foreground">{toTableLabel(entry.table_name)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium text-foreground break-words">{toRecordTitle(entry)}</p>
                      <p className="text-xs text-muted-foreground break-all">ID: {toRecordId(entry)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs text-muted-foreground">{toChangedFieldsSummary(entry)}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(entry);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription>
              Readable summary of what changed, with highlighted before and after values.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{new Date(selectedLog.occurred_at).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{toActorLabel(selectedLog)}</p>
                  <p className="text-xs text-muted-foreground">{toActorRoleLabel(selectedLog)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{toTableLabel(selectedLog.table_name)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{OPERATION_META[selectedLog.operation].label}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedLog.operation === "UPDATE"
                      ? "Highlighted Changes"
                      : selectedLog.operation === "INSERT"
                        ? "Added Information"
                        : "Removed Information"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    Record: {toRecordTitle(selectedLog)} (ID: {toRecordId(selectedLog)})
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/10">
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Before</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedRows.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={3}>
                            No field-level details captured for this entry.
                          </td>
                        </tr>
                      ) : (
                        selectedRows.map((row) => (
                          <tr key={row.key} className={row.changed ? "bg-primary/5" : ""}>
                            <td className="px-4 py-3 align-top">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${row.changed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {row.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top text-sm text-muted-foreground break-words">{row.before}</td>
                            <td className="px-4 py-3 align-top text-sm text-foreground break-words">{row.after}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Record Snapshot</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSummary.map((field) => (
                    <div key={field.key} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</p>
                      <p className="text-sm text-foreground break-words mt-1">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <details className="rounded-xl border border-border bg-muted/10 p-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Technical JSON (optional)</summary>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Old Data JSON</p>
                    <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground">
                      {toJsonPreview(selectedLog.old_data)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">New Data JSON</p>
                    <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground">
                      {toJsonPreview(selectedLog.new_data)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
