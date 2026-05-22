import React, { FormEvent, useEffect, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LegendHelpButton } from "../components/LegendHelpButton";
import { LegendModal } from "../components/LegendModal";
import { organizationStatusLegendItems, organizationTypeLegendSeed } from "../components/legend-config";
import { Organization, OrganizationStatus } from "../types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  slug: string;
  name: string;
  type: string;
  category: string;
  overview: string;
  mission: string;
  objectives: string;
  focus: string;
  coverageArea: string;
  targetBeneficiaries: string;
  programsProjects: string;
  relatedEvents: string;
  contactEmail: string;
  contactPhone: string;
  sourceTag: string;
  sourceLabel: string;
  sourcePostUrl: string;
  status: OrganizationStatus;
};

const defaultForm: OrganizationForm = {
  slug: "",
  name: "",
  type: "Civic Volunteer Group",
  category: "Prototype Youth Group",
  overview: "",
  mission: "",
  objectives: "",
  focus: "General",
  coverageArea: "Prototype Municipality",
  targetBeneficiaries: "",
  programsProjects: "",
  relatedEvents: "",
  contactEmail: "",
  contactPhone: "",
  sourceTag: "",
  sourceLabel: "Prototype Data",
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
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBadgeLegendOpen, setIsBadgeLegendOpen] = useState(false);
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
      slug: org.slug ?? "",
      type: org.type ?? "Civic Volunteer Group",
      category: org.category ?? "",
      overview: org.overview ?? "",
      mission: org.mission ?? "",
      objectives: org.objectives ?? "",
      focus: org.focus ?? "General",
      coverageArea: org.coverage_area ?? "",
      targetBeneficiaries: org.target_beneficiaries ?? "",
      programsProjects: org.programs_projects ?? "",
      relatedEvents: org.related_events ?? "",
      contactEmail: org.contact_email ?? "",
      contactPhone: org.contact_phone ?? "",
      sourceTag: org.source_tag ?? "",
      sourceLabel: org.source_reference_title ?? "",
      sourcePostUrl: org.source_post_url ?? "",
      status: org.status ?? "active",
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setDeletingOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsModal = (org: Organization) => {
    setViewingOrg(org);
    setIsDetailsOpen(true);
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
    const normalizedSlug = slugify(form.slug.trim() || form.name.trim()) || `organization-${Date.now().toString().slice(-6)}`;
    const payload = {
      slug: normalizedSlug,
      name: form.name.trim(),
      type: form.type.trim() || "Civic Volunteer Group",
      category: form.category.trim() || null,
      overview: form.overview.trim() || null,
      mission: form.mission.trim() || null,
      objectives: form.objectives.trim() || null,
      focus: form.focus.trim() || "General",
      coverage_area: form.coverageArea.trim() || null,
      target_beneficiaries: form.targetBeneficiaries.trim() || null,
      programs_projects: form.programsProjects.trim() || null,
      related_events: form.relatedEvents.trim() || null,
      contact_email: form.contactEmail.trim() || null,
      contact_phone: form.contactPhone.trim() || null,
      source_tag: form.sourceTag.trim() || null,
      source_reference_title: form.sourceLabel.trim() || null,
      source_post_url: form.sourcePostUrl.trim() || null,
      source_reference_url: form.sourcePostUrl.trim() || null,
      status: form.status,
    };

    let error: { message: string } | null = null;
    if (editingOrg) {
      const result = await supabase.from("organizations").update(payload).eq("id", editingOrg.id);
      error = result.error;
    } else {
      const result = await supabase.from("organizations").insert(payload);
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

  const getOrganizationTypeBadgeClass = (type?: string | null) => {
    const normalized = (type ?? "").trim().toLowerCase();
    if (normalized.includes("civic volunteer")) return "bg-primary/10 text-primary border-primary/20";
    if (normalized.includes("advocacy network")) return "bg-emerald-100 text-emerald-700 border-emerald-200/80";
    if (normalized.includes("multi-organization")) return "bg-violet-100 text-violet-700 border-violet-200/80";
    if (normalized.includes("youth interest")) return "bg-amber-100 text-amber-700 border-amber-200/80";
    if (normalized.includes("youth governance")) return "bg-blue-100 text-blue-700 border-blue-200/80";
    if (normalized.includes("campus youth")) return "bg-cyan-100 text-cyan-700 border-cyan-200/80";
    return "bg-muted text-muted-foreground border-border";
  };

  const columns = [
    {
      header: "Organization",
      accessor: (o: Organization) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{o.name}</span>
          <span className="text-xs text-muted-foreground font-medium">{o.slug}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (o: Organization) => (
        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOrganizationTypeBadgeClass(o.type)}`}>
          {o.type || "N/A"}
        </span>
      ),
    },
    {
      header: "Focus Area",
      accessor: (o: Organization) => (
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          {o.focus}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (o: Organization) => <StatusBadge status={o.status} />,
    },
    {
      header: "Coverage Area",
      accessor: (o: Organization) => <span className="text-sm text-muted-foreground">{o.coverage_area || "N/A"}</span>,
    },
  ];

  const filteredOrgs = orgs.filter(
    (o) => o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const organizationTypeLegendItems = organizationTypeLegendSeed.map((item) => ({
    key: `type-${item.key}`,
    label: item.label,
    description: item.description,
    badge: (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getOrganizationTypeBadgeClass(item.label)}`}>
        {item.label}
      </span>
    ),
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
            <LegendHelpButton
              onClick={() => setIsBadgeLegendOpen(true)}
              ariaLabel="View organization badge color legend"
            />
          </div>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage prototype organization information shown on the user-facing portal.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Register New Org
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-4 rounded-2xl border border-border card-shadow">
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
        <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 text-muted-foreground font-bold hover:bg-muted rounded-xl transition-all border border-border">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrgs}
        isLoading={isLoading}
        onRowClick={openDetailsModal}
        getRowAriaLabel={(item) => `Open details for ${item.name}`}
      />

      <LegendModal
        open={isBadgeLegendOpen}
        onOpenChange={setIsBadgeLegendOpen}
        title="Organization Badge Legend"
        description="These colors help identify organization types and statuses at a glance."
        groups={[
          {
            key: "status",
            title: "Status",
            items: organizationStatusLegendItems,
            defaultExpanded: true,
          },
          {
            key: "type",
            title: "Type",
            items: organizationTypeLegendItems,
            defaultExpanded: false,
          },
        ]}
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="flex w-[min(860px,calc(100vw-1.5rem))] max-h-[90vh] flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="border-b border-border/80 px-6 py-5 pr-12 text-left">
            <DialogTitle>Organization Details</DialogTitle>
            <DialogDescription>Read-only record view.</DialogDescription>
          </DialogHeader>
          {viewingOrg && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">1. Summary</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                  <div className="min-w-0">
                    <p className="admin-kicker">Organization</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{viewingOrg.name || "N/A"}</p>
                    <p className="mt-1 break-all text-xs font-medium text-muted-foreground">{viewingOrg.slug || "N/A"}</p>
                  </div>
                  <div>
                    <p className="admin-kicker">Type</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{viewingOrg.type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="admin-kicker">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={viewingOrg.status} />
                    </div>
                  </div>
                </div>
              </section>
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">2. About the Organization</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{viewingOrg.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type / Category</p>
                    <p className="text-sm font-medium">{viewingOrg.type || "N/A"}{viewingOrg.category ? ` • ${viewingOrg.category}` : ""}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">Short Overview</p>
                    <p className="text-sm font-medium">{viewingOrg.overview || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">Mission / Purpose</p>
                    <p className="text-sm font-medium">{viewingOrg.mission || viewingOrg.objectives || "N/A"}</p>
                  </div>
                </div>
              </section>
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">3. Focus and Coverage</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Focus Area</p>
                    <p className="text-sm font-medium">{viewingOrg.focus || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coverage Area</p>
                    <p className="text-sm font-medium">{viewingOrg.coverage_area || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Beneficiaries</p>
                    <p className="text-sm font-medium">{viewingOrg.target_beneficiaries || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1"><StatusBadge status={viewingOrg.status} /></div>
                  </div>
                </div>
              </section>
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">4. Projects and Activities</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Projects / Activities</p>
                    <p className="text-sm font-medium">{viewingOrg.programs_projects || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Related Programs / Events</p>
                    <p className="text-sm font-medium">{viewingOrg.related_events || "N/A"}</p>
                  </div>
                </div>
              </section>
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">5. Contact and Reference</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Email</p>
                    <p className="text-sm font-medium">{viewingOrg.contact_email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Phone</p>
                    <p className="text-sm font-medium">{viewingOrg.contact_phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source Label</p>
                    <p className="text-sm font-medium">{viewingOrg.source_reference_title || viewingOrg.source_tag || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source Tag</p>
                    <p className="text-sm font-medium">{viewingOrg.source_tag || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source URL</p>
                    {viewingOrg.source_post_url ? (
                      <a
                        href={viewingOrg.source_post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline break-all"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {viewingOrg.source_post_url}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">N/A</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-border/80 px-6 py-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">Read-only record view.</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => { if (!viewingOrg) return; setIsDetailsOpen(false); openEditModal(viewingOrg); }}>
                Edit
              </Button>
              <Button type="button" variant="destructive" onClick={() => { if (!viewingOrg) return; setIsDetailsOpen(false); openDeleteModal(viewingOrg); }}>
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
            <DialogDescription>Changes here are saved directly to Supabase.</DialogDescription>
          </DialogHeader>

          <form onSubmit={saveOrganization} className="space-y-5">
            <div className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">1. Basic Information</h3>
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
                <Label htmlFor="org-slug">Slug</Label>
                <Input
                  id="org-slug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="testing-youth-organization-i"
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
                <Label htmlFor="org-category">Category</Label>
                <Input
                  id="org-category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
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
                  <option value="pending">pending</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">2. About and Purpose</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-overview">Short Overview</Label>
                  <Textarea id="org-overview" value={form.overview} onChange={(e) => setForm((prev) => ({ ...prev, overview: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-mission">Mission / Purpose</Label>
                  <Textarea id="org-mission" value={form.mission} onChange={(e) => setForm((prev) => ({ ...prev, mission: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-objectives">Objectives (Optional)</Label>
                  <Textarea id="org-objectives" value={form.objectives} onChange={(e) => setForm((prev) => ({ ...prev, objectives: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">3. Focus and Coverage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-coverage">Coverage Area</Label>
                  <Input id="org-coverage" value={form.coverageArea} onChange={(e) => setForm((prev) => ({ ...prev, coverageArea: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-beneficiaries">Target Beneficiaries</Label>
                  <Input id="org-beneficiaries" value={form.targetBeneficiaries} onChange={(e) => setForm((prev) => ({ ...prev, targetBeneficiaries: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">4. Projects and Activities</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-projects">Projects / Activities</Label>
                  <Textarea id="org-projects" value={form.programsProjects} onChange={(e) => setForm((prev) => ({ ...prev, programsProjects: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-related-events">Related Programs / Events</Label>
                  <Input id="org-related-events" value={form.relatedEvents} onChange={(e) => setForm((prev) => ({ ...prev, relatedEvents: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">5. Contact and Reference</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-contact-email">Contact Email (Optional)</Label>
                  <Input id="org-contact-email" value={form.contactEmail} onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-contact-phone">Contact Phone (Optional)</Label>
                  <Input id="org-contact-phone" value={form.contactPhone} onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
                </div>
              <div className="space-y-2">
                <Label htmlFor="org-source-tag">Source Tag</Label>
                <Input
                  id="org-source-tag"
                  value={form.sourceTag}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceTag: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-source-label">Source Label</Label>
                <Input id="org-source-label" value={form.sourceLabel} onChange={(e) => setForm((prev) => ({ ...prev, sourceLabel: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-source-url">Source URL</Label>
                <Input
                  id="org-source-url"
                  value={form.sourcePostUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourcePostUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
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

