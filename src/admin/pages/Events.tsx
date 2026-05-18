import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleHelp, FileText, Filter, Info, Link2, MapPin, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LegendHelpButton } from "../components/LegendHelpButton";
import { LegendModal } from "../components/LegendModal";
import { baseEventStatusLegendItems, optionalEventStatusLegendItems } from "../components/legend-config";
import { Event, EventStatus } from "../types";
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

type EventForm = {
  title: string;
  sectorOption: string;
  customSector: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  locationLatitude: string;
  locationLongitude: string;
  capacity: string;
  status: EventStatus;
  sourcePostUrl: string;
  registrationFormUrl: string;
  registrationSheetUrl: string;
  externalAttendanceEnabled: boolean;
};

const EVENT_SECTOR_OPTIONS = [
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
const CREATE_EVENT_STATUS_OPTIONS: EventStatus[] = ["draft", "upcoming", "ongoing"];
const EDIT_EVENT_STATUS_OPTIONS: EventStatus[] = ["past", "archived", "draft", "postponed", "upcoming", "ongoing", "cancelled"];
const EVENT_FILTER_STATUS_OPTIONS: EventStatus[] = ["draft", "upcoming", "ongoing", "past", "archived", "postponed", "cancelled", "published"];

const getSectorFormValue = (sector?: string | null) => {
  const normalized = (sector ?? "").trim();
  if (!normalized) return { sectorOption: "General", customSector: "" };
  if (EVENT_SECTOR_OPTIONS.includes(normalized as (typeof EVENT_SECTOR_OPTIONS)[number])) {
    return { sectorOption: normalized, customSector: "" };
  }
  return { sectorOption: OTHER_SECTOR_VALUE, customSector: normalized };
};

const defaultForm: EventForm = {
  title: "",
  sectorOption: "General",
  customSector: "",
  description: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  location: "Prototype Activity Hall",
  locationLatitude: "",
  locationLongitude: "",
  capacity: "",
  status: "upcoming",
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

export const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isLinksGuideOpen, setIsLinksGuideOpen] = useState(false);
  const [isSyncGuideOpen, setIsSyncGuideOpen] = useState(false);
  const [isStatusLegendOpen, setIsStatusLegendOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const { toast } = useToast();

  const loadEvents = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (error) {
      toast({ title: "Load Failed", description: error.message });
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setEvents((data ?? []) as Event[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  };

  const openEditModal = (event: Event) => {
    const sectorValues = getSectorFormValue(event.sector);
    setEditingEvent(event);
    setForm({
      title: event.title ?? "",
      sectorOption: sectorValues.sectorOption,
      customSector: sectorValues.customSector,
      description: event.description ?? "",
      eventDate: event.event_date ?? "",
      startTime: event.start_time ?? "",
      endTime: event.end_time ?? "",
      location: event.location ?? "",
      locationLatitude: event.location_latitude != null ? String(event.location_latitude) : "",
      locationLongitude: event.location_longitude != null ? String(event.location_longitude) : "",
      capacity: event.capacity ? String(event.capacity) : "",
      status: event.status ?? "upcoming",
      sourcePostUrl: event.source_post_url ?? "",
      registrationFormUrl: event.registration_form_url ?? "",
      registrationSheetUrl: event.registration_sheet_url ?? "",
      externalAttendanceEnabled: event.external_attendance_enabled ?? false,
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (event: Event) => {
    setDeletingEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsModal = (event: Event) => {
    setViewingEvent(event);
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

  const saveEvent = async (event: FormEvent) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    if (!form.title.trim()) {
      toast({ title: "Missing Title", description: "Event title is required." });
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

    const parsedCapacity = form.capacity.trim() ? Number(form.capacity) : null;
    if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0)) {
      toast({ title: "Invalid Capacity", description: "Capacity must be a positive number." });
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
      event_date: form.eventDate || null,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      location: form.location.trim() || "Prototype Activity Hall",
      location_latitude: parsedLatitude,
      location_longitude: parsedLongitude,
      capacity: parsedCapacity,
      status: form.status,
      source_post_url: normalizedSourcePostUrl,
      registration_form_url: registrationFormUrl || null,
      registration_sheet_url: registrationSheetUrl || null,
      external_attendance_enabled: form.externalAttendanceEnabled,
      published_at: form.status === "upcoming" || form.status === "ongoing" ? new Date().toISOString() : null,
    };

    let error: { message: string } | null = null;
    if (editingEvent) {
      const result = await supabase.from("events").update(payload).eq("id", editingEvent.id);
      error = result.error;
    } else {
      const slug = `${slugify(form.title)}-${Date.now().toString().slice(-6)}`;
      const result = await supabase.from("events").insert({ slug, ...payload });
      error = result.error;
    }

    setIsSaving(false);
    if (error) {
      toast({ title: "Save Failed", description: error.message });
      return;
    }

    toast({
      title: editingEvent ? "Event Updated" : "Event Created",
      description: `${form.title.trim()} saved successfully.`,
    });
    setIsFormOpen(false);
    setEditingEvent(null);
    setForm(defaultForm);
    void loadEvents();
  };

  const deleteEvent = async () => {
    if (!deletingEvent) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    const targetEvent = deletingEvent;
    setIsDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", targetEvent.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message });
      return;
    }

    toast({
      title: "Event Deleted",
      description: `${targetEvent.title} was removed.`,
    });

    if (editingEvent?.id === targetEvent.id) {
      setEditingEvent(null);
      setForm(defaultForm);
      setIsFormOpen(false);
    }

    setDeletingEvent(null);
    setIsDeleteDialogOpen(false);
    void loadEvents();
  };

  const columns = [
    {
      header: "Events",
      accessor: (e: Event) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{e.title}</span>
          <span className="text-xs text-muted-foreground font-medium">{e.slug}</span>
        </div>
      ),
    },
    { header: "Sector", accessor: "sector" as const },
    {
      header: "Status",
      accessor: (e: Event) => <StatusBadge status={e.status} />,
    },
    {
      header: "Dates",
      accessor: (e: Event) => (
        <div className="flex flex-col text-xs font-medium">
          <span>{e.event_date ? format(new Date(e.event_date), "MMM d, yyyy") : "N/A"}</span>
          <span className="text-muted-foreground">{formatTimeRange(e.start_time, e.end_time)}</span>
        </div>
      ),
    },
    { header: "Location", accessor: "location" as const, className: "max-w-[150px] truncate" },
  ];

  const availableSectorFilters = useMemo(
    () => ["all", ...Array.from(new Set(events.map((event) => event.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [events],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(term) ||
          event.sector.toLowerCase().includes(term) ||
          (event.location ?? "").toLowerCase().includes(term) ||
          (event.description ?? "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" ? true : event.status === statusFilter;
        const matchesSector = sectorFilter === "all" ? true : event.sector === sectorFilter;
        return matchesSearch && matchesStatus && matchesSector;
      }),
    [events, searchTerm, statusFilter, sectorFilter],
  );
  const eventLegendItems = useMemo(() => {
    const usedStatuses = new Set(events.map((event) => (event.status ?? "").toLowerCase()));
    return [
      ...baseEventStatusLegendItems,
      ...optionalEventStatusLegendItems.filter((item) => usedStatuses.has(item.key)),
    ];
  }, [events]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Events Management</h1>
            <LegendHelpButton
              onClick={() => setIsStatusLegendOpen(true)}
              ariaLabel="View event status color legend"
            />
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Coordinate and manage community events for youth across prototype coverage areas.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Create New Event
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-4 rounded-2xl border border-border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search events..."
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
              onChange={(e) => setStatusFilter(e.target.value as "all" | EventStatus)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Statuses</option>
              {EVENT_FILTER_STATUS_OPTIONS.map((status) => (
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
        data={filteredEvents}
        isLoading={isLoading}
        onRowClick={openDetailsModal}
        getRowAriaLabel={(item) => `Open details for ${item.title}`}
      />

      <LegendModal
        open={isStatusLegendOpen}
        onOpenChange={setIsStatusLegendOpen}
        title="Event Status Legend"
        description="These colors help identify event status at a glance."
        items={eventLegendItems}
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="flex w-[min(900px,calc(100vw-1.5rem))] max-h-[90vh] flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="border-b border-border/80 px-6 py-5 pr-12 text-left">
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Read-only record view.</DialogDescription>
          </DialogHeader>
          {viewingEvent && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">1. Basic Information</h3>
                <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border/70 bg-background/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-3"><p className="text-xs text-muted-foreground">Title</p><p className="text-sm font-medium">{viewingEvent.title || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Sector</p><p className="text-sm font-medium">{viewingEvent.sector || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewingEvent.status} /></div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {!EVENT_SECTOR_OPTIONS.includes((viewingEvent.sector ?? "").trim() as (typeof EVENT_SECTOR_OPTIONS)[number]) && (
                    <div><p className="text-xs text-muted-foreground">Custom Sector</p><p className="text-sm font-medium">{viewingEvent.sector || "N/A"}</p></div>
                  )}
                  <div><p className="text-xs text-muted-foreground">Capacity</p><p className="text-sm font-medium">{viewingEvent.capacity ?? "N/A"}</p></div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">2. Schedule</h3>
                <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border/70 bg-background/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-3"><p className="text-xs text-muted-foreground">Event Date</p><p className="text-sm font-medium">{viewingEvent.event_date ? format(new Date(viewingEvent.event_date), "MMM d, yyyy") : "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">Start Time</p><p className="text-sm font-medium">{formatTimeLabel(viewingEvent.start_time) || "N/A"}</p></div>
                  <div className="p-3"><p className="text-xs text-muted-foreground">End Time</p><p className="text-sm font-medium">{formatTimeLabel(viewingEvent.end_time) || "N/A"}</p></div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">3. Location</h3>
                <p className="text-sm font-medium">{viewingEvent.location || "N/A"}</p>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">4. Links and Registration</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsLinksExpanded((prev) => !prev)}>
                    {isLinksExpanded ? "Collapse" : "Expand"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><p className="text-xs text-muted-foreground">Source Post URL</p><p className="text-sm font-medium break-all">{viewingEvent.source_post_url || "N/A"}</p></div>
                  {isLinksExpanded && (
                    <>
                      <div><p className="text-xs text-muted-foreground">Registration Form URL</p><p className="text-sm font-medium break-all">{viewingEvent.registration_form_url || "N/A"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Registration Sheet URL</p><p className="text-sm font-medium break-all">{viewingEvent.registration_sheet_url || "N/A"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Automated Google Form Sync</p><StatusBadge status={viewingEvent.external_attendance_enabled ? "enabled" : "disabled"} /></div>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">5. Description</h3>
                <p className="text-sm font-medium whitespace-pre-wrap break-words">{viewingEvent.description || "N/A"}</p>
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
                  if (!viewingEvent) return;
                  setIsDetailsOpen(false);
                  openEditModal(viewingEvent);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!viewingEvent) return;
                  setIsDetailsOpen(false);
                  openDeleteModal(viewingEvent);
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
          <form onSubmit={saveEvent} className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b border-border/80 px-6 py-5 pr-12 text-left">
              <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
              <DialogDescription>
                {editingEvent
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
                    <Label htmlFor="event-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="event-title"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-sector">
                      Sector <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="event-sector"
                      value={form.sectorOption}
                      onChange={(e) => setForm((prev) => ({ ...prev, sectorOption: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {EVENT_SECTOR_OPTIONS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                      <option value={OTHER_SECTOR_VALUE}>Other</option>
                    </select>
                  </div>
                  {form.sectorOption === OTHER_SECTOR_VALUE ? (
                    <div className="space-y-2">
                      <Label htmlFor="event-custom-sector">
                        Custom Sector <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="event-custom-sector"
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
                    <Label htmlFor="event-status">
                      Status <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="event-status"
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {(editingEvent ? EDIT_EVENT_STATUS_OPTIONS : CREATE_EVENT_STATUS_OPTIONS).map((status) => (
                        <option key={status} value={status}>
                          {toStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-capacity">Capacity</Label>
                    <Input
                      id="event-capacity"
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                      placeholder="Optional"
                    />
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="event-date">Event Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-start-time">Start Time</Label>
                    <Input
                      id="event-start-time"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-end-time">End Time</Label>
                    <Input
                      id="event-end-time"
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
                  <Label htmlFor="event-location">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      id="event-location"
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
                    <Label htmlFor="event-source">Source Post URL</Label>
                    <Input
                      id="event-source"
                      value={form.sourcePostUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                      placeholder="https://www.facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-registration-form-url">Registration Form URL (Optional)</Label>
                    <Input
                      id="event-registration-form-url"
                      value={form.registrationFormUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, registrationFormUrl: e.target.value }))}
                      placeholder="https://docs.google.com/forms/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-registration-sheet-url">Registration Sheet URL (Optional)</Label>
                    <Input
                      id="event-registration-sheet-url"
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
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
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
                {editingEvent ? "All changes are saved directly to Supabase." : "New records will be saved to Supabase."}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
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
        title="Pick Event Location"
        description="Search address or drag the pin to set the exact location for this event."
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
            setDeletingEvent(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEvent
                ? `This will permanently delete "${deletingEvent.title}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteEvent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

