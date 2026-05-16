import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleHelp, FileText, Filter, Info, Link2, MapPin, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Program, ProgramStatus } from "../types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFacebookEmbedIssue, normalizeSourcePostUrl } from "@/lib/source-post";
import { isGoogleFormUrl, normalizeGoogleSheetCsvUrl } from "@/lib/external-registration";
import LocationPickerDialog, { LocationPickerResult } from "../components/LocationPickerDialog";
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

type ProgramForm = {
  title: string;
  sectorOption: string;
  customSector: string;
  description: string;
  location: string;
  locationLatitude: string;
  locationLongitude: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: ProgramStatus;
  sourcePostUrl: string;
  registrationFormUrl: string;
  registrationSheetUrl: string;
  externalAttendanceEnabled: boolean;
};

const PROGRAM_SECTOR_OPTIONS = [
  "LYDO",
  "YDAC",
  "SK",
  "Education",
  "Health",
  "Environment",
  "Governance",
  "Sports",
  "Livelihood",
  "General",
] as const;
const OTHER_SECTOR_VALUE = "other";
const CREATE_PROGRAM_STATUS_OPTIONS: ProgramStatus[] = ["draft", "upcoming", "ongoing"];
const EDIT_PROGRAM_STATUS_OPTIONS: ProgramStatus[] = ["past", "archived", "draft", "postponed", "upcoming", "ongoing", "cancelled"];
const PROGRAM_FILTER_STATUS_OPTIONS: ProgramStatus[] = ["draft", "upcoming", "ongoing", "past", "archived", "postponed", "cancelled", "published"];

const getSectorFormValue = (sector?: string | null) => {
  const normalized = (sector ?? "").trim();
  if (!normalized) return { sectorOption: "General", customSector: "" };
  if (PROGRAM_SECTOR_OPTIONS.includes(normalized as (typeof PROGRAM_SECTOR_OPTIONS)[number])) {
    return { sectorOption: normalized, customSector: "" };
  }
  return { sectorOption: OTHER_SECTOR_VALUE, customSector: normalized };
};

const defaultForm: ProgramForm = {
  title: "",
  sectorOption: "General",
  customSector: "",
  description: "",
  location: "Metro Manila",
  locationLatitude: "",
  locationLongitude: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  status: "draft",
  sourcePostUrl: "",
  registrationFormUrl: "",
  registrationSheetUrl: "",
  externalAttendanceEnabled: false,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const formatTimeLabel = (value?: string | null) => {
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

const formatTimeRange = (startTime?: string | null, endTime?: string | null) => {
  const start = formatTimeLabel(startTime);
  const end = formatTimeLabel(endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "TBD";
};

const toStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

export const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ProgramStatus>("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isLinksGuideOpen, setIsLinksGuideOpen] = useState(false);
  const [isSyncGuideOpen, setIsSyncGuideOpen] = useState(false);
  const [form, setForm] = useState<ProgramForm>(defaultForm);
  const { toast } = useToast();

  const loadPrograms = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.from("programs").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Load Failed", description: error.message });
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    setPrograms((data ?? []) as Program[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadPrograms();
  }, []);

  const openCreateModal = () => {
    setEditingProgram(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  };

  const openEditModal = (program: Program) => {
    const sectorValues = getSectorFormValue(program.sector);
    setEditingProgram(program);
    setForm({
      title: program.title ?? "",
      sectorOption: sectorValues.sectorOption,
      customSector: sectorValues.customSector,
      description: program.description ?? "",
      location: program.location ?? "",
      locationLatitude: program.location_latitude != null ? String(program.location_latitude) : "",
      locationLongitude: program.location_longitude != null ? String(program.location_longitude) : "",
      startDate: program.start_date ?? "",
      endDate: program.end_date ?? "",
      startTime: program.start_time ?? "",
      endTime: program.end_time ?? "",
      status: program.status ?? "draft",
      sourcePostUrl: program.source_post_url ?? "",
      registrationFormUrl: program.registration_form_url ?? "",
      registrationSheetUrl: program.registration_sheet_url ?? "",
      externalAttendanceEnabled: program.external_attendance_enabled ?? false,
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (program: Program) => {
    setDeletingProgram(program);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsModal = (program: Program) => {
    setViewingProgram(program);
    setIsLinksExpanded(false);
    setIsDetailsOpen(true);
  };

  const applyLocationFromMap = (value: LocationPickerResult) => {
    setForm((prev) => ({
      ...prev,
      location: value.location,
      locationLatitude: value.latitude.toFixed(6),
      locationLongitude: value.longitude.toFixed(6),
    }));
  };

  const saveProgram = async (event: FormEvent) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    if (!form.title.trim()) {
      toast({ title: "Missing Title", description: "Program title is required." });
      return;
    }

    const selectedSector =
      form.sectorOption === OTHER_SECTOR_VALUE ? form.customSector.trim() : form.sectorOption.trim();
    if (!selectedSector) {
      toast({ title: "Missing Sector", description: "Please select a sector or enter a custom sector." });
      return;
    }
    if (form.startTime && form.endTime && form.endTime < form.startTime) {
      toast({ title: "Invalid Time Range", description: "End time must be the same as or later than start time." });
      return;
    }

    const hasLat = Boolean(form.locationLatitude.trim());
    const hasLng = Boolean(form.locationLongitude.trim());
    if (!hasLat || !hasLng) {
      toast({
        title: "Location Pin Required",
        description: "Please use 'Pick on Map' and confirm the exact location pin before saving.",
      });
      return;
    }
    const parsedLatitude = Number(form.locationLatitude);
    const parsedLongitude = Number(form.locationLongitude);
    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      Math.abs(parsedLatitude) > 90 ||
      Math.abs(parsedLongitude) > 180
    ) {
      toast({
        title: "Invalid Coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180.",
      });
      return;
    }

    const rawSourcePostUrl = form.sourcePostUrl.trim();
    const normalizedSourcePostUrl = rawSourcePostUrl ? normalizeSourcePostUrl(rawSourcePostUrl) : null;
    if (rawSourcePostUrl && !normalizedSourcePostUrl) {
      toast({
        title: "Invalid Source URL",
        description: "Please provide a valid full URL starting with https://.",
      });
      return;
    }
    const embedIssue = getFacebookEmbedIssue(normalizedSourcePostUrl);
    if (embedIssue) {
      toast({
        title: "Use Direct Facebook Permalink",
        description: embedIssue.message,
      });
      return;
    }

    const registrationFormUrl = form.registrationFormUrl.trim();
    const registrationSheetUrl = form.registrationSheetUrl.trim();
    if (registrationFormUrl && !isGoogleFormUrl(registrationFormUrl)) {
      toast({
        title: "Invalid Registration Form URL",
        description: "Use a valid Google Form link from docs.google.com/forms or forms.gle.",
      });
      return;
    }
    if (registrationSheetUrl && !normalizeGoogleSheetCsvUrl(registrationSheetUrl)) {
      toast({
        title: "Invalid Registration Sheet URL",
        description: "Use a published Google Sheet link (docs.google.com/spreadsheets).",
      });
      return;
    }
    if (form.externalAttendanceEnabled && !registrationFormUrl) {
      toast({
        title: "Google Form Required",
        description: "Enable external attendance sync only when a Google Form URL is provided.",
      });
      return;
    }

    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      sector: selectedSector,
      description: form.description.trim(),
      location: form.location.trim() || "Metro Manila",
      location_latitude: parsedLatitude,
      location_longitude: parsedLongitude,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      status: form.status,
      source_post_url: normalizedSourcePostUrl,
      registration_form_url: registrationFormUrl || null,
      registration_sheet_url: registrationSheetUrl || null,
      external_attendance_enabled: form.externalAttendanceEnabled,
      published_at: form.status === "upcoming" || form.status === "ongoing" ? new Date().toISOString() : null,
    };

    let error: { message: string } | null = null;
    if (editingProgram) {
      const result = await supabase.from("programs").update(payload).eq("id", editingProgram.id);
      error = result.error;
    } else {
      const slug = `${slugify(form.title)}-${Date.now().toString().slice(-6)}`;
      const result = await supabase.from("programs").insert({ slug, ...payload });
      error = result.error;
    }

    setIsSaving(false);

    if (error) {
      toast({ title: "Save Failed", description: error.message });
      return;
    }

    toast({
      title: editingProgram ? "Program Updated" : "Program Created",
      description: `${form.title.trim()} saved successfully.`,
    });
    setIsFormOpen(false);
    setEditingProgram(null);
    setForm(defaultForm);
    void loadPrograms();
  };

  const deleteProgram = async () => {
    if (!deletingProgram) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    const targetProgram = deletingProgram;
    setIsDeleting(true);
    const { error } = await supabase.from("programs").delete().eq("id", targetProgram.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message });
      return;
    }

    toast({
      title: "Program Deleted",
      description: `${targetProgram.title} was removed.`,
    });

    if (editingProgram?.id === targetProgram.id) {
      setEditingProgram(null);
      setForm(defaultForm);
      setIsFormOpen(false);
    }

    setDeletingProgram(null);
    setIsDeleteDialogOpen(false);
    void loadPrograms();
  };

  const columns = [
    {
      header: "Title",
      accessor: (p: Program) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{p.title}</span>
          <span className="text-xs text-muted-foreground font-medium">{p.slug}</span>
        </div>
      ),
    },
    { header: "Sector", accessor: "sector" as const },
    {
      header: "Status",
      accessor: (p: Program) => <StatusBadge status={p.status} />,
    },
    {
      header: "Dates",
      accessor: (p: Program) => (
        <div className="flex flex-col text-xs font-medium">
          <span>{p.start_date ? format(new Date(p.start_date), "MMM d, yyyy") : "N/A"}</span>
          <span className="text-muted-foreground">to {p.end_date ? format(new Date(p.end_date), "MMM d, yyyy") : "N/A"}</span>
          <span className="text-muted-foreground">{formatTimeRange(p.start_time, p.end_time)}</span>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location" as const,
      className: "max-w-[150px] truncate",
    },
  ];

  const availableSectorFilters = useMemo(
    () => ["all", ...Array.from(new Set(programs.map((program) => program.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [programs],
  );

  const filteredPrograms = useMemo(
    () =>
      programs.filter((program) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          program.title.toLowerCase().includes(term) ||
          program.sector.toLowerCase().includes(term) ||
          (program.location ?? "").toLowerCase().includes(term) ||
          (program.description ?? "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" ? true : program.status === statusFilter;
        const matchesSector = sectorFilter === "all" ? true : program.sector === sectorFilter;
        return matchesSearch && matchesStatus && matchesSector;
      }),
    [programs, searchTerm, statusFilter, sectorFilter],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programs Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage and monitor youth development programs across Metro Manila.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Create New Program
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-4 rounded-2xl border border-border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-border card-shadow">
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | ProgramStatus)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Statuses</option>
              {PROGRAM_FILTER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {toStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Sector</Label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {availableSectorFilters.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === "all" ? "All Sectors" : sector}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setSectorFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredPrograms}
        isLoading={isLoading}
        onRowClick={openDetailsModal}
        getRowAriaLabel={(item) => `Open details for ${item.title}`}
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="flex w-[min(900px,calc(100vw-1.5rem))] max-h-[90vh] flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="border-b border-border/80 px-6 py-5 pr-12 text-left">
            <DialogTitle>Program Details</DialogTitle>
            <DialogDescription>Read-only record view.</DialogDescription>
          </DialogHeader>
          {viewingProgram && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">1. Basic Information</h3>
                <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border/70 bg-background/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-3"><p className="text-xs text-muted-foreground">Title</p><p className="text-sm font-medium">{viewingProgram.title || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Sector</p><p className="text-sm font-medium">{viewingProgram.sector || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewingProgram.status} /></div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">2. Schedule</h3>
                <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border/70 bg-background/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Date Range</p>
                    <p className="text-sm font-medium">
                      {viewingProgram.start_date ? format(new Date(viewingProgram.start_date), "MMM d, yyyy") : "N/A"} to{" "}
                      {viewingProgram.end_date ? format(new Date(viewingProgram.end_date), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Start Time</p><p className="text-sm font-medium">{formatTimeLabel(viewingProgram.start_time) || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">End Time</p><p className="text-sm font-medium">{formatTimeLabel(viewingProgram.end_time) || "N/A"}</p></div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">3. Location</h3>
                <p className="text-sm font-medium">{viewingProgram.location || "N/A"}</p>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">4. Links and Registration</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsLinksExpanded((prev) => !prev)}>
                    {isLinksExpanded ? "Collapse" : "Expand"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><p className="text-xs text-muted-foreground">Source Post URL</p><p className="text-sm font-medium break-all">{viewingProgram.source_post_url || "N/A"}</p></div>
                  {isLinksExpanded && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Registration Form URL</p><p className="text-sm font-medium break-all">{viewingProgram.registration_form_url || "N/A"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Registration Sheet URL</p><p className="text-sm font-medium break-all">{viewingProgram.registration_sheet_url || "N/A"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Automated Google Form Sync</p><StatusBadge status={viewingProgram.external_attendance_enabled ? "enabled" : "disabled"} /></div>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">5. Description</h3>
                <p className="text-sm font-medium whitespace-pre-wrap break-words">{viewingProgram.description || "N/A"}</p>
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-border/80 px-6 py-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">Read-only record view.</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!viewingProgram) return;
                  setIsDetailsOpen(false);
                  openEditModal(viewingProgram);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!viewingProgram) return;
                  setIsDetailsOpen(false);
                  openDeleteModal(viewingProgram);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[min(960px,calc(100vw-1.5rem))] max-h-[92vh] overflow-hidden p-0 gap-0">
          <form onSubmit={saveProgram} className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b border-border/80 px-6 py-5 pr-12 text-left">
              <DialogTitle>{editingProgram ? "Edit Program" : "Create Program"}</DialogTitle>
              <DialogDescription>
                {editingProgram
                  ? "Changes here are saved directly to Supabase."
                  : "Create a new record that will be saved to Supabase."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Info size={14} />
                  </span>
                  1. Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="program-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="program-title"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-sector">
                      Sector <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="program-sector"
                      value={form.sectorOption}
                      onChange={(e) => setForm((prev) => ({ ...prev, sectorOption: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {PROGRAM_SECTOR_OPTIONS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                      <option value={OTHER_SECTOR_VALUE}>Other</option>
                    </select>
                  </div>
                  {form.sectorOption === OTHER_SECTOR_VALUE ? (
                    <div className="space-y-2">
                      <Label htmlFor="program-custom-sector">
                        Custom Sector <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="program-custom-sector"
                        value={form.customSector}
                        onChange={(e) => setForm((prev) => ({ ...prev, customSector: e.target.value }))}
                        placeholder="Type custom sector"
                        required
                      />
                    </div>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="program-status">
                      Status <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="program-status"
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProgramStatus }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {(editingProgram ? EDIT_PROGRAM_STATUS_OPTIONS : CREATE_PROGRAM_STATUS_OPTIONS).map((status) => (
                        <option key={status} value={status}>
                          {toStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarDays size={14} />
                  </span>
                  2. Schedule
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="program-start">Start Date</Label>
                    <Input
                      id="program-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-end">End Date</Label>
                    <Input
                      id="program-end"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-start-time">Start Time</Label>
                    <Input
                      id="program-start-time"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-end-time">End Time</Label>
                    <Input
                      id="program-end-time"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <MapPin size={14} />
                  </span>
                  3. Location
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="program-location">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      id="program-location"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      required
                    />
                    <Button type="button" variant="outline" onClick={() => setIsLocationPickerOpen(true)} className="md:w-44">
                      Pick on Map
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Input value={form.locationLatitude || "Latitude not set"} readOnly className="bg-muted/40" />
                    <Input value={form.locationLongitude || "Longitude not set"} readOnly className="bg-muted/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the map picker to set accurate coordinates. Drag the pin or type a location, then confirm.
                  </p>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Link2 size={14} />
                    </span>
                    4. Links and Registration
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label="Open links and registration guide"
                    onClick={() => setIsLinksGuideOpen(true)}
                  >
                    <CircleHelp size={15} />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program-source">Source Post URL</Label>
                    <Input
                      id="program-source"
                      value={form.sourcePostUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                      placeholder="https://www.facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-registration-form-url">Registration Form URL (Optional)</Label>
                    <Input
                      id="program-registration-form-url"
                      value={form.registrationFormUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, registrationFormUrl: e.target.value }))}
                      placeholder="https://docs.google.com/forms/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-registration-sheet-url">Registration Sheet URL (Optional)</Label>
                    <Input
                      id="program-registration-sheet-url"
                      value={form.registrationSheetUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, registrationSheetUrl: e.target.value }))}
                      placeholder="https://docs.google.com/spreadsheets/.../pubhtml"
                    />
                  </div>
                  <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
                    <label className="flex items-start gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-border"
                        checked={form.externalAttendanceEnabled}
                        onChange={(e) => setForm((prev) => ({ ...prev, externalAttendanceEnabled: e.target.checked }))}
                      />
                      <span className="flex items-center gap-1.5">
                        <span>Enable automated Google Form sync</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          aria-label="Open automated Google Form sync guide"
                          onClick={() => setIsSyncGuideOpen(true)}
                        >
                          <CircleHelp size={14} />
                        </Button>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText size={14} />
                  </span>
                  5. Description
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="program-description">Description</Label>
                  <Textarea
                    id="program-description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                  />
                  <p className="text-right text-xs text-muted-foreground">{form.description.length}/1000</p>
                </div>
              </section>
            </div>

            <DialogFooter className="border-t border-border/80 px-6 py-3 sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {editingProgram ? "All changes are saved directly to Supabase." : "New records will be saved to Supabase."}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingProgram ? "Save Changes" : "Create Program"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LocationPickerDialog
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialLocation={form.location}
        initialLatitude={form.locationLatitude.trim() ? Number(form.locationLatitude) : null}
        initialLongitude={form.locationLongitude.trim() ? Number(form.locationLongitude) : null}
        onConfirm={applyLocationFromMap}
        title="Pick Program Location"
        description="Search address or drag the pin to set the exact location for this program."
      />

      <Dialog open={isLinksGuideOpen} onOpenChange={setIsLinksGuideOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Links and Registration Guide</DialogTitle>
            <DialogDescription>
              Use these fields to connect this record with its public source and external registration references.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Source Post URL:</span> Use the direct public source post link.
              Avoid shared or private links because they may not embed correctly on the public details page.
            </p>
            <p>
              <span className="font-semibold text-foreground">Registration Form URL:</span> Add the external Google Form link
              for users who need to register outside the portal.
            </p>
            <p>
              <span className="font-semibold text-foreground">Registration Sheet URL:</span> Add the published Google Sheet link
              so admins can preview or verify external attendance records.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsLinksGuideOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSyncGuideOpen} onOpenChange={setIsSyncGuideOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Automated Google Form Sync</DialogTitle>
            <DialogDescription>How this setting works for external registration tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>When enabled, portal registrations are queued for syncing.</p>
            <p>
              The worker or sync process sends registration data to the linked Google Form when integration is configured, and
              the connected Google Sheet is then updated based on the response flow.
            </p>
            <p>This helps admins keep portal registrations and external attendance records aligned.</p>
            <p>When disabled, the portal will not automatically queue registrations for Google Form sync.</p>
            <p>Admins may need to manually check or update external forms and sheets when needed.</p>
            <p>
              <span className="font-semibold text-foreground">Note:</span> Only enable this if the Registration Form URL and
              Registration Sheet URL are correct and the sync integration is configured.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSyncGuideOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingProgram(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProgram
                ? `This will permanently delete "${deletingProgram.title}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProgram}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

