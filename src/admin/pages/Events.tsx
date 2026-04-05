import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Filter, MapPin, Plus, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
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
  location: "Metro Manila",
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
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
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
      location: form.location.trim() || "Metro Manila",
      location_latitude: parsedLatitude,
      location_longitude: parsedLongitude,
      capacity: parsedCapacity,
      status: form.status,
      source_post_url: normalizedSourcePostUrl,
      registration_form_url: registrationFormUrl || null,
      registration_sheet_url: registrationSheetUrl || null,
      external_attendance_enabled: form.externalAttendanceEnabled,
      published_at: form.status === "upcoming" || form.status === "past" ? new Date().toISOString() : null,
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
      header: "Event",
      accessor: (e: Event) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{e.title}</span>
          <span className="text-xs text-muted-foreground font-medium">{e.sector}</span>
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessor: (e: Event) => (
        <div className="flex flex-col text-xs font-medium">
          <div className="flex items-center gap-1">
            <CalendarIcon size={12} className="text-muted-foreground" />
            <span>{e.event_date ? format(new Date(e.event_date), "MMM d, yyyy") : "N/A"}</span>
          </div>
          <span className="text-muted-foreground ml-4">{formatTimeRange(e.start_time, e.end_time)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (e: Event) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            e.status === "upcoming"
              ? "bg-primary/10 text-primary"
              : e.status === "draft"
                ? "bg-warning/20 text-warning"
                : e.status === "past"
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/15 text-destructive"
          }`}
        >
          {e.status}
        </span>
      ),
    },
    {
      header: "Location",
      accessor: (e: Event) => (
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="max-w-[120px] truncate">{e.location}</span>
        </div>
      ),
    },
    {
      header: "Capacity",
      accessor: (e: Event) => (
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Users size={12} className="text-muted-foreground" />
          <span>{e.capacity || "Unlimited"}</span>
        </div>
      ),
    },
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Coordinate and manage community events for youth across Metro Manila.</p>
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
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
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

      <DataTable columns={columns} data={filteredEvents} isLoading={isLoading} onEdit={openEditModal} onDelete={openDeleteModal} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>Changes here are saved directly to Supabase.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-sector">Sector</Label>
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
                  <Label htmlFor="event-custom-sector">Custom Sector</Label>
                  <Input
                    id="event-custom-sector"
                    value={form.customSector}
                    onChange={(e) => setForm((prev) => ({ ...prev, customSector: e.target.value }))}
                    placeholder="Type custom sector"
                    required
                  />
                </div>
              ) : (
                <div />
              )}
              <div className="space-y-2">
                <Label htmlFor="event-status">Status</Label>
                <select
                  id="event-status"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="upcoming">upcoming</option>
                  <option value="past">past</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Event Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                />
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-location">Location</Label>
                <div className="flex flex-col md:flex-row gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={form.locationLatitude || "Latitude not set"} readOnly className="bg-muted/40" />
                  <Input value={form.locationLongitude || "Longitude not set"} readOnly className="bg-muted/40" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the map picker for precise coordinates. Drag pin or type location and confirm.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-source">Source Post URL</Label>
                <Input
                  id="event-source"
                  value={form.sourcePostUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                  placeholder="https://www.facebook.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Use the direct public post permalink (not `/share/...`) so it can be embedded on the event details page.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-registration-form-url">Registration Form URL (Optional)</Label>
                <Input
                  id="event-registration-form-url"
                  value={form.registrationFormUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, registrationFormUrl: e.target.value }))}
                  placeholder="https://docs.google.com/forms/..."
                />
                <p className="text-xs text-muted-foreground">
                  External Google Form link only. The portal does not embed GForm preview.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-registration-sheet-url">Registration Sheet URL (Optional)</Label>
                <Input
                  id="event-registration-sheet-url"
                  value={form.registrationSheetUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, registrationSheetUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/.../pubhtml"
                />
                <p className="text-xs text-muted-foreground">
                  Use the published Google Sheet URL so admin can preview external attendance.
                </p>
              </div>
              <div className="md:col-span-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={form.externalAttendanceEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, externalAttendanceEnabled: e.target.checked }))}
                  />
                  Enable automated Google Form sync
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  When enabled, portal registrations are queued for worker sync to Google Form, which then updates Google Sheet.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </Button>
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

