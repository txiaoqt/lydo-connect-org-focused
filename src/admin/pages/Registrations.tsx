import { Download, RefreshCw, Search, Table2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/admin/components/DataTable";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { extractAttendanceRecords } from "@/lib/attendance-csv";
import { normalizeGoogleSheetCsvUrl } from "@/lib/external-registration";

type RegistrationMode = "events" | "programs";

type RecordOption = {
  id: string;
  title: string;
  registration_sheet_url?: string | null;
  external_attendance_enabled?: boolean | null;
};

type LocalRegistrationRow = {
  id: string;
  recordId: string;
  recordTitle: string;
  fullName: string;
  email: string;
  contactNumber: string;
  municipality: string;
  barangay: string;
  status: string;
  source: string;
  syncStatus: "pending" | "synced" | "failed" | "skipped";
  syncError: string;
  syncedAt: string;
  registeredAt: string;
};

type ExternalAttendanceRow = {
  id: string;
  timestamp: string;
  name: string;
  email: string;
};

const formatLocalDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatStatusLabel = (value?: string | null) => {
  const normalized = (value ?? "").trim();
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const hasMissingIntegrationColumns = (message?: string | null) =>
  Boolean(message && /(registration_sheet_url|external_attendance_enabled)/i.test(message));

const hasMissingSyncColumns = (message?: string | null) =>
  Boolean(message && /(gform_sync_status|gform_sync_error|gform_synced_at|source)/i.test(message));

const hasMissingRelation = (message?: string | null) =>
  Boolean(message && /(does not exist|relation .* does not exist|42P01)/i.test(message));

const hasPermissionDenied = (message?: string | null) =>
  Boolean(message && /(permission denied|row-level security|rls|42501)/i.test(message));

export const Registrations = () => {
  const [mode, setMode] = useState<RegistrationMode>("events");
  const [events, setEvents] = useState<RecordOption[]>([]);
  const [programs, setPrograms] = useState<RecordOption[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<LocalRegistrationRow[]>([]);
  const [programRegistrations, setProgramRegistrations] = useState<LocalRegistrationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetRows, setSheetRows] = useState<ExternalAttendanceRow[]>([]);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [retryingRowId, setRetryingRowId] = useState<string | null>(null);
  const [isRunningSyncNow, setIsRunningSyncNow] = useState(false);
  const { toast } = useToast();

  const loadRegistrationData = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setEvents([]);
      setPrograms([]);
      setEventRegistrations([]);
      setProgramRegistrations([]);
      setIsLoading(false);
      return;
    }

    let eventsResp = await supabase
      .from("events")
      .select("id,title,registration_sheet_url,external_attendance_enabled")
      .order("event_date", { ascending: false, nullsFirst: false });
    if (eventsResp.error && hasMissingIntegrationColumns(eventsResp.error.message)) {
      const fallback = await supabase.from("events").select("id,title").order("event_date", { ascending: false, nullsFirst: false });
      eventsResp = {
        data: (fallback.data ?? []).map((row) => ({ ...row, registration_sheet_url: null, external_attendance_enabled: false })),
        error: fallback.error,
      };
    }

    let programsResp = await supabase
      .from("programs")
      .select("id,title,registration_sheet_url,external_attendance_enabled")
      .order("created_at", { ascending: false });
    if (programsResp.error && hasMissingIntegrationColumns(programsResp.error.message)) {
      const fallback = await supabase.from("programs").select("id,title").order("created_at", { ascending: false });
      programsResp = {
        data: (fallback.data ?? []).map((row) => ({ ...row, registration_sheet_url: null, external_attendance_enabled: false })),
        error: fallback.error,
      };
    }

    let eventRegsResp = await supabase
      .from("event_registrations")
      .select(
        "id,event_id,full_name,email,contact_number,municipality,barangay_id,registration_status,registered_at,source,gform_sync_status,gform_sync_error,gform_synced_at,cancelled_at",
      )
      .is("cancelled_at", null)
      .in("registration_status", ["registered", "attended", "waitlisted"])
      .order("registered_at", { ascending: false });
    if (eventRegsResp.error && hasMissingSyncColumns(eventRegsResp.error.message)) {
      const fallback = await supabase
        .from("event_registrations")
        .select(
          "id,event_id,full_name,email,contact_number,municipality,barangay_id,registration_status,registered_at,cancelled_at",
        )
        .is("cancelled_at", null)
        .in("registration_status", ["registered", "attended", "waitlisted"])
        .order("registered_at", { ascending: false });
      eventRegsResp = {
        data: (fallback.data ?? []).map((row) => ({
          ...row,
          source: "portal_direct",
          gform_sync_status: "skipped",
          gform_sync_error: null,
          gform_synced_at: null,
        })),
        error: fallback.error,
      };
    }

    let programRegsResp = await supabase
      .from("program_registrations")
      .select(
        "id,program_id,full_name,email,contact_number,municipality,barangay_id,registration_status,registered_at,source,gform_sync_status,gform_sync_error,gform_synced_at,cancelled_at",
      )
      .is("cancelled_at", null)
      .in("registration_status", ["registered", "attended", "waitlisted"])
      .order("registered_at", { ascending: false });
    if (programRegsResp.error && hasMissingSyncColumns(programRegsResp.error.message)) {
      const fallback = await supabase
        .from("program_registrations")
        .select(
          "id,program_id,full_name,email,contact_number,municipality,barangay_id,registration_status,registered_at,cancelled_at",
        )
        .is("cancelled_at", null)
        .in("registration_status", ["registered", "attended", "waitlisted"])
        .order("registered_at", { ascending: false });
      programRegsResp = {
        data: (fallback.data ?? []).map((row) => ({
          ...row,
          source: "portal_direct",
          gform_sync_status: "skipped",
          gform_sync_error: null,
          gform_synced_at: null,
        })),
        error: fallback.error,
      };
    }

    let barangaysResp = await supabase.from("barangays").select("id,name");

    const warnings: string[] = [];

    if (eventsResp.error) {
      warnings.push(`Events list: ${eventsResp.error.message}`);
      eventsResp = { data: [], error: null } as typeof eventsResp;
    }

    if (programsResp.error) {
      warnings.push(`Programs list: ${programsResp.error.message}`);
      programsResp = { data: [], error: null } as typeof programsResp;
    }

    if (eventRegsResp.error) {
      if (hasMissingRelation(eventRegsResp.error.message) || hasPermissionDenied(eventRegsResp.error.message)) {
        warnings.push(`Event registrations: ${eventRegsResp.error.message}`);
        eventRegsResp = { data: [], error: null } as typeof eventRegsResp;
      } else {
        toast({ title: "Load Failed", description: eventRegsResp.error.message });
        setIsLoading(false);
        return;
      }
    }

    if (programRegsResp.error) {
      if (hasMissingRelation(programRegsResp.error.message) || hasPermissionDenied(programRegsResp.error.message)) {
        warnings.push(`Program registrations: ${programRegsResp.error.message}`);
        programRegsResp = { data: [], error: null } as typeof programRegsResp;
      } else {
        toast({ title: "Load Failed", description: programRegsResp.error.message });
        setIsLoading(false);
        return;
      }
    }

    if (barangaysResp.error) {
      warnings.push(`Barangays: ${barangaysResp.error.message}`);
      barangaysResp = { data: [], error: null } as typeof barangaysResp;
    }

    const eventCatalog = (eventsResp.data ?? []) as RecordOption[];
    const programCatalog = (programsResp.data ?? []) as RecordOption[];
    const barangayMap = new Map((barangaysResp.data ?? []).map((row) => [row.id, row.name]));
    const eventTitleById = new Map(eventCatalog.map((row) => [row.id, row.title]));
    const programTitleById = new Map(programCatalog.map((row) => [row.id, row.title]));

    const mappedEventRegistrations: LocalRegistrationRow[] = (eventRegsResp.data ?? []).map((row) => ({
      id: row.id,
      recordId: row.event_id,
      recordTitle: eventTitleById.get(row.event_id) ?? "Unknown Event",
      fullName: row.full_name ?? "",
      email: row.email ?? "",
      contactNumber: row.contact_number ?? "",
      municipality: row.municipality ?? "",
      barangay: row.barangay_id ? barangayMap.get(row.barangay_id) ?? "N/A" : "N/A",
      status: formatStatusLabel(row.registration_status),
      source: row.source ?? "portal_direct",
      syncStatus: (row.gform_sync_status ?? "skipped") as LocalRegistrationRow["syncStatus"],
      syncError: row.gform_sync_error ?? "",
      syncedAt: formatLocalDateTime(row.gform_synced_at),
      registeredAt: formatLocalDateTime(row.registered_at),
    }));

    const mappedProgramRegistrations: LocalRegistrationRow[] = (programRegsResp.data ?? []).map((row) => ({
      id: row.id,
      recordId: row.program_id,
      recordTitle: programTitleById.get(row.program_id) ?? "Unknown Program",
      fullName: row.full_name ?? "",
      email: row.email ?? "",
      contactNumber: row.contact_number ?? "",
      municipality: row.municipality ?? "",
      barangay: row.barangay_id ? barangayMap.get(row.barangay_id) ?? "N/A" : "N/A",
      status: formatStatusLabel(row.registration_status),
      source: row.source ?? "portal_direct",
      syncStatus: (row.gform_sync_status ?? "skipped") as LocalRegistrationRow["syncStatus"],
      syncError: row.gform_sync_error ?? "",
      syncedAt: formatLocalDateTime(row.gform_synced_at),
      registeredAt: formatLocalDateTime(row.registered_at),
    }));

    setEvents(eventCatalog);
    setPrograms(programCatalog);
    setEventRegistrations(mappedEventRegistrations);
    setProgramRegistrations(mappedProgramRegistrations);
    setIsLoading(false);

    if (warnings.length > 0) {
      const registrationPolicyHint = warnings.some((warning) =>
        /event registrations|program registrations/i.test(warning),
      )
        ? " Run the latest registration anon-admin policy SQL migration if you use predefined local admin login."
        : "";

      toast({
        title: "Partial Data Loaded",
        description: `${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ""}.${registrationPolicyHint}`,
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadRegistrationData();
  }, [loadRegistrationData]);

  useEffect(() => {
    setSelectedRecordId("all");
    setSearchTerm("");
    setSheetRows([]);
    setSheetError(null);
  }, [mode]);

  const records = mode === "events" ? events : programs;
  const localRows = mode === "events" ? eventRegistrations : programRegistrations;
  const selectedRecord = records.find((row) => row.id === selectedRecordId);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return localRows.filter((row) => {
      const matchesRecord = selectedRecordId === "all" ? true : row.recordId === selectedRecordId;
      const matchesSearch =
        term.length === 0 ||
        row.recordTitle.toLowerCase().includes(term) ||
        row.fullName.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.contactNumber.toLowerCase().includes(term) ||
        row.municipality.toLowerCase().includes(term) ||
        row.barangay.toLowerCase().includes(term);
      return matchesRecord && matchesSearch;
    });
  }, [localRows, searchTerm, selectedRecordId]);

  const hasExternalSheet = Boolean(selectedRecord?.registration_sheet_url);
  const pendingSyncCount = filteredRows.filter((row) => row.syncStatus === "pending").length;

  const retrySync = async (row: LocalRegistrationRow) => {
    if (!supabase) return;
    setRetryingRowId(row.id);
    const kind = mode === "events" ? "event" : "program";

    const rpcResp = await supabase.rpc("retry_registration_sync", {
      p_kind: kind,
      p_registration_id: row.id,
    });

    if (rpcResp.error) {
      const tableName = mode === "events" ? "event_registrations" : "program_registrations";
      const fallback = await supabase
        .from(tableName)
        .update({
          gform_sync_status: "pending",
          gform_sync_error: null,
          gform_synced_at: null,
        })
        .eq("id", row.id);

      if (fallback.error) {
        toast({
          title: "Retry Failed",
          description: rpcResp.error.message || fallback.error.message,
        });
        setRetryingRowId(null);
        return;
      }
    }

    const patchRow = (current: LocalRegistrationRow) =>
      current.id === row.id
        ? {
            ...current,
            syncStatus: "pending" as const,
            syncError: "",
            syncedAt: "N/A",
          }
        : current;

    if (mode === "events") {
      setEventRegistrations((prev) => prev.map(patchRow));
    } else {
      setProgramRegistrations((prev) => prev.map(patchRow));
    }

    toast({
      title: "Sync Retry Queued",
      description: "The registration row is now pending for worker sync.",
    });
    setRetryingRowId(null);
  };

  const getSyncTriggerToken = () => {
    const envToken = ((import.meta.env.VITE_SYNC_TRIGGER_TOKEN as string | undefined) ?? "").trim();
    if (envToken) return envToken;
    if (typeof window === "undefined") return "";

    const storageKey = "admin.sync_trigger_token";
    const storedToken = (window.localStorage.getItem(storageKey) ?? "").trim();
    if (storedToken) return storedToken;

    const enteredToken = window.prompt("Enter sync trigger token:");
    const normalizedToken = (enteredToken ?? "").trim();
    if (normalizedToken) {
      window.localStorage.setItem(storageKey, normalizedToken);
    }
    return normalizedToken;
  };

  const runSyncNow = async () => {
    const token = getSyncTriggerToken();
    if (!token) {
      toast({
        title: "Sync Token Required",
        description: "Set a valid sync trigger token to run the worker once.",
      });
      return;
    }

    setIsRunningSyncNow(true);
    try {
      const response = await fetch("/api/sync-run-once", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-trigger-token": token,
        },
      });

      let payload: { ok?: boolean; processed?: number; error?: string } | null = null;
      try {
        payload = (await response.json()) as { ok?: boolean; processed?: number; error?: string };
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || `Sync endpoint returned HTTP ${response.status}.`);
      }

      const processed = Number(payload?.processed ?? 0);
      toast({
        title: "Sync Run Complete",
        description:
          processed > 0
            ? `Processed ${processed} pending registration row(s).`
            : "No pending registrations were processed.",
      });

      await loadRegistrationData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run sync now.";
      toast({
        title: "Sync Run Failed",
        description: message,
      });
    } finally {
      setIsRunningSyncNow(false);
    }
  };

  const loadSheetPreview = async () => {
    if (!selectedRecord?.registration_sheet_url) {
      toast({ title: "No Sheet Configured", description: "Set a Google Sheet URL in the event/program form first." });
      return;
    }

    const csvUrl = normalizeGoogleSheetCsvUrl(selectedRecord.registration_sheet_url);
    if (!csvUrl) {
      setSheetRows([]);
      setSheetError("Invalid Google Sheet URL format.");
      toast({ title: "Invalid Sheet URL", description: "Use a published Google Sheet URL." });
      return;
    }

    setIsLoadingSheet(true);
    setSheetError(null);
    setSheetRows([]);

    try {
      const requestUrl = new URL(csvUrl);
      requestUrl.searchParams.set("_ts", String(Date.now()));
      const response = await fetch(requestUrl.toString(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Sheet returned HTTP ${response.status}.`);
      }
      const csvText = await response.text();
      const extracted = extractAttendanceRecords(csvText);
      if (extracted.length === 0) {
        setSheetRows([]);
        setSheetError("No attendance rows detected. Check if the sheet is published and has Email/Name columns.");
        return;
      }

      const deduped = Array.from(
        extracted
          .reduce((map, row) => {
            const emailKey = row.email.trim().toLowerCase();
            const fallbackKey = `${row.name.trim().toLowerCase()}|${row.timestamp.trim()}`;
            map.set(emailKey || fallbackKey, row);
            return map;
          }, new Map<string, (typeof extracted)[number]>())
          .values(),
      );

      const mappedRows: ExternalAttendanceRow[] = deduped.map((row, index) => ({
        id: `sheet-${index}`,
        timestamp: row.timestamp || "-",
        name: row.name || "Unknown",
        email: row.email || "N/A",
      }));

      setSheetRows(mappedRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch Google Sheet data.";
      setSheetRows([]);
      setSheetError(message);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const exportFilteredCsv = () => {
    const header = [
      "Record",
      "Full Name",
      "Email",
      "Contact Number",
      "Municipality",
      "Barangay",
      "Status",
      "Sync Status",
      "Registered At",
    ];
    const rows = filteredRows.map((row) => [
      row.recordTitle,
      row.fullName,
      row.email,
      row.contactNumber,
      row.municipality,
      row.barangay,
      row.status,
      row.syncStatus,
      row.registeredAt,
    ]);

    const escapeCell = (value: string) => {
      if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/"/g, "\"\"")}"`;
      }
      return value;
    };

    const csvContent = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${mode}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const localColumns = [
    {
      header: "Record",
      accessor: (row: LocalRegistrationRow) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.recordTitle}</span>
          <span className="text-xs text-muted-foreground">{mode === "events" ? "Event" : "Program"}</span>
        </div>
      ),
    },
    { header: "Name", accessor: "fullName" as const },
    { header: "Email", accessor: "email" as const },
    { header: "Source", accessor: (row: LocalRegistrationRow) => formatStatusLabel(row.source) },
    { header: "Contact", accessor: "contactNumber" as const },
    {
      header: "Location",
      accessor: (row: LocalRegistrationRow) => (
        <div className="text-sm">
          <div>{row.municipality}</div>
          <div className="text-xs text-muted-foreground">{row.barangay}</div>
        </div>
      ),
    },
    { header: "Status", accessor: "status" as const },
    {
      header: "Sync",
      accessor: (row: LocalRegistrationRow) => (
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.syncStatus === "synced"
                ? "bg-primary/10 text-primary"
                : row.syncStatus === "pending"
                  ? "bg-warning/15 text-warning"
                  : row.syncStatus === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {formatStatusLabel(row.syncStatus)}
          </span>
          {row.syncStatus === "failed" ? (
            <div className="space-y-1">
              {row.syncError ? <p className="max-w-[220px] text-[11px] text-destructive/90 line-clamp-2">{row.syncError}</p> : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={retryingRowId === row.id}
                onClick={() => void retrySync(row)}
                className="h-7 px-2 text-xs"
              >
                {retryingRowId === row.id ? "Retrying..." : "Retry"}
              </Button>
            </div>
          ) : null}
        </div>
      ),
    },
    { header: "Synced At", accessor: "syncedAt" as const },
    { header: "Registered", accessor: "registeredAt" as const },
  ];

  const externalColumns = [
    { header: "Timestamp", accessor: "timestamp" as const },
    { header: "Name", accessor: "name" as const },
    { header: "Email", accessor: "email" as const },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Registrations</h1>
        <p className="text-muted-foreground font-medium">
          Monitor event and program registrations, then preview external attendance from published Google Sheets.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="bg-card border rounded-2xl p-4 card-shadow">
          <p className="admin-kicker mb-2">Registration Type</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "events" ? "default" : "outline"} onClick={() => setMode("events")}>
              Events
            </Button>
            <Button type="button" variant={mode === "programs" ? "default" : "outline"} onClick={() => setMode("programs")}>
              Programs
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 card-shadow xl:col-span-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto]">
            <div className="space-y-1">
              <label className="admin-kicker">Record Filter</label>
              <select
                value={selectedRecordId}
                onChange={(event) => {
                  setSelectedRecordId(event.target.value);
                  setSheetRows([]);
                  setSheetError(null);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All {mode === "events" ? "Events" : "Programs"}</option>
                {records.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="admin-kicker">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, email, record..."
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                />
              </div>
            </div>
            <Button type="button" variant="outline" className="self-end" onClick={() => void loadRegistrationData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" className="self-end" onClick={() => void runSyncNow()} disabled={isRunningSyncNow}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRunningSyncNow ? "animate-spin" : ""}`} />
              {isRunningSyncNow ? "Running Sync..." : "Run Sync Now"}
            </Button>
            <Button type="button" variant="outline" className="self-end" onClick={exportFilteredCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-2xl p-4 card-shadow">
          <p className="admin-kicker">Total Rows</p>
          <p className="text-2xl font-semibold mt-2">{filteredRows.length}</p>
        </div>
        <div className="bg-card border rounded-2xl p-4 card-shadow">
          <p className="admin-kicker">Unique Participants</p>
          <p className="text-2xl font-semibold mt-2">{new Set(filteredRows.map((row) => row.email.toLowerCase())).size}</p>
        </div>
        <div className="bg-card border rounded-2xl p-4 card-shadow">
          <p className="admin-kicker">Pending Sync</p>
          <p className="text-2xl font-semibold mt-2">{pendingSyncCount}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Local Portal Registrations
          </h2>
        </div>
        <DataTable columns={localColumns} data={filteredRows} isLoading={isLoading} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Table2 className="h-4 w-4 text-primary" />
            External Attendance Preview
          </h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSheetPreview()}
              disabled={!hasExternalSheet || isLoadingSheet || selectedRecordId === "all"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoadingSheet ? "Loading..." : "Load Sheet Preview"}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 card-shadow space-y-2">
          {selectedRecordId === "all" ? (
            <p className="text-sm text-muted-foreground">Select one event/program to preview its external attendance sheet.</p>
          ) : !hasExternalSheet ? (
            <p className="text-sm text-muted-foreground">
              No Google Sheet URL configured for this {mode === "events" ? "event" : "program"}.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Preview source: <span className="font-medium break-all">{selectedRecord?.registration_sheet_url}</span>
              </p>
              {sheetError ? <p className="text-sm text-destructive">{sheetError}</p> : null}
              <DataTable columns={externalColumns} data={sheetRows} isLoading={isLoadingSheet} />
            </>
          )}
        </div>
      </section>
    </div>
  );
};
