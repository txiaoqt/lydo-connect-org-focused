import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileBarChart2,
  Filter,
  LineChart,
  MapPinned,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "../components/DataTable";
import { ProgramOutcomeRow } from "../types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type AdminTab =
  | "dashboard"
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
  | "roles"
  | "outcomes-analytics";

type OutcomesAnalyticsProps = {
  onNavigate?: (tab: AdminTab) => void;
};

type ProgramLite = {
  id: string;
  title: string;
  sector: string | null;
  status: string | null;
  barangay_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  published_at: string | null;
};

type EventLite = {
  id: string;
  title: string;
  sector: string | null;
  status: string | null;
  barangay_id: string | null;
  event_date: string | null;
  created_at: string;
};

type BarangayLite = {
  id: string;
  name: string;
  youth_population: number | null;
};

type OutcomeDoc = {
  id: string;
  title: string;
  document_type: string;
  fiscal_year: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  published_date: string | null;
};

type UnifiedRegistrationRow = {
  id: string;
  recordType: "program" | "event";
  recordId: string;
  recordTitle: string;
  sector: string;
  recordStatus: string;
  barangayId: string | null;
  municipality: string;
  email: string;
  userId: string | null;
  registrationStatus: string;
  registeredAt: string;
  source: string;
  syncStatus: "pending" | "synced" | "failed" | "skipped";
};

type RegistrationRaw = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  municipality: string | null;
  barangay_id: string | null;
  registration_status: string | null;
  registered_at: string;
  source?: string | null;
  gform_sync_status?: string | null;
  program_id?: string;
  event_id?: string;
};

type OutcomeForm = {
  programId: string;
  reportDocumentId: string;
  recordedOn: string;
  targetParticipants: string;
  actualParticipants: string;
  completionPercent: string;
  objectivesAchieved: string;
  outcomeSummary: string;
  challenges: string;
  recommendations: string;
};

type TrendGranularity = "month" | "quarter" | "year";
type RangeFilter = "all" | "30" | "90" | "180" | "365";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"] as const;
const SYNC_STATUS_ORDER = ["pending", "failed", "synced", "skipped"] as const;
const PIE_COLORS = ["#1A3F7A", "#0EA5A6", "#F59E0B", "#E11D48", "#2E8B57", "#0F766E"];

const defaultOutcomeForm: OutcomeForm = {
  programId: "",
  reportDocumentId: "",
  recordedOn: new Date().toISOString().slice(0, 10),
  targetParticipants: "0",
  actualParticipants: "0",
  completionPercent: "0",
  objectivesAchieved: "",
  outcomeSummary: "",
  challenges: "",
  recommendations: "",
};

const hasMissingSyncColumns = (message?: string | null) =>
  Boolean(message && /(gform_sync_status|source)/i.test(message));

const hasMissingRelation = (message?: string | null) =>
  Boolean(message && /(does not exist|relation .* does not exist|42P01)/i.test(message));

const toDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value?: string | null) => {
  const parsed = toDate(value);
  if (!parsed) return "N/A";
  return parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  const parsed = toDate(value);
  if (!parsed) return "N/A";
  return parsed.toLocaleString();
};

const formatPercent = (value: number) => `${Math.max(0, Math.round(value))}%`;

const formatStatusLabel = (value?: string | null) => {
  const normalized = (value ?? "").trim();
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const clampPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const asCsvCell = (value: string | number | null | undefined) => {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
};

const downloadCsv = (filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>) => {
  const csv = [header, ...rows].map((line) => line.map(asCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const OutcomesAnalytics = ({ onNavigate }: OutcomesAnalyticsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);
  const [isDeletingOutcome, setIsDeletingOutcome] = useState(false);
  const [supportsOutcomeTable, setSupportsOutcomeTable] = useState(true);
  const [tableWarning, setTableWarning] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramLite[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [barangays, setBarangays] = useState<BarangayLite[]>([]);
  const [registrations, setRegistrations] = useState<UnifiedRegistrationRow[]>([]);
  const [outcomeDocs, setOutcomeDocs] = useState<OutcomeDoc[]>([]);
  const [outcomes, setOutcomes] = useState<ProgramOutcomeRow[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("365");
  const [yearFilter, setYearFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState<"all" | (typeof QUARTER_OPTIONS)[number]>("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [recordTypeFilter, setRecordTypeFilter] = useState<"all" | "program" | "event">("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [programStatusFilter, setProgramStatusFilter] = useState("all");
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("month");

  const [isOutcomeDialogOpen, setIsOutcomeDialogOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<ProgramOutcomeRow | null>(null);
  const [deletingOutcome, setDeletingOutcome] = useState<ProgramOutcomeRow | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeForm>(defaultOutcomeForm);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setPrograms([]);
      setEvents([]);
      setBarangays([]);
      setRegistrations([]);
      setOutcomeDocs([]);
      setOutcomes([]);
      setSupportsOutcomeTable(false);
      setTableWarning("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.");
      setIsLoading(false);
      return;
    }

    let programRegsResp = await supabase
      .from("program_registrations")
      .select(
        "id,program_id,user_id,full_name,email,municipality,barangay_id,registration_status,registered_at,source,gform_sync_status,cancelled_at",
      )
      .is("cancelled_at", null)
      .order("registered_at", { ascending: false });

    if (programRegsResp.error && hasMissingSyncColumns(programRegsResp.error.message)) {
      const fallback = await supabase
        .from("program_registrations")
        .select("id,program_id,user_id,full_name,email,municipality,barangay_id,registration_status,registered_at,cancelled_at")
        .is("cancelled_at", null)
        .order("registered_at", { ascending: false });
      programRegsResp = {
        data: (fallback.data ?? []).map((row) => ({
          ...row,
          source: "portal_direct",
          gform_sync_status: "skipped",
        })),
        error: fallback.error,
      };
    }

    let eventRegsResp = await supabase
      .from("event_registrations")
      .select("id,event_id,user_id,full_name,email,municipality,barangay_id,registration_status,registered_at,source,gform_sync_status,cancelled_at")
      .is("cancelled_at", null)
      .order("registered_at", { ascending: false });

    if (eventRegsResp.error && hasMissingSyncColumns(eventRegsResp.error.message)) {
      const fallback = await supabase
        .from("event_registrations")
        .select("id,event_id,user_id,full_name,email,municipality,barangay_id,registration_status,registered_at,cancelled_at")
        .is("cancelled_at", null)
        .order("registered_at", { ascending: false });
      eventRegsResp = {
        data: (fallback.data ?? []).map((row) => ({
          ...row,
          source: "portal_direct",
          gform_sync_status: "skipped",
        })),
        error: fallback.error,
      };
    }

    const [programsResp, eventsResp, barangaysResp, docsResp, outcomesResp] = await Promise.all([
      supabase
        .from("programs")
        .select("id,title,sector,status,barangay_id,start_date,end_date,created_at,published_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("id,title,sector,status,barangay_id,event_date,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("barangays").select("id,name,youth_population").order("name", { ascending: true }),
      supabase
        .from("disclosure_documents")
        .select("id,title,document_type,fiscal_year,quarter,published_date")
        .eq("document_type", "program_outcome")
        .order("published_date", { ascending: false }),
      supabase.from("program_outcomes").select("*").order("recorded_on", { ascending: false }),
    ]);

    const warnings: string[] = [];
    if (programsResp.error) warnings.push(`Programs: ${programsResp.error.message}`);
    if (eventsResp.error) warnings.push(`Events: ${eventsResp.error.message}`);
    if (barangaysResp.error) warnings.push(`Barangays: ${barangaysResp.error.message}`);
    if (docsResp.error) warnings.push(`Outcome documents: ${docsResp.error.message}`);
    if (programRegsResp.error) warnings.push(`Program registrations: ${programRegsResp.error.message}`);
    if (eventRegsResp.error) warnings.push(`Event registrations: ${eventRegsResp.error.message}`);

    if (outcomesResp.error) {
      if (hasMissingRelation(outcomesResp.error.message)) {
        setSupportsOutcomeTable(false);
        setTableWarning("Outcome records table is not available yet. Run supabase/sql/32_program_outcomes_analytics.sql.");
      } else {
        warnings.push(`Program outcomes: ${outcomesResp.error.message}`);
      }
      setOutcomes([]);
    } else {
      setSupportsOutcomeTable(true);
      setTableWarning(null);
      setOutcomes((outcomesResp.data ?? []) as ProgramOutcomeRow[]);
    }

    const programRows = (programsResp.data ?? []) as ProgramLite[];
    const eventRows = (eventsResp.data ?? []) as EventLite[];
    const barangayRows = (barangaysResp.data ?? []) as BarangayLite[];

    const programsById = new Map(programRows.map((row) => [row.id, row]));
    const eventsById = new Map(eventRows.map((row) => [row.id, row]));

    const mappedProgramRegs: UnifiedRegistrationRow[] = ((programRegsResp.data ?? []) as RegistrationRaw[]).map((row) => {
      const record = row.program_id ? programsById.get(row.program_id) : null;
      return {
        id: `program-${row.id}`,
        recordType: "program",
        recordId: row.program_id ?? "",
        recordTitle: record?.title ?? "Unknown Program",
        sector: (record?.sector ?? "Uncategorized").trim() || "Uncategorized",
        recordStatus: record?.status ?? "unknown",
        barangayId: row.barangay_id ?? record?.barangay_id ?? null,
        municipality: row.municipality ?? "",
        email: (row.email ?? "").toLowerCase().trim(),
        userId: row.user_id ?? null,
        registrationStatus: (row.registration_status ?? "registered").toLowerCase(),
        registeredAt: row.registered_at,
        source: row.source ?? "portal_direct",
        syncStatus: ((row.gform_sync_status ?? "skipped").toLowerCase() as UnifiedRegistrationRow["syncStatus"]),
      };
    });

    const mappedEventRegs: UnifiedRegistrationRow[] = ((eventRegsResp.data ?? []) as RegistrationRaw[]).map((row) => {
      const record = row.event_id ? eventsById.get(row.event_id) : null;
      return {
        id: `event-${row.id}`,
        recordType: "event",
        recordId: row.event_id ?? "",
        recordTitle: record?.title ?? "Unknown Event",
        sector: (record?.sector ?? "Uncategorized").trim() || "Uncategorized",
        recordStatus: record?.status ?? "unknown",
        barangayId: row.barangay_id ?? record?.barangay_id ?? null,
        municipality: row.municipality ?? "",
        email: (row.email ?? "").toLowerCase().trim(),
        userId: row.user_id ?? null,
        registrationStatus: (row.registration_status ?? "registered").toLowerCase(),
        registeredAt: row.registered_at,
        source: row.source ?? "portal_direct",
        syncStatus: ((row.gform_sync_status ?? "skipped").toLowerCase() as UnifiedRegistrationRow["syncStatus"]),
      };
    });

    setPrograms(programRows);
    setEvents(eventRows);
    setBarangays(barangayRows);
    setOutcomeDocs((docsResp.data ?? []) as OutcomeDoc[]);
    setRegistrations([...mappedProgramRegs, ...mappedEventRegs]);
    setIsLoading(false);

    if (warnings.length > 0) {
      toast({
        title: "Partial Data Loaded",
        description: `${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ""}`,
      });
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const row of registrations) {
      const parsed = toDate(row.registeredAt);
      if (parsed) years.add(parsed.getFullYear());
    }
    for (const row of programs) {
      const parsed = toDate(row.start_date || row.published_at || row.created_at);
      if (parsed) years.add(parsed.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [programs, registrations]);

  const sectorOptions = useMemo(
    () => ["all", ...Array.from(new Set([...programs, ...events].map((row) => (row.sector ?? "Uncategorized").trim() || "Uncategorized"))).sort((a, b) => a.localeCompare(b))],
    [events, programs],
  );

  const programStatusOptions = useMemo(
    () => ["all", ...Array.from(new Set(programs.map((row) => row.status ?? "unknown"))).sort((a, b) => a.localeCompare(b))],
    [programs],
  );

  const rangeStartDate = useMemo(() => {
    if (rangeFilter === "all") return null;
    const days = Number(rangeFilter);
    if (!Number.isInteger(days)) return null;
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [rangeFilter]);

  const barangayNameById = useMemo(() => new Map(barangays.map((row) => [row.id, row.name])), [barangays]);

  const matchesCommonDateFilters = (dateValue?: string | null) => {
    const parsed = toDate(dateValue);
    if (!parsed) return false;
    if (rangeStartDate && parsed < rangeStartDate) return false;
    if (yearFilter !== "all" && String(parsed.getFullYear()) !== yearFilter) return false;
    if (quarterFilter !== "all") {
      const quarter = `Q${Math.floor(parsed.getMonth() / 3) + 1}`;
      if (quarter !== quarterFilter) return false;
    }
    if (monthFilter !== "all" && String(parsed.getMonth() + 1) !== monthFilter) return false;
    return true;
  };

  const filteredPrograms = useMemo(
    () =>
      programs.filter((program) => {
        const sourceDate = program.end_date || program.start_date || program.published_at || program.created_at;
        if (!matchesCommonDateFilters(sourceDate)) return false;
        if (programStatusFilter !== "all" && (program.status ?? "unknown") !== programStatusFilter) return false;
        if (sectorFilter !== "all" && (program.sector ?? "Uncategorized") !== sectorFilter) return false;
        if (barangayFilter !== "all" && (program.barangay_id ?? "") !== barangayFilter) return false;
        return true;
      }),
    [programs, programStatusFilter, sectorFilter, barangayFilter, rangeStartDate, yearFilter, quarterFilter, monthFilter],
  );

  const filteredRegistrations = useMemo(
    () =>
      registrations.filter((row) => {
        if (!matchesCommonDateFilters(row.registeredAt)) return false;
        if (recordTypeFilter !== "all" && row.recordType !== recordTypeFilter) return false;
        if (attendanceFilter !== "all" && row.registrationStatus !== attendanceFilter) return false;
        if (sectorFilter !== "all" && row.sector !== sectorFilter) return false;
        if (barangayFilter !== "all" && (row.barangayId ?? "") !== barangayFilter) return false;
        if (programStatusFilter !== "all" && row.recordType === "program" && row.recordStatus !== programStatusFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          const barangayName = row.barangayId ? barangayNameById.get(row.barangayId) ?? "" : "";
          const sourceText = [row.recordTitle, row.sector, row.email, row.municipality, barangayName].join(" ").toLowerCase();
          if (!sourceText.includes(q)) return false;
        }
        return true;
      }),
    [
      registrations,
      rangeStartDate,
      yearFilter,
      quarterFilter,
      monthFilter,
      recordTypeFilter,
      attendanceFilter,
      sectorFilter,
      barangayFilter,
      programStatusFilter,
      searchTerm,
      barangayNameById,
    ],
  );

  const filteredOutcomeDocs = useMemo(
    () =>
      outcomeDocs.filter((row) => {
        if (yearFilter !== "all" && String(row.fiscal_year) !== yearFilter) return false;
        if (quarterFilter !== "all" && row.quarter !== quarterFilter) return false;
        if (!matchesCommonDateFilters(row.published_date)) return false;
        return true;
      }),
    [outcomeDocs, rangeStartDate, yearFilter, quarterFilter, monthFilter],
  );

  const activeRegistrationRows = useMemo(
    () => filteredRegistrations.filter((row) => row.registrationStatus !== "cancelled"),
    [filteredRegistrations],
  );

  const attendedRows = useMemo(
    () => filteredRegistrations.filter((row) => row.registrationStatus === "attended"),
    [filteredRegistrations],
  );

  const attendedOrNoShowRows = useMemo(
    () =>
      filteredRegistrations.filter(
        (row) =>
          row.registrationStatus === "attended" ||
          row.registrationStatus === "registered" ||
          row.registrationStatus === "waitlisted" ||
          row.registrationStatus === "no_show",
      ),
    [filteredRegistrations],
  );

  const noShowOrCancelledCount = useMemo(
    () => filteredRegistrations.filter((row) => row.registrationStatus === "no_show" || row.registrationStatus === "cancelled").length,
    [filteredRegistrations],
  );

  const uniqueYouthReached = useMemo(() => {
    const emails = new Set(
      activeRegistrationRows
        .map((row) => row.email)
        .filter((value) => value.length > 0),
    );
    return emails.size;
  }, [activeRegistrationRows]);

  const activeBarangaysReached = useMemo(() => {
    const ids = new Set(activeRegistrationRows.map((row) => row.barangayId).filter(Boolean));
    return ids.size;
  }, [activeRegistrationRows]);

  const attendanceRate = useMemo(() => {
    if (attendedOrNoShowRows.length === 0) return 0;
    return (attendedRows.length / attendedOrNoShowRows.length) * 100;
  }, [attendedRows.length, attendedOrNoShowRows.length]);

  const participationByEmail = useMemo(() => {
    const countByEmail = new Map<string, number>();
    for (const row of activeRegistrationRows) {
      if (!row.email) continue;
      countByEmail.set(row.email, (countByEmail.get(row.email) ?? 0) + 1);
    }
    let firstTime = 0;
    let repeat = 0;
    for (const count of countByEmail.values()) {
      if (count > 1) {
        repeat += 1;
      } else {
        firstTime += 1;
      }
    }
    return { firstTime, repeat };
  }, [activeRegistrationRows]);

  const trendData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        label: string;
        sortKey: number;
        registered: number;
        attended: number;
        noShow: number;
        cancelled: number;
      }
    >();

    for (const row of filteredRegistrations) {
      const parsed = toDate(row.registeredAt);
      if (!parsed) continue;
      let key = "";
      let label = "";
      let sortKey = 0;

      if (trendGranularity === "year") {
        key = String(parsed.getFullYear());
        label = key;
        sortKey = parsed.getFullYear();
      } else if (trendGranularity === "quarter") {
        const quarter = Math.floor(parsed.getMonth() / 3) + 1;
        key = `${parsed.getFullYear()}-Q${quarter}`;
        label = `Q${quarter} ${parsed.getFullYear()}`;
        sortKey = parsed.getFullYear() * 10 + quarter;
      } else {
        key = `${parsed.getFullYear()}-${parsed.getMonth() + 1}`;
        label = `${MONTH_LABELS[parsed.getMonth()]} ${parsed.getFullYear()}`;
        sortKey = parsed.getFullYear() * 100 + (parsed.getMonth() + 1);
      }

      const current = grouped.get(key) ?? {
        label,
        sortKey,
        registered: 0,
        attended: 0,
        noShow: 0,
        cancelled: 0,
      };

      if (row.registrationStatus === "attended") current.attended += 1;
      if (row.registrationStatus === "no_show") current.noShow += 1;
      if (row.registrationStatus === "cancelled") current.cancelled += 1;
      if (row.registrationStatus !== "cancelled") current.registered += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredRegistrations, trendGranularity]);

  const growthVsPrevious = useMemo(() => {
    if (trendData.length < 2) return null;
    const previous = trendData[trendData.length - 2].registered;
    const current = trendData[trendData.length - 1].registered;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [trendData]);

  const programOutcomesByProgram = useMemo(() => {
    const grouped = new Map<string, ProgramOutcomeRow[]>();
    for (const row of outcomes) {
      const list = grouped.get(row.program_id) ?? [];
      list.push(row);
      grouped.set(row.program_id, list);
    }
    return grouped;
  }, [outcomes]);

  const topOutcomeByProgram = useMemo(() => {
    const latest = new Map<string, ProgramOutcomeRow>();
    for (const row of outcomes) {
      const current = latest.get(row.program_id);
      const currentDate = toDate(current?.recorded_on || current?.updated_at);
      const candidateDate = toDate(row.recorded_on || row.updated_at);
      if (!current || (candidateDate && currentDate && candidateDate > currentDate)) {
        latest.set(row.program_id, row);
      } else if (!currentDate && candidateDate) {
        latest.set(row.program_id, row);
      }
    }
    return latest;
  }, [outcomes]);

  const sectorPerformance = useMemo(() => {
    const rowsBySector = new Map<
      string,
      { sector: string; registrations: number; attended: number; noShow: number; programs: number; attendanceRate: number }
    >();
    const programsBySector = new Map<string, number>();
    for (const program of filteredPrograms) {
      const sector = (program.sector ?? "Uncategorized").trim() || "Uncategorized";
      programsBySector.set(sector, (programsBySector.get(sector) ?? 0) + 1);
    }
    for (const reg of filteredRegistrations) {
      const sector = reg.sector;
      const current = rowsBySector.get(sector) ?? {
        sector,
        registrations: 0,
        attended: 0,
        noShow: 0,
        programs: programsBySector.get(sector) ?? 0,
        attendanceRate: 0,
      };
      if (reg.registrationStatus !== "cancelled") current.registrations += 1;
      if (reg.registrationStatus === "attended") current.attended += 1;
      if (reg.registrationStatus === "no_show") current.noShow += 1;
      rowsBySector.set(sector, current);
    }
    return Array.from(rowsBySector.values())
      .map((row) => ({
        ...row,
        programs: programsBySector.get(row.sector) ?? row.programs,
        attendanceRate: row.registrations > 0 ? (row.attended / row.registrations) * 100 : 0,
      }))
      .sort((a, b) => b.registrations - a.registrations);
  }, [filteredPrograms, filteredRegistrations]);

  const barangayReachRows = useMemo(() => {
    const map = new Map<
      string,
      {
        barangayId: string;
        barangayName: string;
        youthPopulation: number;
        registrations: number;
        attended: number;
        uniqueParticipants: Set<string>;
        programsConducted: number;
      }
    >();

    for (const barangay of barangays) {
      map.set(barangay.id, {
        barangayId: barangay.id,
        barangayName: barangay.name,
        youthPopulation: Number(barangay.youth_population ?? 0),
        registrations: 0,
        attended: 0,
        uniqueParticipants: new Set<string>(),
        programsConducted: 0,
      });
    }

    for (const program of filteredPrograms) {
      if (!program.barangay_id) continue;
      const row = map.get(program.barangay_id);
      if (!row) continue;
      row.programsConducted += 1;
    }

    for (const reg of activeRegistrationRows) {
      if (!reg.barangayId) continue;
      const row = map.get(reg.barangayId);
      if (!row) continue;
      row.registrations += 1;
      if (reg.registrationStatus === "attended") row.attended += 1;
      if (reg.email) row.uniqueParticipants.add(reg.email);
    }

    return Array.from(map.values())
      .map((row) => {
        const uniqueCount = row.uniqueParticipants.size;
        const reachPercent = row.youthPopulation > 0 ? (uniqueCount / row.youthPopulation) * 100 : 0;
        const attendanceRate = row.registrations > 0 ? (row.attended / row.registrations) * 100 : 0;
        return {
          barangayId: row.barangayId,
          barangayName: row.barangayName,
          youthPopulation: row.youthPopulation,
          registrations: row.registrations,
          uniqueParticipants: uniqueCount,
          programsConducted: row.programsConducted,
          reachPercent,
          attendanceRate,
        };
      })
      .sort((a, b) => b.uniqueParticipants - a.uniqueParticipants);
  }, [activeRegistrationRows, barangays, filteredPrograms]);

  const underservedBarangays = useMemo(
    () => barangayReachRows.filter((row) => row.youthPopulation > 0 && row.reachPercent < 5),
    [barangayReachRows],
  );

  const attendanceStatusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filteredRegistrations) {
      counts.set(row.registrationStatus, (counts.get(row.registrationStatus) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count], index) => ({
        status: formatStatusLabel(status),
        count,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRegistrations]);

  const syncBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filteredRegistrations) {
      counts.set(row.syncStatus, (counts.get(row.syncStatus) ?? 0) + 1);
    }
    return SYNC_STATUS_ORDER.map((status) => ({
      status: formatStatusLabel(status),
      value: counts.get(status) ?? 0,
    }));
  }, [filteredRegistrations]);

  const sourceBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filteredRegistrations) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([source, count], index) => ({
        source: formatStatusLabel(source),
        count,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRegistrations]);

  const programPerformanceRows = useMemo(() => {
    const regsByProgram = new Map<string, UnifiedRegistrationRow[]>();
    for (const row of filteredRegistrations) {
      if (row.recordType !== "program") continue;
      const list = regsByProgram.get(row.recordId) ?? [];
      list.push(row);
      regsByProgram.set(row.recordId, list);
    }

    return filteredPrograms.map((program) => {
      const rows = regsByProgram.get(program.id) ?? [];
      const registered = rows.filter((row) => row.registrationStatus !== "cancelled").length;
      const attended = rows.filter((row) => row.registrationStatus === "attended").length;
      const noShow = rows.filter((row) => row.registrationStatus === "no_show").length;
      const cancelled = rows.filter((row) => row.registrationStatus === "cancelled").length;
      const rate = registered > 0 ? (attended / registered) * 100 : 0;
      const outcomeRecord = topOutcomeByProgram.get(program.id);
      const hasOutcomeDoc = Boolean(outcomeRecord?.report_document_id);
      return {
        id: program.id,
        title: program.title,
        sector: (program.sector ?? "Uncategorized").trim() || "Uncategorized",
        status: program.status ?? "unknown",
        registrations: registered,
        attended,
        noShow,
        cancelled,
        attendanceRate: rate,
        hasOutcomeRecord: Boolean(outcomeRecord),
        hasOutcomeDoc,
      };
    });
  }, [filteredPrograms, filteredRegistrations, topOutcomeByProgram]);

  const topPerformingPrograms = useMemo(
    () =>
      programPerformanceRows
        .filter((row) => row.registrations > 0)
        .sort((a, b) => b.attendanceRate - a.attendanceRate || b.attended - a.attended)
        .slice(0, 5),
    [programPerformanceRows],
  );

  const lowPerformingPrograms = useMemo(
    () =>
      programPerformanceRows
        .filter((row) => row.registrations >= 5)
        .sort((a, b) => a.attendanceRate - b.attendanceRate || b.noShow - a.noShow)
        .slice(0, 5),
    [programPerformanceRows],
  );

  const alerts = useMemo(() => {
    const items: Array<{ level: "critical" | "warning" | "info"; title: string; description: string }> = [];
    const today = new Date();

    const completedWithoutOutcome = filteredPrograms.filter((program) => {
      const endDate = toDate(program.end_date);
      const ended = endDate ? endDate < today : program.status === "past" || program.status === "archived";
      return ended && !programOutcomesByProgram.has(program.id);
    }).length;
    if (completedWithoutOutcome > 0) {
      items.push({
        level: "critical",
        title: "Programs Missing Outcome Records",
        description: `${completedWithoutOutcome} completed program(s) do not have outcome records yet.`,
      });
    }

    const lowAttendance = programPerformanceRows.filter((row) => row.registrations >= 5 && row.attendanceRate < 60).length;
    if (lowAttendance > 0) {
      items.push({
        level: "warning",
        title: "Low Attendance Programs",
        description: `${lowAttendance} program(s) are below 60% attendance.`,
      });
    }

    const failedSyncRows = filteredRegistrations.filter((row) => row.syncStatus === "failed").length;
    if (failedSyncRows > 0) {
      items.push({
        level: "warning",
        title: "Failed Attendance Sync",
        description: `${failedSyncRows} registration row(s) failed sync and may need retry.`,
      });
    }

    const endedNoRegistrations = filteredPrograms.filter((program) => {
      const ended = program.status === "past" || program.status === "archived";
      if (!ended) return false;
      const stats = programPerformanceRows.find((row) => row.id === program.id);
      return (stats?.registrations ?? 0) === 0;
    }).length;
    if (endedNoRegistrations > 0) {
      items.push({
        level: "info",
        title: "Programs with No Attendance Data",
        description: `${endedNoRegistrations} ended program(s) have zero recorded registrations.`,
      });
    }

    if (underservedBarangays.length > 0) {
      items.push({
        level: "info",
        title: "Low Barangay Reach",
        description: `${underservedBarangays.length} barangay(s) are below 5% youth reach.`,
      });
    }

    return items.slice(0, 6);
  }, [filteredPrograms, filteredRegistrations, programOutcomesByProgram, programPerformanceRows, underservedBarangays.length]);

  const filteredOutcomeRecords = useMemo(() => {
    return outcomes.filter((row) => {
      const program = programs.find((item) => item.id === row.program_id);
      if (!program) return false;
      if (sectorFilter !== "all" && (program.sector ?? "Uncategorized") !== sectorFilter) return false;
      if (barangayFilter !== "all" && (program.barangay_id ?? "") !== barangayFilter) return false;
      if (programStatusFilter !== "all" && (program.status ?? "unknown") !== programStatusFilter) return false;
      if (yearFilter !== "all") {
        const sourceDate = toDate(row.recorded_on || row.updated_at);
        if (!sourceDate || String(sourceDate.getFullYear()) !== yearFilter) return false;
      }
      return true;
    });
  }, [outcomes, programs, sectorFilter, barangayFilter, programStatusFilter, yearFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setRangeFilter("365");
    setYearFilter("all");
    setQuarterFilter("all");
    setMonthFilter("all");
    setSectorFilter("all");
    setBarangayFilter("all");
    setRecordTypeFilter("all");
    setAttendanceFilter("all");
    setProgramStatusFilter("all");
    setTrendGranularity("month");
  };

  const openCreateOutcomeDialog = () => {
    setEditingOutcome(null);
    setOutcomeForm(defaultOutcomeForm);
    setIsOutcomeDialogOpen(true);
  };

  const openEditOutcomeDialog = (outcome: ProgramOutcomeRow) => {
    setEditingOutcome(outcome);
    setOutcomeForm({
      programId: outcome.program_id,
      reportDocumentId: outcome.report_document_id ?? "",
      recordedOn: outcome.recorded_on ?? new Date().toISOString().slice(0, 10),
      targetParticipants: String(outcome.target_participants ?? 0),
      actualParticipants: String(outcome.actual_participants ?? 0),
      completionPercent: String(outcome.completion_percent ?? 0),
      objectivesAchieved: outcome.objectives_achieved ?? "",
      outcomeSummary: outcome.outcome_summary ?? "",
      challenges: outcome.challenges ?? "",
      recommendations: outcome.recommendations ?? "",
    });
    setIsOutcomeDialogOpen(true);
  };

  const saveOutcomeRecord = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (!supportsOutcomeTable) {
      toast({ title: "Outcome Table Missing", description: "Run supabase/sql/32_program_outcomes_analytics.sql first." });
      return;
    }

    if (!outcomeForm.programId) {
      toast({ title: "Missing Program", description: "Select a program." });
      return;
    }

    const targetParticipants = Number(outcomeForm.targetParticipants);
    const actualParticipants = Number(outcomeForm.actualParticipants);
    let completionPercent = Number(outcomeForm.completionPercent);

    if (!Number.isFinite(targetParticipants) || targetParticipants < 0) {
      toast({ title: "Invalid Target", description: "Target participants must be a non-negative number." });
      return;
    }
    if (!Number.isFinite(actualParticipants) || actualParticipants < 0) {
      toast({ title: "Invalid Actual", description: "Actual participants must be a non-negative number." });
      return;
    }
    if (!Number.isFinite(completionPercent)) {
      completionPercent = targetParticipants > 0 ? (actualParticipants / targetParticipants) * 100 : 0;
    }
    completionPercent = clampPercent(completionPercent);

    const payload = {
      program_id: outcomeForm.programId,
      report_document_id: outcomeForm.reportDocumentId || null,
      recorded_on: outcomeForm.recordedOn || null,
      target_participants: Math.round(targetParticipants),
      actual_participants: Math.round(actualParticipants),
      completion_percent: Math.round(completionPercent),
      objectives_achieved: outcomeForm.objectivesAchieved.trim() || null,
      outcome_summary: outcomeForm.outcomeSummary.trim() || null,
      challenges: outcomeForm.challenges.trim() || null,
      recommendations: outcomeForm.recommendations.trim() || null,
    };

    setIsSavingOutcome(true);
    const response = editingOutcome
      ? await supabase.from("program_outcomes").update(payload).eq("id", editingOutcome.id)
      : await supabase.from("program_outcomes").insert(payload);
    setIsSavingOutcome(false);

    if (response.error) {
      toast({ title: "Save Failed", description: response.error.message });
      return;
    }

    toast({
      title: editingOutcome ? "Outcome Updated" : "Outcome Recorded",
      description: "Program outcome record saved successfully.",
    });
    setIsOutcomeDialogOpen(false);
    setEditingOutcome(null);
    setOutcomeForm(defaultOutcomeForm);
    void loadData();
  };

  const deleteOutcomeRecord = async () => {
    if (!supabase || !deletingOutcome) return;
    setIsDeletingOutcome(true);
    const response = await supabase.from("program_outcomes").delete().eq("id", deletingOutcome.id);
    setIsDeletingOutcome(false);
    if (response.error) {
      toast({ title: "Delete Failed", description: response.error.message });
      return;
    }
    toast({ title: "Outcome Deleted", description: "Program outcome record removed." });
    setDeletingOutcome(null);
    void loadData();
  };

  const exportParticipationCsv = () => {
    if (filteredRegistrations.length === 0) {
      toast({ title: "No Data", description: "No filtered participation rows to export." });
      return;
    }
    downloadCsv(
      "outcomes-participation.csv",
      [
        "Type",
        "Record",
        "Sector",
        "Registration Status",
        "Sync Status",
        "Source",
        "Email",
        "Municipality",
        "Barangay",
        "Registered At",
      ],
      filteredRegistrations.map((row) => [
        row.recordType,
        row.recordTitle,
        row.sector,
        row.registrationStatus,
        row.syncStatus,
        row.source,
        row.email,
        row.municipality,
        row.barangayId ? barangayNameById.get(row.barangayId) ?? "" : "",
        formatDateTime(row.registeredAt),
      ]),
    );
  };

  const exportOutcomesCsv = () => {
    if (filteredOutcomeRecords.length === 0) {
      toast({ title: "No Data", description: "No outcome rows to export." });
      return;
    }
    const programById = new Map(programs.map((program) => [program.id, program]));
    const docById = new Map(outcomeDocs.map((doc) => [doc.id, doc]));
    downloadCsv(
      "program-outcomes.csv",
      [
        "Program",
        "Sector",
        "Status",
        "Recorded On",
        "Target",
        "Actual",
        "Completion Percent",
        "Report Document",
        "Updated At",
      ],
      filteredOutcomeRecords.map((row) => {
        const program = programById.get(row.program_id);
        const reportDoc = row.report_document_id ? docById.get(row.report_document_id) : null;
        return [
          program?.title ?? "Unknown Program",
          program?.sector ?? "Uncategorized",
          program?.status ?? "unknown",
          row.recorded_on ?? "",
          row.target_participants,
          row.actual_participants,
          row.completion_percent,
          reportDoc?.title ?? "",
          formatDateTime(row.updated_at),
        ];
      }),
    );
  };

  const exportSummaryCsv = () => {
    downloadCsv(
      "outcomes-summary.csv",
      ["Metric", "Value"],
      [
        ["Programs Conducted", filteredPrograms.length],
        ["Total Registered Participants", activeRegistrationRows.length],
        ["Total Attended Participants", attendedRows.length],
        ["Attendance Rate (%)", Math.round(attendanceRate)],
        ["No Show + Cancelled", noShowOrCancelledCount],
        ["Unique Youth Reached", uniqueYouthReached],
        ["Active Barangays Reached", activeBarangaysReached],
        ["Outcome Reports Uploaded", filteredOutcomeDocs.length],
        ["Repeat Participants", participationByEmail.repeat],
        ["First-time Participants", participationByEmail.firstTime],
      ],
    );
  };

  const kpiCards = [
    { label: "Programs Conducted", value: filteredPrograms.length.toLocaleString(), icon: Target },
    { label: "Registered Participants", value: activeRegistrationRows.length.toLocaleString(), icon: Users2 },
    { label: "Attended Participants", value: attendedRows.length.toLocaleString(), icon: TrendingUp },
    { label: "Attendance Rate", value: formatPercent(attendanceRate), icon: LineChart },
    { label: "No-show / Cancelled", value: noShowOrCancelledCount.toLocaleString(), icon: AlertTriangle },
    { label: "Unique Youth Reached", value: uniqueYouthReached.toLocaleString(), icon: Users2 },
    { label: "Active Barangays Reached", value: activeBarangaysReached.toLocaleString(), icon: MapPinned },
    { label: "Outcome Reports Uploaded", value: filteredOutcomeDocs.length.toLocaleString(), icon: FileBarChart2 },
  ];

  const topProgramsColumns = [
    {
      header: "Program",
      accessor: (row: (typeof topPerformingPrograms)[number]) => (
        <div>
          <p className="font-semibold">{row.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.sector} | {formatStatusLabel(row.status)}
          </p>
        </div>
      ),
    },
    { header: "Registered", accessor: (row: (typeof topPerformingPrograms)[number]) => row.registrations.toLocaleString() },
    { header: "Attended", accessor: (row: (typeof topPerformingPrograms)[number]) => row.attended.toLocaleString() },
    { header: "Attendance", accessor: (row: (typeof topPerformingPrograms)[number]) => formatPercent(row.attendanceRate) },
    {
      header: "Outcome Record",
      accessor: (row: (typeof topPerformingPrograms)[number]) =>
        row.hasOutcomeRecord ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Available</span>
        ) : (
          <span className="rounded-full bg-warning/20 px-2.5 py-1 text-xs font-semibold text-warning">Missing</span>
        ),
    },
  ];

  const lowProgramsColumns = [
    {
      header: "Program",
      accessor: (row: (typeof lowPerformingPrograms)[number]) => (
        <div>
          <p className="font-semibold">{row.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.sector} | {formatStatusLabel(row.status)}
          </p>
        </div>
      ),
    },
    { header: "Registered", accessor: (row: (typeof lowPerformingPrograms)[number]) => row.registrations.toLocaleString() },
    { header: "No-show", accessor: (row: (typeof lowPerformingPrograms)[number]) => row.noShow.toLocaleString() },
    { header: "Cancelled", accessor: (row: (typeof lowPerformingPrograms)[number]) => row.cancelled.toLocaleString() },
    { header: "Attendance", accessor: (row: (typeof lowPerformingPrograms)[number]) => formatPercent(row.attendanceRate) },
  ];

  const outcomeColumns = [
    {
      header: "Program",
      accessor: (row: ProgramOutcomeRow) => {
        const program = programs.find((item) => item.id === row.program_id);
        return (
          <div>
            <p className="font-semibold">{program?.title ?? "Unknown Program"}</p>
            <p className="text-xs text-muted-foreground">
              {(program?.sector ?? "Uncategorized") || "Uncategorized"} | {formatStatusLabel(program?.status ?? "unknown")}
            </p>
          </div>
        );
      },
    },
    { header: "Recorded", accessor: (row: ProgramOutcomeRow) => formatDate(row.recorded_on) },
    { header: "Target", accessor: (row: ProgramOutcomeRow) => row.target_participants.toLocaleString() },
    { header: "Actual", accessor: (row: ProgramOutcomeRow) => row.actual_participants.toLocaleString() },
    { header: "Completion", accessor: (row: ProgramOutcomeRow) => formatPercent(row.completion_percent) },
    {
      header: "Report Document",
      accessor: (row: ProgramOutcomeRow) => {
        if (!row.report_document_id) return <span className="text-muted-foreground">None</span>;
        const doc = outcomeDocs.find((item) => item.id === row.report_document_id);
        return <span>{doc?.title ?? "Linked Document"}</span>;
      },
    },
    { header: "Updated", accessor: (row: ProgramOutcomeRow) => formatDateTime(row.updated_at) },
  ];

  const outcomeCompletionPreview = useMemo(() => {
    const target = Number(outcomeForm.targetParticipants);
    const actual = Number(outcomeForm.actualParticipants);
    if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(actual)) return 0;
    return clampPercent((actual / target) * 100);
  }, [outcomeForm.targetParticipants, outcomeForm.actualParticipants]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trends and Analytics</h1>
          <p className="mt-1 font-medium text-muted-foreground">
            Trends and analytics for events and programs, including participation, reach, attendance diagnostics, and outcome records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void loadData()} className="gap-2">
            <RefreshCw size={16} />
            Refresh Data
          </Button>
          <Button type="button" variant="outline" onClick={exportSummaryCsv} className="gap-2">
            <Download size={16} />
            Export Summary
          </Button>
          <Button type="button" variant="outline" onClick={exportParticipationCsv} className="gap-2">
            <Download size={16} />
            Export Participation CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer size={16} />
            Print / PDF
          </Button>
        </div>
      </header>

      {tableWarning ? (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          {tableWarning}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search records, sector, email, municipality..."
              className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={() => setShowFilters((prev) => !prev)}>
              <Filter size={16} />
              Filter
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <Label>Date Range</Label>
              <select
                value={rangeFilter}
                onChange={(event) => setRangeFilter(event.target.value as RangeFilter)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 180 Days</option>
                <option value="365">Last 365 Days</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All Years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Quarter</Label>
              <select
                value={quarterFilter}
                onChange={(event) => setQuarterFilter(event.target.value as typeof quarterFilter)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Quarters</option>
                {QUARTER_OPTIONS.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    {quarter}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All Months</option>
                {MONTH_LABELS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Sector</Label>
              <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {sectorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All Sectors" : option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Barangay</Label>
              <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All Barangays</option>
                {barangays.map((barangay) => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Record Type</Label>
              <select
                value={recordTypeFilter}
                onChange={(event) => setRecordTypeFilter(event.target.value as typeof recordTypeFilter)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Programs + Events</option>
                <option value="program">Programs Only</option>
                <option value="event">Events Only</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Attendance Status</Label>
              <select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All Statuses</option>
                <option value="registered">Registered</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="attended">Attended</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Program Status</Label>
              <select value={programStatusFilter} onChange={(event) => setProgramStatusFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {programStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All Program Statuses" : formatStatusLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Trend Granularity</Label>
              <select
                value={trendGranularity}
                onChange={(event) => setTrendGranularity(event.target.value as TrendGranularity)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4 card-shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon size={20} />
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Participation Trends</h2>
              <p className="text-sm text-muted-foreground">Registration versus attendance over time.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {growthVsPrevious == null ? "No baseline yet" : `${growthVsPrevious >= 0 ? "+" : ""}${Math.round(growthVsPrevious)}% vs previous`}
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="registered" name="Registered" fill="#1A3F7A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="attended" name="Attended" fill="#2E8B57" radius={[6, 6, 0, 0]} />
                <Bar dataKey="noShow" name="No Show" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground">First-time Participants</p>
              <p className="text-lg font-semibold text-foreground">{participationByEmail.firstTime.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground">Repeat Participants</p>
              <p className="text-lg font-semibold text-foreground">{participationByEmail.repeat.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">Attendance Status Breakdown</h2>
            <p className="text-sm text-muted-foreground">Quick distribution of registration outcomes.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceStatusBreakdown} dataKey="count" nameKey="status" outerRadius={95} label>
                  {attendanceStatusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {attendanceStatusBreakdown.slice(0, 4).map((row) => (
              <div key={row.status} className="rounded-md border border-border/80 bg-muted/20 px-2.5 py-2">
                <p className="text-muted-foreground">{row.status}</p>
                <p className="font-semibold text-foreground">{row.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">Sector Performance</h2>
            <p className="text-sm text-muted-foreground">Participation and attendance by sector.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorPerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="registrations" name="Registrations" fill="#1A3F7A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="attended" name="Attended" fill="#2E8B57" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">Barangay Reach</h2>
            <p className="text-sm text-muted-foreground">Coverage based on unique participants and youth population.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayReachRows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="barangayName" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="uniqueParticipants" name="Unique Participants" fill="#0EA5A6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="programsConducted" name="Programs Conducted" fill="#1A3F7A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Top Performing Programs</h2>
              <p className="text-sm text-muted-foreground">Highest attendance rates with recorded participation.</p>
            </div>
          </div>
          <DataTable columns={topProgramsColumns} data={topPerformingPrograms} isLoading={isLoading} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-lg font-bold text-foreground">Operational Alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Actionable items based on current filtered data.</p>
          <div className="mt-4 space-y-2.5">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">No active alerts for current filters.</div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={`${alert.title}-${index}`}
                  className={`rounded-xl border px-3 py-3 text-sm ${
                    alert.level === "critical"
                      ? "border-destructive/30 bg-destructive/10"
                      : alert.level === "warning"
                        ? "border-warning/30 bg-warning/10"
                        : "border-border bg-muted/20"
                  }`}
                >
                  <p className="font-semibold text-foreground">{alert.title}</p>
                  <p className="mt-1 text-muted-foreground">{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Low Performing Programs</h2>
            <p className="text-sm text-muted-foreground">Programs with lower attendance and high no-show signals.</p>
          </div>
        </div>
        <DataTable columns={lowProgramsColumns} data={lowPerformingPrograms} isLoading={isLoading} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Attendance Sync Diagnostics</h2>
              <p className="text-sm text-muted-foreground">Pending, failed, and synced rows for attendance integration.</p>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={exportParticipationCsv}>
              <Download size={16} />
              Export
            </Button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syncBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Rows" fill="#1A3F7A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">Registration Source Mix</h2>
            <p className="text-sm text-muted-foreground">Portal direct vs external/imported sources.</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceBreakdown} dataKey="count" nameKey="source" outerRadius={80} label>
                  {sourceBreakdown.map((entry) => (
                    <Cell key={entry.source} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Program Outcome Records</h2>
            <p className="text-sm text-muted-foreground">
              Target vs actual participants, completion, summary, and linked outcome documents.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={exportOutcomesCsv}>
              <Download size={16} />
              Export Outcomes CSV
            </Button>
            {supportsOutcomeTable && (
              <Button type="button" className="gap-2" onClick={openCreateOutcomeDialog}>
                <Plus size={16} />
                Add Outcome Record
              </Button>
            )}
            {!supportsOutcomeTable && (
              <Button type="button" variant="outline" onClick={() => onNavigate?.("documents")}>
                Open Transparency Docs
              </Button>
            )}
          </div>
        </div>
        {supportsOutcomeTable ? (
          <DataTable
            columns={outcomeColumns}
            data={filteredOutcomeRecords}
            isLoading={isLoading}
            onEdit={openEditOutcomeDialog}
            onDelete={(row) => setDeletingOutcome(row)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Outcome record CRUD is unavailable until the outcome table migration is applied.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground">Barangay Reach Table</h2>
          <p className="text-sm text-muted-foreground">Detailed reach percentage and attendance by barangay.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 font-semibold">Barangay</th>
                <th className="px-4 py-3 font-semibold">Youth Population</th>
                <th className="px-4 py-3 font-semibold">Programs Conducted</th>
                <th className="px-4 py-3 font-semibold">Registrations</th>
                <th className="px-4 py-3 font-semibold">Unique Participants</th>
                <th className="px-4 py-3 font-semibold">Reach %</th>
                <th className="px-4 py-3 font-semibold">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {barangayReachRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                    No barangay rows found for the selected filters.
                  </td>
                </tr>
              ) : (
                barangayReachRows.map((row) => (
                  <tr key={row.barangayId}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.barangayName}</td>
                    <td className="px-4 py-3">{row.youthPopulation.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.programsConducted.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.registrations.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.uniqueParticipants.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-24 rounded-full bg-muted">
                          <div
                            className={`h-2.5 rounded-full ${
                              row.reachPercent < 5
                                ? "bg-destructive"
                                : row.reachPercent < 12
                                  ? "bg-warning"
                                  : "bg-primary"
                            }`}
                            style={{ width: `${clampPercent(row.reachPercent)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{row.reachPercent.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatPercent(row.attendanceRate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={isOutcomeDialogOpen} onOpenChange={setIsOutcomeDialogOpen}>
        <DialogContent className="w-[min(980px,calc(100vw-1.5rem))] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOutcome ? "Edit Program Outcome" : "Add Program Outcome"}</DialogTitle>
            <DialogDescription>Save measurable outcomes for completed or active programs.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveOutcomeRecord} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Program</Label>
                <select
                  value={outcomeForm.programId}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, programId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title} ({formatStatusLabel(program.status ?? "unknown")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Recorded On</Label>
                <Input
                  type="date"
                  value={outcomeForm.recordedOn}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, recordedOn: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Document</Label>
                <select
                  value={outcomeForm.reportDocumentId}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, reportDocumentId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {outcomeDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.fiscal_year} {doc.quarter})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Participants</Label>
                <Input
                  type="number"
                  min={0}
                  value={outcomeForm.targetParticipants}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, targetParticipants: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Participants</Label>
                <Input
                  type="number"
                  min={0}
                  value={outcomeForm.actualParticipants}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, actualParticipants: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Completion Percent</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={outcomeForm.completionPercent}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, completionPercent: event.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Auto-estimate from target/actual: {formatPercent(outcomeCompletionPreview)}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Objectives Achieved</Label>
                <textarea
                  rows={3}
                  value={outcomeForm.objectivesAchieved}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, objectivesAchieved: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Outcome Summary</Label>
                <textarea
                  rows={3}
                  value={outcomeForm.outcomeSummary}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, outcomeSummary: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Challenges Encountered</Label>
                <textarea
                  rows={3}
                  value={outcomeForm.challenges}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, challenges: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Recommendations</Label>
                <textarea
                  rows={3}
                  value={outcomeForm.recommendations}
                  onChange={(event) => setOutcomeForm((prev) => ({ ...prev, recommendations: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOutcomeDialogOpen(false)} disabled={isSavingOutcome}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingOutcome}>
                {isSavingOutcome ? "Saving..." : editingOutcome ? "Save Changes" : "Create Outcome"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingOutcome)} onOpenChange={(open) => !open && setDeletingOutcome(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outcome Record</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingOutcome ? "This will permanently remove the selected outcome record." : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOutcome}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOutcomeRecord}
              disabled={isDeletingOutcome}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingOutcome ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
