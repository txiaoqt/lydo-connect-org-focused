import React, { FormEvent, useEffect, useState } from "react";
import { Building2, Filter, Plus, Search, Tag } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { Organization, OrganizationStatus } from "../types";
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

type OrganizationForm = {
  name: string;
  type: string;
  focus: string;
  sourceTag: string;
  sourcePostUrl: string;
  status: OrganizationStatus;
};

const defaultForm: OrganizationForm = {
  name: "",
  type: "Government",
  focus: "General",
  sourceTag: "",
  sourcePostUrl: "",
  status: "active",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const Organizations = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<OrganizationForm>(defaultForm);
  const { toast } = useToast();

  const loadOrganizations = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setOrgs([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.from("organizations").select("*").order("name", { ascending: true });
    if (error) {
      toast({ title: "Load Failed", description: error.message });
      setOrgs([]);
      setIsLoading(false);
      return;
    }

    setOrgs((data ?? []) as Organization[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const openCreateModal = () => {
    setEditingOrg(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setForm({
      name: org.name ?? "",
      type: org.type ?? "Government",
      focus: org.focus ?? "General",
      sourceTag: org.source_tag ?? "",
      sourcePostUrl: org.source_post_url ?? "",
      status: org.status ?? "active",
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setDeletingOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const saveOrganization = async (event: FormEvent) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    if (!form.name.trim()) {
      toast({ title: "Missing Name", description: "Organization name is required." });
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type.trim() || "Government",
      focus: form.focus.trim() || "General",
      source_tag: form.sourceTag.trim() || null,
      source_post_url: form.sourcePostUrl.trim() || null,
      status: form.status,
    };

    let error: { message: string } | null = null;
    if (editingOrg) {
      const result = await supabase.from("organizations").update(payload).eq("id", editingOrg.id);
      error = result.error;
    } else {
      const slug = `${slugify(form.name)}-${Date.now().toString().slice(-6)}`;
      const result = await supabase.from("organizations").insert({ slug, ...payload });
      error = result.error;
    }

    setIsSaving(false);
    if (error) {
      toast({ title: "Save Failed", description: error.message });
      return;
    }

    toast({
      title: editingOrg ? "Organization Updated" : "Organization Created",
      description: `${form.name.trim()} saved successfully.`,
    });
    setIsFormOpen(false);
    setEditingOrg(null);
    setForm(defaultForm);
    void loadOrganizations();
  };

  const deleteOrganization = async () => {
    if (!deletingOrg) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Supabase Not Configured",
        description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
      });
      return;
    }

    const targetOrg = deletingOrg;
    setIsDeleting(true);
    const { error } = await supabase.from("organizations").delete().eq("id", targetOrg.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message });
      return;
    }

    toast({
      title: "Organization Deleted",
      description: `${targetOrg.name} was removed.`,
    });

    if (editingOrg?.id === targetOrg.id) {
      setEditingOrg(null);
      setForm(defaultForm);
      setIsFormOpen(false);
    }

    setDeletingOrg(null);
    setIsDeleteDialogOpen(false);
    void loadOrganizations();
  };

  const columns = [
    {
      header: "Organization",
      accessor: (o: Organization) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
            <Building2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{o.name}</span>
            <span className="text-xs text-muted-foreground font-medium">{o.slug}</span>
          </div>
        </div>
      ),
    },
    { header: "Type", accessor: "type" as const },
    {
      header: "Focus Area",
      accessor: (o: Organization) => (
        <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg w-fit">
          <Tag size={12} />
          {o.focus}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (o: Organization) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            o.status === "active"
              ? "bg-accent/15 text-accent"
              : o.status === "partner"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {o.status}
        </span>
      ),
    },
  ];

  const filteredOrgs = orgs.filter(
    (o) => o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage youth organizations and councils registered in the municipality.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Register New Org
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search organizations..."
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

      <DataTable columns={columns} data={filteredOrgs} isLoading={isLoading} onEdit={openEditModal} onDelete={openDeleteModal} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
            <DialogDescription>Changes here are saved directly to Supabase.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-type">Type</Label>
                <Input
                  id="org-type"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-focus">Focus</Label>
                <Input
                  id="org-focus"
                  value={form.focus}
                  onChange={(e) => setForm((prev) => ({ ...prev, focus: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-status">Status</Label>
                <select
                  id="org-status"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as OrganizationStatus }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">active</option>
                  <option value="partner">partner</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-source-tag">Source Tag</Label>
                <Input
                  id="org-source-tag"
                  value={form.sourceTag}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceTag: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-source-url">Source Post URL</Label>
                <Input
                  id="org-source-url"
                  value={form.sourcePostUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingOrg ? "Save Changes" : "Create Organization"}
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
            setDeletingOrg(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingOrg
                ? `This will permanently delete "${deletingOrg.name}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrganization}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
