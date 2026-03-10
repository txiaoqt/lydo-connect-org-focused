import React, { FormEvent, useEffect, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "../components/DataTable";
import { Program, ProgramStatus } from "../types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  status: ProgramStatus;
  sourcePostUrl: string;
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
  location: "San Mateo, Rizal",
  locationLatitude: "",
  locationLongitude: "",
  startDate: "",
  endDate: "",
  status: "draft",
  sourcePostUrl: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
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
      status: program.status ?? "draft",
      sourcePostUrl: program.source_post_url ?? "",
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (program: Program) => {
    setDeletingProgram(program);
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

    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      sector: selectedSector,
      description: form.description.trim(),
      location: form.location.trim() || "San Mateo, Rizal",
      location_latitude: parsedLatitude,
      location_longitude: parsedLongitude,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      status: form.status,
      source_post_url: form.sourcePostUrl.trim() || null,
      published_at: form.status === "published" ? new Date().toISOString() : null,
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
      accessor: (p: Program) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            p.status === "published"
              ? "bg-primary/10 text-primary"
              : p.status === "draft"
                ? "bg-warning/20 text-warning"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      header: "Dates",
      accessor: (p: Program) => (
        <div className="flex flex-col text-xs font-medium">
          <span>{p.start_date ? format(new Date(p.start_date), "MMM d, yyyy") : "N/A"}</span>
          <span className="text-muted-foreground">to {p.end_date ? format(new Date(p.end_date), "MMM d, yyyy") : "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location" as const,
      className: "max-w-[150px] truncate",
    },
  ];

  const filteredPrograms = programs.filter(
    (p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.sector.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programs Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage and monitor youth development programs in San Mateo.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Create New Program
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border card-shadow">
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
        <button className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground font-bold hover:bg-muted rounded-xl transition-all border border-border">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <DataTable columns={columns} data={filteredPrograms} isLoading={isLoading} onEdit={openEditModal} onDelete={openDeleteModal} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "Create Program"}</DialogTitle>
            <DialogDescription>Changes here are saved directly to Supabase.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveProgram} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="program-title">Title</Label>
                <Input
                  id="program-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-sector">Sector</Label>
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
                  <Label htmlFor="program-custom-sector">Custom Sector</Label>
                  <Input
                    id="program-custom-sector"
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
                <Label htmlFor="program-status">Status</Label>
                <select
                  id="program-status"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProgramStatus }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="program-location">Location</Label>
                <div className="flex flex-col md:flex-row gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={form.locationLatitude || "Latitude not set"} readOnly className="bg-muted/40" />
                  <Input value={form.locationLongitude || "Longitude not set"} readOnly className="bg-muted/40" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the map picker for precise coordinates. Drag pin or type location and confirm.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="program-source">Source Post URL</Label>
                <Input
                  id="program-source"
                  value={form.sourcePostUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="program-description">Description</Label>
                <Textarea
                  id="program-description"
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
                {isSaving ? "Saving..." : editingProgram ? "Save Changes" : "Create Program"}
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
        title="Pick Program Location"
        description="Search address or drag the pin to set the exact location for this program."
      />

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
