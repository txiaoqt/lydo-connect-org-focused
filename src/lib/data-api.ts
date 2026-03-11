import { supabase } from "@/lib/supabase";
import type { YouthEvent, YouthOrganization, YouthProgram } from "@/lib/youthCatalog";
import type { DisclosureDocument } from "@/lib/transparencyPortalData";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatDateRange = (startDate?: string | null, endDate?: string | null, scheduleText?: string | null) => {
  if (scheduleText) return scheduleText;
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return startDate;
  if (endDate) return endDate;
  return "TBA";
};

const formatTimeValue = (value?: string | null) => {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const hhmm = raw.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return raw;
  const [hourText, minuteText] = hhmm.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return raw;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const formatTimeRange = (
  startTime?: string | null,
  endTime?: string | null,
) => {
  const start = formatTimeValue(startTime);
  const end = formatTimeValue(endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

export type FinancialDashboardRow = {
  name: string;
  skBudget: number;
  utilizedBudget: number;
  remaining: number;
  percent: number;
  youthPopulation: number;
  skChairperson: string;
  activities: number;
  participants: number;
  organizations: number;
  complianceStatus: "compliant" | "pending" | "overdue";
  latitude?: number | null;
  longitude?: number | null;
};

export type FinancialDashboardData = {
  rows: FinancialDashboardRow[];
  monthlyTrend: Array<{ month: string; allocated: number; utilized: number }>;
};

export type ComplianceBoardRow = {
  barangay: string;
  cbydp: "ok" | "partial" | "issue";
  abyip: "ok" | "partial" | "issue";
  annualBudget: "ok" | "partial" | "issue";
  rcb: "ok" | "partial" | "issue";
  mil: "ok" | "partial" | "issue";
  remarks: string;
};

export type MonthlyComplianceRow = {
  month: string;
  monthIndex: number;
  barangay: string;
  dueDate: string;
  submissions: {
    mfr: "submitted" | "late" | "missing";
    mil: "submitted" | "late" | "missing";
    rcb: "submitted" | "late" | "missing";
    accomplishment: "submitted" | "late" | "missing";
    census: "submitted" | "late" | "missing";
  };
  reportPdf: string;
};

export type TicketTypeOption = string;

type FinancialRow = {
  barangay_id: string;
  fiscal_year: number;
  month_no: number;
  allocated_amount: number | null;
  utilized_amount: number | null;
  sk_budget: number | null;
};

type BarangayMetricRow = {
  barangay_id: string;
  fiscal_year: number;
  activities: number | null;
  participants: number | null;
  organizations: number | null;
  compliance_status: "compliant" | "pending" | "overdue" | string | null;
};

export async function fetchPrograms(): Promise<YouthProgram[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .in("status", ["published"])
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    sector: row.sector,
    description: row.description ?? "",
    date: formatDateRange(row.start_date, row.end_date, row.schedule_text),
    time: formatTimeRange(row.start_time, row.end_time),
    location: row.location ?? "",
    locationLatitude: row.location_latitude != null ? Number(row.location_latitude) : undefined,
    locationLongitude: row.location_longitude != null ? Number(row.location_longitude) : undefined,
    type: "program" as const,
    sourcePostUrl: row.source_post_url ?? undefined,
  }));
}

export async function fetchEvents(): Promise<YouthEvent[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["upcoming", "past"])
    .order("event_date", { ascending: false, nullsFirst: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    sector: row.sector,
    description: row.description ?? "",
    date: row.event_date ?? "",
    time: formatTimeRange(row.start_time, row.end_time),
    location: row.location ?? "",
    locationLatitude: row.location_latitude != null ? Number(row.location_latitude) : undefined,
    locationLongitude: row.location_longitude != null ? Number(row.location_longitude) : undefined,
    status: row.status === "past" ? "past" : "upcoming",
    sourcePostUrl: row.source_post_url ?? undefined,
    registrationFormUrl: row.registration_form_url ?? undefined,
    registrationSheetUrl: row.registration_sheet_url ?? undefined,
    externalAttendanceEnabled: row.external_attendance_enabled ?? false,
    capacity: row.capacity ?? undefined,
  }));
}

type EventRecordRow = {
  id: string;
  title: string;
  sector: string;
  description?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  status?: string | null;
  source_post_url?: string | null;
  registration_form_url?: string | null;
  registration_sheet_url?: string | null;
  external_attendance_enabled?: boolean | null;
  capacity?: number | null;
};

type ProgramRecordRow = {
  id: string;
  title: string;
  sector: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  schedule_text?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  source_post_url?: string | null;
  registration_form_url?: string | null;
  registration_sheet_url?: string | null;
  external_attendance_enabled?: boolean | null;
};

const mapEventRecord = (row: EventRecordRow): YouthEvent => ({
  id: row.id,
  title: row.title,
  sector: row.sector,
  description: row.description ?? "",
  date: row.event_date ?? "",
  time: formatTimeRange(row.start_time, row.end_time),
  location: row.location ?? "",
  locationLatitude: row.location_latitude != null ? Number(row.location_latitude) : undefined,
  locationLongitude: row.location_longitude != null ? Number(row.location_longitude) : undefined,
  status: row.status === "past" ? "past" : "upcoming",
  sourcePostUrl: row.source_post_url ?? undefined,
  registrationFormUrl: row.registration_form_url ?? undefined,
  registrationSheetUrl: row.registration_sheet_url ?? undefined,
  externalAttendanceEnabled: row.external_attendance_enabled ?? false,
  capacity: row.capacity ?? undefined,
  recordKind: "event",
});

const mapProgramRecord = (row: ProgramRecordRow): YouthEvent => ({
  id: row.id,
  title: row.title,
  sector: row.sector,
  description: row.description ?? "",
  date: formatDateRange(row.start_date, row.end_date, row.schedule_text),
  time: formatTimeRange(row.start_time, row.end_time),
  location: row.location ?? "",
  locationLatitude: row.location_latitude != null ? Number(row.location_latitude) : undefined,
  locationLongitude: row.location_longitude != null ? Number(row.location_longitude) : undefined,
  status: "upcoming",
  sourcePostUrl: row.source_post_url ?? undefined,
  registrationFormUrl: row.registration_form_url ?? undefined,
  registrationSheetUrl: row.registration_sheet_url ?? undefined,
  externalAttendanceEnabled: row.external_attendance_enabled ?? false,
  recordKind: "program",
});

const findEventByIdOrSlug = async (eventIdOrSlug: string): Promise<EventRecordRow | null> => {
  const byId = await supabase
    ?.from("events")
    .select("*")
    .eq("id", eventIdOrSlug)
    .maybeSingle();

  if (byId?.data) return byId.data as EventRecordRow;

  const bySlug = await supabase
    ?.from("events")
    .select("*")
    .eq("slug", eventIdOrSlug)
    .maybeSingle();

  return (bySlug?.data as EventRecordRow | null) ?? null;
};

const findProgramByIdOrSlug = async (programIdOrSlug: string): Promise<ProgramRecordRow | null> => {
  const byId = await supabase
    ?.from("programs")
    .select("*")
    .eq("id", programIdOrSlug)
    .maybeSingle();

  if (byId?.data) return byId.data as ProgramRecordRow;

  const bySlug = await supabase
    ?.from("programs")
    .select("*")
    .eq("slug", programIdOrSlug)
    .maybeSingle();

  return (bySlug?.data as ProgramRecordRow | null) ?? null;
};

export async function fetchEventById(
  eventIdOrSlug: string,
  preferredKind: "event" | "program" = "event",
): Promise<YouthEvent | null> {
  if (!supabase) return null;

  if (preferredKind === "program") {
    const programRow = await findProgramByIdOrSlug(eventIdOrSlug);
    return programRow ? mapProgramRecord(programRow) : null;
  }

  const eventRow = await findEventByIdOrSlug(eventIdOrSlug);
  if (eventRow) return mapEventRecord(eventRow);
  const programRow = await findProgramByIdOrSlug(eventIdOrSlug);
  return programRow ? mapProgramRecord(programRow) : null;
}

export async function fetchOrganizations(): Promise<YouthOrganization[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,type,focus,source_tag,status,source_post_url")
    .in("status", ["active", "partner"])
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    focus: row.focus,
    sourceTag: row.source_tag ?? "",
    status: row.status === "partner" ? "partner" : "active",
    sourcePostUrl: row.source_post_url ?? undefined,
  }));
}

export async function fetchDisclosureRegistry(): Promise<DisclosureDocument[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("disclosure_documents")
    .select(
      "id,title,document_type,document_type_other,fiscal_year,quarter,published_date,file_size_bytes,public_url,storage_path,applies_to_all_barangays,barangays(name),offices(name)",
    )
    .order("published_date", { ascending: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row) => {
    const office = Array.isArray(row.offices) ? row.offices[0] : row.offices;
    const barangay = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
    const mappedType =
      row.document_type === "other"
        ? String(row.document_type_other || "Other")
        : toTitleCase(String(row.document_type ?? "other"))
            .replace("Bac", "BAC")
            .replace("Executive Order", "Executive Order")
            .replace("Program Outcome", "Program Outcome")
            .replace("Financial Statement", "Financial Statement");

    return {
      id: row.id,
      title: row.title,
      documentType: mappedType as DisclosureDocument["documentType"],
      fiscalYear: row.fiscal_year,
      quarter: row.quarter,
      barangay: row.applies_to_all_barangays ? "All Barangays" : barangay?.name ?? "N/A",
      office: office?.name ?? "N/A",
      publishedDate: row.published_date,
      size: formatFileSize(row.file_size_bytes),
      pdfUrl: row.public_url ?? row.storage_path ?? "",
    };
  });
}

export async function fetchTransparencyKpis() {
  if (!supabase) {
    return {
      disclosuresPublished: 0,
      reportsReceived: 0,
      reportsResolved: 0,
      avgResponseHours: 0,
      pendingTickets: 0,
    };
  }

  const { data, error } = await supabase
    .from("transparency_kpis")
    .select("disclosures_published,reports_received,reports_resolved,avg_response_hours,pending_tickets")
    .maybeSingle();

  if (error || !data) {
    return {
      disclosuresPublished: 0,
      reportsReceived: 0,
      reportsResolved: 0,
      avgResponseHours: 0,
      pendingTickets: 0,
    };
  }

  return {
    disclosuresPublished: data.disclosures_published ?? 0,
    reportsReceived: data.reports_received ?? 0,
    reportsResolved: data.reports_resolved ?? 0,
    avgResponseHours: data.avg_response_hours ?? 0,
    pendingTickets: data.pending_tickets ?? 0,
  };
}

export async function fetchServiceAdvisories() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("service_advisories")
    .select("id,title,status,message,updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    status: toTitleCase(row.status),
    updatedAt: row.updated_at?.replace("T", " ").slice(0, 16) ?? "",
    message: row.message,
  }));
}

export async function fetchTicketTypeOptions(): Promise<TicketTypeOption[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.from("ticket_types").select("name").order("id", { ascending: true });
  if (error || !data || data.length === 0) return [];

  return data.map((row) => row.name);
}

export async function submitCitizenTicket(params: {
  type: string;
  subject: string;
  message: string;
  email: string;
  userId?: string | null;
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: typeRow } = await supabase
    .from("ticket_types")
    .select("id")
    .eq("name", params.type)
    .maybeSingle();
  if (!typeRow) throw new Error("Ticket type is not configured in the database.");

  const { data, error } = await supabase
    .from("citizen_tickets")
    .insert({
      reference_no: "",
      type_id: typeRow.id,
      subject: params.subject,
      message: params.message,
      requester_email: params.email,
      created_by_user_id: params.userId ?? null,
    })
    .select("id,reference_no,status,created_at,updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit ticket.");
  }

  return data;
}

export async function trackCitizenTicket(referenceNo: string, requesterEmail: string) {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("track_citizen_ticket", {
    _reference_no: referenceNo,
    _requester_email: requesterEmail,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as {
    reference_no: string;
    ticket_type: string;
    subject: string;
    status: "received" | "in_progress" | "resolved" | "closed";
    created_at: string;
    updated_at: string;
  };
}

export async function fetchMyCitizenTickets(userId: string) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("citizen_tickets")
    .select("id,reference_no,subject,status,created_at,updated_at,ticket_types(name)")
    .eq("created_by_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map((row) => {
    const type = Array.isArray(row.ticket_types) ? row.ticket_types[0] : row.ticket_types;
    return {
      id: row.id,
      referenceNo: row.reference_no,
      subject: row.subject,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      type: type?.name ?? "",
    };
  });
}

export async function fetchFinancialDashboardData(): Promise<FinancialDashboardData> {
  if (!supabase) return { rows: [], monthlyTrend: [] };

  const [{ data: bData, error: bError }, { data: fData, error: fError }, { data: mData, error: mError }] = await Promise.all([
    supabase
      .from("barangays")
      .select("id,name,latitude,longitude,sk_chairperson,youth_population")
      .order("name", { ascending: true }),
    supabase
      .from("barangay_financials")
      .select("barangay_id,fiscal_year,month_no,allocated_amount,utilized_amount,sk_budget")
      .order("fiscal_year", { ascending: false })
      .order("month_no", { ascending: false }),
    supabase
      .from("barangay_youth_metrics")
      .select("barangay_id,fiscal_year,activities,participants,organizations,compliance_status")
      .order("fiscal_year", { ascending: false }),
  ]);

  if (bError || fError || mError || !bData || !fData || bData.length === 0 || fData.length === 0) {
    return { rows: [], monthlyTrend: [] };
  }

  const financialRows = fData as FinancialRow[];
  const metricRows = (mData ?? []) as BarangayMetricRow[];

  const latestByBarangay = new Map<string, FinancialRow>();
  const latestMetricsByBarangay = new Map<string, BarangayMetricRow>();
  const byYear = new Map<number, FinancialRow[]>();

  financialRows.forEach((row) => {
    if (!latestByBarangay.has(row.barangay_id)) latestByBarangay.set(row.barangay_id, row);
    const group = byYear.get(row.fiscal_year) ?? [];
    group.push(row);
    byYear.set(row.fiscal_year, group);
  });
  metricRows.forEach((row) => {
    if (!latestMetricsByBarangay.has(row.barangay_id)) latestMetricsByBarangay.set(row.barangay_id, row);
  });

  const latestYear = Math.max(...Array.from(byYear.keys()));
  const selectedYearRows = byYear.get(latestYear) ?? [];

  const monthlyMap = new Map<number, { allocated: number; utilized: number }>();
  selectedYearRows.forEach((row) => {
    const existing = monthlyMap.get(row.month_no) ?? { allocated: 0, utilized: 0 };
    monthlyMap.set(row.month_no, {
      allocated: existing.allocated + Number(row.allocated_amount ?? 0),
      utilized: existing.utilized + Number(row.utilized_amount ?? 0),
    });
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthNo, values]) => ({
      month: monthNames[Math.max(0, Math.min(11, monthNo - 1))],
      allocated: values.allocated,
      utilized: values.utilized,
    }));

  const rows: FinancialDashboardRow[] = bData
    .map((barangayRow) => {
    const latestFinancial = latestByBarangay.get(barangayRow.id);
    if (!latestFinancial) return null;
    const metric = latestMetricsByBarangay.get(barangayRow.id);

    const compliance =
      metric?.compliance_status === "compliant" || metric?.compliance_status === "pending" || metric?.compliance_status === "overdue"
        ? metric.compliance_status
        : "pending";

    const skBudget = Number(latestFinancial.sk_budget ?? 0);
    const utilizedBudget = Number(latestFinancial.utilized_amount ?? 0);
    const remaining = Math.max(skBudget - utilizedBudget, 0);
    const percent = skBudget > 0 ? Math.round((utilizedBudget / skBudget) * 100) : 0;

    return {
      name: barangayRow.name,
      skBudget,
      utilizedBudget,
      remaining,
      percent,
      youthPopulation: Number(barangayRow.youth_population ?? 0),
      skChairperson: barangayRow.sk_chairperson ?? "",
      activities: Number(metric?.activities ?? 0),
      participants: Number(metric?.participants ?? 0),
      organizations: Number(metric?.organizations ?? 0),
      complianceStatus: compliance,
      latitude: barangayRow.latitude,
      longitude: barangayRow.longitude,
    };
    })
    .filter((row): row is FinancialDashboardRow => Boolean(row));

  return { rows, monthlyTrend };
}

export async function fetchComplianceBoardData(): Promise<{
  fiscalYearLabel: string;
  rows: ComplianceBoardRow[];
}> {
  if (!supabase) return { fiscalYearLabel: "No published quarter", rows: [] };

  const { data: latest } = await supabase
    .from("compliance_board_status")
    .select("fiscal_year,quarter")
    .order("fiscal_year", { ascending: false })
    .order("quarter", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return { fiscalYearLabel: "No published quarter", rows: [] };

  const { data } = await supabase
    .from("compliance_board_status")
    .select("barangays(name),cbydp,abyip,annual_budget,rcb,mil,remarks")
    .eq("fiscal_year", latest.fiscal_year)
    .eq("quarter", latest.quarter);

  const rows: ComplianceBoardRow[] =
    data?.map((row) => {
      const barangay = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
      return {
        barangay: barangay?.name ?? "N/A",
        cbydp: row.cbydp,
        abyip: row.abyip,
        annualBudget: row.annual_budget,
        rcb: row.rcb,
        mil: row.mil,
        remarks: row.remarks ?? "",
      };
    }) ?? [];

  return {
    fiscalYearLabel: `${latest.quarter} ${latest.fiscal_year}`,
    rows,
  };
}

export async function fetchMonthlyComplianceData(): Promise<MonthlyComplianceRow[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from("monthly_compliance")
    .select(
      "month_no,due_date,mfr_status,mil_status,rcb_status,accomplishment_status,census_status,barangays(name),disclosure_documents(public_url,storage_path)",
    )
    .order("month_no", { ascending: true });

  if (!data || data.length === 0) return [];

  return data.map((row) => {
    const barangay = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
    const report = Array.isArray(row.disclosure_documents) ? row.disclosure_documents[0] : row.disclosure_documents;

    return {
      month: `${monthNames[Math.max(0, Math.min(11, row.month_no - 1))]} ${new Date(row.due_date).getFullYear()}`,
      monthIndex: row.month_no - 1,
      barangay: barangay?.name ?? "N/A",
      dueDate: row.due_date,
      submissions: {
        mfr: row.mfr_status,
        mil: row.mil_status,
        rcb: row.rcb_status,
        accomplishment: row.accomplishment_status,
        census: row.census_status,
      },
      reportPdf: report?.public_url ?? report?.storage_path ?? "",
    };
  });
}
