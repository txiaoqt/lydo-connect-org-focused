import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone, Plus, Search, User, Users } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { Barangay, UserProfile } from "../types";
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

type BarangayForm = {
  name: string;
  skChairperson: string;
  youthPopulation: string;
  latitude: string;
  longitude: string;
};

type ResidentRow = UserProfile & {
  role_codes: string[];
};

const defaultForm: BarangayForm = {
  name: "",
  skChairperson: "",
  youthPopulation: "0",
  latitude: "",
  longitude: "",
};

export const Barangays = () => {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState<Barangay | null>(null);
  const [deletingBarangay, setDeletingBarangay] = useState<Barangay | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<BarangayForm>(defaultForm);
  const [isResidentsOpen, setIsResidentsOpen] = useState(false);
  const [isResidentsLoading, setIsResidentsLoading] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [residentSearchTerm, setResidentSearchTerm] = useState("");
  const { toast } = useToast();

  const loadBarangays = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setBarangays([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.from("barangays").select("*").order("name", { ascending: true });
    if (error) {
      toast({ title: "Load Failed", description: error.message });
      setBarangays([]);
      setIsLoading(false);
      return;
    }

    setBarangays((data ?? []) as Barangay[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadBarangays();
  }, []);

  const openCreateModal = () => {
    setEditingBarangay(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  };

  const openEditModal = (barangay: Barangay) => {
    setEditingBarangay(barangay);
    setForm({
      name: barangay.name ?? "",
      skChairperson: barangay.sk_chairperson ?? "",
      youthPopulation: String(barangay.youth_population ?? 0),
      latitude: barangay.latitude ? String(barangay.latitude) : "",
      longitude: barangay.longitude ? String(barangay.longitude) : "",
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (barangay: Barangay) => {
    setDeletingBarangay(barangay);
    setIsDeleteDialogOpen(true);
  };

  const loadResidents = async (barangay: Barangay) => {
    if (!isSupabaseConfigured || !supabase) {
      setResidents([]);
      return;
    }

    setIsResidentsLoading(true);
    const profilesResp = await supabase
      .from("user_profiles")
      .select("*")
      .eq("barangay_id", barangay.id)
      .order("created_at", { ascending: false });

    if (profilesResp.error) {
      toast({ title: "Load Failed", description: profilesResp.error.message });
      setResidents([]);
      setIsResidentsLoading(false);
      return;
    }

    const profiles = (profilesResp.data ?? []) as UserProfile[];
    const userIds = profiles.map((profile) => profile.user_id);
    let rolesByUser: Record<string, string[]> = {};

    if (userIds.length > 0) {
      const rolesResp = await supabase.from("user_roles").select("user_id,roles(code)").in("user_id", userIds);
      if (rolesResp.error) {
        toast({ title: "Role Load Warning", description: rolesResp.error.message });
      } else {
        rolesByUser = (rolesResp.data ?? []).reduce<Record<string, string[]>>((acc, row) => {
          const relation = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
          const code = Array.isArray(relation) ? relation[0]?.code : relation?.code;
          if (!code) return acc;
          if (!acc[row.user_id]) acc[row.user_id] = [];
          acc[row.user_id].push(code);
          return acc;
        }, {});
      }
    }

    setResidents(
      profiles.map((profile) => ({
        ...profile,
        role_codes: rolesByUser[profile.user_id] ?? [],
      })),
    );
    setIsResidentsLoading(false);
  };

  const openResidentsModal = (barangay: Barangay) => {
    setSelectedBarangay(barangay);
    setResidents([]);
    setResidentSearchTerm("");
    setIsResidentsOpen(true);
    void loadResidents(barangay);
  };

  const saveBarangay = async (event: FormEvent) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    if (!form.name.trim()) {
      toast({ title: "Missing Name", description: "Barangay name is required." });
      return;
    }

    const youthPopulation = Number(form.youthPopulation);
    if (!Number.isFinite(youthPopulation) || youthPopulation < 0) {
      toast({ title: "Invalid Population", description: "Youth population must be a non-negative number." });
      return;
    }

    const latitude = form.latitude.trim() ? Number(form.latitude) : null;
    const longitude = form.longitude.trim() ? Number(form.longitude) : null;
    if (latitude !== null && !Number.isFinite(latitude)) {
      toast({ title: "Invalid Latitude", description: "Latitude must be a valid number." });
      return;
    }
    if (longitude !== null && !Number.isFinite(longitude)) {
      toast({ title: "Invalid Longitude", description: "Longitude must be a valid number." });
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      sk_chairperson: form.skChairperson.trim() || null,
      youth_population: Math.round(youthPopulation),
      latitude,
      longitude,
    };

    let error: { message: string } | null = null;
    if (editingBarangay) {
      const result = await supabase.from("barangays").update(payload).eq("id", editingBarangay.id);
      error = result.error;
    } else {
      const result = await supabase.from("barangays").insert(payload);
      error = result.error;
    }

    setIsSaving(false);
    if (error) {
      toast({ title: "Save Failed", description: error.message });
      return;
    }

    toast({
      title: editingBarangay ? "Barangay Updated" : "Barangay Created",
      description: `${form.name.trim()} saved successfully.`,
    });
    setIsFormOpen(false);
    setEditingBarangay(null);
    setForm(defaultForm);
    void loadBarangays();
  };

  const deleteBarangay = async () => {
    if (!deletingBarangay) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    const targetBarangay = deletingBarangay;
    setIsDeleting(true);
    const { error } = await supabase.from("barangays").delete().eq("id", targetBarangay.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message });
      return;
    }

    toast({ title: "Barangay Deleted", description: `${targetBarangay.name} was removed.` });

    if (editingBarangay?.id === targetBarangay.id) {
      setEditingBarangay(null);
      setForm(defaultForm);
      setIsFormOpen(false);
    }

    setDeletingBarangay(null);
    setIsDeleteDialogOpen(false);
    void loadBarangays();
  };

  const columns = [
    {
      header: "Barangay Name",
      accessor: (b: Barangay) => (
        <button
          type="button"
          onClick={() => openResidentsModal(b)}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <MapPin size={16} />
          </div>
          <span className="font-bold text-foreground underline-offset-2 hover:underline">{b.name}</span>
        </button>
      ),
    },
    {
      header: "SK Chairperson",
      accessor: (b: Barangay) => (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <User size={14} className="text-muted-foreground" />
          {b.sk_chairperson || "Not set"}
        </div>
      ),
    },
    {
      header: "Youth Population",
      accessor: (b: Barangay) => (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <Users size={14} className="text-muted-foreground" />
          {(b.youth_population ?? 0).toLocaleString()}
        </div>
      ),
    },
  ];

  const filteredBarangays = barangays.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredResidents = useMemo(() => {
    const q = residentSearchTerm.toLowerCase().trim();
    if (!q) return residents;
    return residents.filter((resident) => {
      const fullName = resident.full_name?.toLowerCase() ?? "";
      const displayName = resident.display_name?.toLowerCase() ?? "";
      const email = resident.email?.toLowerCase() ?? "";
      const contact = resident.contact_number?.toLowerCase() ?? "";
      return fullName.includes(q) || displayName.includes(q) || email.includes(q) || contact.includes(q);
    });
  }, [residentSearchTerm, residents]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Barangay Map Data</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage coordinates, youth population, and SK leadership used by the public Barangay Map.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Add Barangay
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search barangays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredBarangays} isLoading={isLoading} onEdit={openEditModal} onDelete={openDeleteModal} />

      <Dialog
        open={isResidentsOpen}
        onOpenChange={(open) => {
          setIsResidentsOpen(open);
          if (!open) {
            setSelectedBarangay(null);
            setResidents([]);
            setResidentSearchTerm("");
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBarangay ? `${selectedBarangay.name} Residents` : "Barangay Residents"}</DialogTitle>
            <DialogDescription>
              {selectedBarangay
                ? `View resident user profiles linked to ${selectedBarangay.name}.`
                : "View resident user profiles for the selected barangay."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Total Residents: <span className="font-semibold text-foreground">{residents.length}</span>
              </div>
              <div className="w-full max-w-sm">
                <Input
                  value={residentSearchTerm}
                  onChange={(event) => setResidentSearchTerm(event.target.value)}
                  placeholder="Search resident name, email, or contact..."
                />
              </div>
            </div>

            {isResidentsLoading ? (
              <div className="h-44 grid place-items-center text-sm text-muted-foreground">Loading residents...</div>
            ) : filteredResidents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                No resident users found for this barangay.
              </div>
            ) : (
              <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
                {filteredResidents.map((resident) => (
                  <div key={resident.user_id} className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {resident.full_name || resident.display_name || "Unnamed User"}
                        </p>
                        <p className="text-xs text-muted-foreground">{resident.display_name || "No display name"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(resident.role_codes.length > 0 ? resident.role_codes : ["youth"]).map((role) => (
                          <span key={`${resident.user_id}-${role}`} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} />
                        <span className="text-foreground">{resident.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} />
                        <span className="text-foreground">{resident.contact_number || "N/A"}</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Municipality</p>
                        <p className="font-medium text-foreground">{resident.municipality || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="font-medium text-foreground">{new Date(resident.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsResidentsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBarangay ? "Edit Barangay" : "Create Barangay"}</DialogTitle>
            <DialogDescription>Changes here are saved directly to Supabase.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveBarangay} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="barangay-name">Barangay Name</Label>
                <Input
                  id="barangay-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barangay-chair">SK Chairperson</Label>
                <Input
                  id="barangay-chair"
                  value={form.skChairperson}
                  onChange={(e) => setForm((prev) => ({ ...prev, skChairperson: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barangay-population">Youth Population</Label>
                <Input
                  id="barangay-population"
                  type="number"
                  min={0}
                  value={form.youthPopulation}
                  onChange={(e) => setForm((prev) => ({ ...prev, youthPopulation: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barangay-lat">Latitude</Label>
                <Input
                  id="barangay-lat"
                  value={form.latitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="14.700000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barangay-lng">Longitude</Label>
                <Input
                  id="barangay-lng"
                  value={form.longitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="121.120000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingBarangay ? "Save Changes" : "Create Barangay"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingBarangay(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Barangay</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingBarangay
                ? `Are you sure you want to delete "${deletingBarangay.name}"? This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBarangay}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Barangay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
