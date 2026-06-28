import { useEffect, useMemo, useState } from "react";
import { Building2, ClipboardCheck, Download, Eye, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportReportDialog } from "@/components/reports/ExportReportDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalEmptyState, PortalMetricCard, PortalSection, PortalStatusBadge } from "@/components/portal/portal-ui";
import { majorClassificationOptions, statusLabelMap, type OrganizationProfile } from "@/lib/lydo-connect-data";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import {
  mapOrganizationProfileToYorpExportRow,
  yorpRegistryExportConfig,
} from "@/lib/report-export-configs";
import { exportReport, type ExportFormat } from "@/lib/report-export";
import { toast } from "@/hooks/use-toast";

type YorpFilter = "all" | "registered" | "renewed" | "not_registered";

const YEAR_OPTIONS = ["2024", "2025", "2026"];

const yorpStatusLabel: Record<YorpFilter, string> = {
  all: "All YORP",
  registered: "Registered",
  renewed: "Renewed",
  not_registered: "Not Registered",
};

const isYorpRegistered = (org: OrganizationProfile) =>
  org.yorpRegisteredYear != null || org.profileStatus === "verified";

const isYorpRenewed = (org: OrganizationProfile) =>
  org.yorpRenewedYear != null;

const renderOrFallback = (value?: string | null) =>
  value && value.trim().length ? value : "Not available";

export function YorpRegistryPage() {
  const { state } = useLydoConnect();
  const orgs = state.organizationProfiles;

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yorpFilter, setYorpFilter] = useState<YorpFilter>("all");
  const [selectedOrg, setSelectedOrg] = useState<OrganizationProfile | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orgs.filter((org) => {
      if (
        q &&
        ![
          org.organizationName,
          org.barangay,
          org.representativeName,
          org.contactNumber,
          org.organizationEmail,
        ].some((field) => field.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (yearFilter !== "all") {
        const yr = Number(yearFilter);
        if (org.yorpRegisteredYear !== yr && org.yorpRenewedYear !== yr) return false;
      }
      if (classFilter !== "all" && org.majorClassification !== classFilter) return false;
      if (statusFilter !== "all" && org.profileStatus !== statusFilter) return false;
      if (yorpFilter === "registered" && !isYorpRegistered(org)) return false;
      if (yorpFilter === "renewed" && !isYorpRenewed(org)) return false;
      if (yorpFilter === "not_registered" && (isYorpRegistered(org) || isYorpRenewed(org))) return false;
      return true;
    });
  }, [orgs, search, yearFilter, classFilter, statusFilter, yorpFilter]);

  const stats = useMemo(
    () => ({
      total: orgs.length,
      registered: orgs.filter(isYorpRegistered).length,
      renewed: orgs.filter(isYorpRenewed).length,
    }),
    [orgs],
  );

  const exportRows = useMemo(
    () => filtered.map(mapOrganizationProfileToYorpExportRow),
    [filtered],
  );

  const exportFilterSummary = useMemo(() => {
    const summary: string[] = [];
    if (search.trim()) summary.push(`Search: ${search.trim()}`);
    if (yorpFilter !== "all") summary.push(`YORP Status: ${yorpStatusLabel[yorpFilter]}`);
    if (yearFilter !== "all") summary.push(`Year: ${yearFilter}`);
    if (classFilter !== "all") summary.push(`Classification: ${classFilter}`);
    if (statusFilter !== "all") summary.push(`Profile Status: ${statusLabelMap[statusFilter] ?? statusFilter}`);
    return summary;
  }, [classFilter, search, statusFilter, yearFilter, yorpFilter]);

  useEffect(() => {
    setMobileVisibleCount(6);
  }, [search, yearFilter, classFilter, statusFilter, yorpFilter]);

  const handleExport = async (format: ExportFormat) => {
    if (!exportRows.length) {
      toast({ title: "No Data", description: "No YORP records match the current filters." });
      return;
    }

    try {
      await exportReport(format, {
        config: yorpRegistryExportConfig,
        rows: exportRows,
        metadataLines: [`Total Records: ${exportRows.length}`],
        filterSummaryLines: exportFilterSummary,
      });
      toast({
        title: "Export Ready",
        description: `The YORP Registry ${format.toUpperCase()} export has been downloaded.`,
      });
    } catch (error) {
      console.error("Failed to export YORP registry:", error);
      toast({
        title: "Export Failed",
        description: "The YORP Registry export could not be generated.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="yorp-registry-page space-y-4 sm:space-y-6">
      <div className="registry-summary-grid grid grid-cols-3 gap-2 lg:hidden">
        {[
          { label: "Total Organizations", value: stats.total, icon: Building2 },
          { label: "YORP Registered", value: stats.registered, icon: ClipboardCheck },
          { label: "Renewed", value: stats.renewed, icon: RefreshCw },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="registry-summary-card min-w-0 rounded-xl border border-border/70 bg-card/90 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <p className="text-[9px] uppercase tracking-[0.08em] leading-snug text-muted-foreground/75">
                {label}
              </p>
            </div>
            <p className="mt-2.5 text-[1.6rem] font-semibold leading-none text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-2 gap-3 md:grid-cols-3 lg:grid">
        <PortalMetricCard className="md:col-span-1" label="Total Organizations" value={stats.total} icon={Building2} />
        <PortalMetricCard label="YORP Registered" value={stats.registered} icon={ClipboardCheck} />
        <PortalMetricCard className="col-span-2 md:col-span-1" label="Renewed" value={stats.renewed} icon={RefreshCw} />
      </div>

      <PortalSection
        title="YORP Registry"
        description="View and manage YORP registration status for all organizations."
        action={
          <Button
            variant="outline"
            size="sm"
            className="registry-export-button w-auto max-lg:min-h-[38px] max-lg:px-3.5"
            disabled={!filtered.length}
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      >
        <div className="registry-filter-grid mb-4 grid grid-cols-2 gap-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))]">
          <div className="registry-search relative col-span-2 min-w-0 xl:col-span-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full pl-8"
            />
          </div>
          <Select value={yorpFilter} onValueChange={(value) => setYorpFilter(value as YorpFilter)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="YORP Status" />
            </SelectTrigger>
            <SelectContent>
              {(["all", "registered", "renewed", "not_registered"] as YorpFilter[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {yorpStatusLabel[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classifications</SelectItem>
              {majorClassificationOptions.map((classification) => (
                <SelectItem key={classification} value={classification}>
                  {classification}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Profile Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["verified", "pending_review", "needs_update", "incomplete", "suspended_inactive"].map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabelMap[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <PortalEmptyState
            title={orgs.length === 0 ? "No organizations yet" : "No organizations match"}
            description={
              orgs.length === 0
                ? "Organizations will appear here once they register on the portal."
                : "Try adjusting the search or filters."
            }
          />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filtered.slice(0, mobileVisibleCount).map((org, idx) => (
                <div key={org.id} className="rounded-xl border border-border/70 bg-background p-4 shadow-sm">
                  <div className="registry-card-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">#{idx + 1}</p>
                      <p className="registry-name mt-1 break-words text-base font-semibold leading-6 text-foreground">
                        {org.organizationName || <span className="italic text-muted-foreground">Unnamed</span>}
                      </p>
                    </div>
                    <div className="registry-status max-w-[110px] text-right">
                      <PortalStatusBadge status={org.profileStatus} />
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <p className="text-sm text-muted-foreground">
                      {[org.barangay, org.district].filter(Boolean).join(" · ") || "Not available"}
                    </p>
                    <p className="text-sm text-foreground">{renderOrFallback(org.majorClassification)}</p>
                    <p className="registry-card-email min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
                      {renderOrFallback(org.organizationEmail || org.contactNumber)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      className="h-10 px-0 text-sm font-medium text-primary hover:text-primary"
                      title="View details"
                      onClick={() => setSelectedOrg(org)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </Button>
                  </div>
                </div>
              ))}
              <p className="px-1 text-xs text-muted-foreground">
                Showing {Math.min(mobileVisibleCount, filtered.length)} of {filtered.length} organizations
              </p>
              {mobileVisibleCount < filtered.length ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMobileVisibleCount((current) => current + 6)}
                >
                  Load more organizations
                </Button>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {["#", "Organization", "Barangay", "Major Classification", "Contact Number", "Email", "Status", ""].map((heading) => (
                      <th key={heading} className="admin-kicker pb-2 pr-4 text-left font-semibold last:pr-0">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org, idx) => (
                    <tr
                      key={org.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/30 last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2.5 pr-4 font-medium">
                        {org.organizationName || <span className="italic text-muted-foreground">Unnamed</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{org.barangay || "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{org.majorClassification || "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{org.contactNumber || "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{org.organizationEmail || "—"}</td>
                      <td className="py-2.5 pr-4">
                        <PortalStatusBadge status={org.profileStatus} />
                      </td>
                      <td className="py-2.5" onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View details"
                          onClick={() => setSelectedOrg(org)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Showing {filtered.length} of {orgs.length} organizations
              </p>
            </div>
          </>
        )}
      </PortalSection>

      <Dialog open={selectedOrg !== null} onOpenChange={(open) => { if (!open) setSelectedOrg(null); }}>
        <DialogContent className="yorp-registry-details max-w-2xl max-lg:grid max-lg:w-[calc(100vw-24px)] max-lg:max-w-[520px] max-lg:grid-rows-[auto_minmax(0,1fr)] max-lg:max-h-[calc(100dvh-24px)] max-lg:overflow-hidden max-lg:rounded-2xl max-lg:p-0 max-lg:[&>button]:right-3 max-lg:[&>button]:top-3 max-lg:[&>button]:z-20 max-lg:[&>button]:h-10 max-lg:[&>button]:w-10 max-lg:[&>button]:rounded-full max-lg:[&>button]:border max-lg:[&>button]:border-border/60 max-lg:[&>button]:bg-background">
          {selectedOrg ? (
            <>
              <DialogHeader className="hidden lg:block">
                <DialogTitle>{selectedOrg.organizationName || "Organization"}</DialogTitle>
                {(selectedOrg.barangay || selectedOrg.majorClassification) && (
                  <p className="text-sm text-muted-foreground">
                    {[selectedOrg.barangay, selectedOrg.majorClassification].filter(Boolean).join(" · ")}
                  </p>
                )}
              </DialogHeader>

              <div className="hidden grid-cols-1 gap-x-8 gap-y-4 pt-1 lg:grid lg:grid-cols-2">
                <Field label="Status">
                  <PortalStatusBadge status={selectedOrg.profileStatus} />
                </Field>
                <Field label="Registration No.">
                  <span className="font-mono">{selectedOrg.organizationIdentifierNumber || "—"}</span>
                </Field>

                <Field label="YORP Reg Year">
                  {selectedOrg.yorpRegisteredYear != null ? <Badge variant="secondary">{selectedOrg.yorpRegisteredYear}</Badge> : <span className="text-muted-foreground">—</span>}
                </Field>
                <Field label="YORP Renewed Year">
                  {selectedOrg.yorpRenewedYear != null ? (
                    <Badge className="border-0 bg-green-500/15 text-green-700 hover:bg-green-500/20">
                      {selectedOrg.yorpRenewedYear}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Field>

                <Field label="Contact Number">
                  {selectedOrg.contactNumber || <span className="text-muted-foreground">—</span>}
                </Field>
                <Field label="Email">
                  {selectedOrg.organizationEmail || <span className="text-muted-foreground">—</span>}
                </Field>

                <Field label="District">
                  {selectedOrg.district || <span className="text-muted-foreground">—</span>}
                </Field>
                <Field label="Sub-classification">
                  {selectedOrg.subClassification || <span className="text-muted-foreground">—</span>}
                </Field>

                <Field label="Representative">
                  {selectedOrg.representativeName || <span className="text-muted-foreground">—</span>}
                </Field>
                <Field label="Adviser">
                  {selectedOrg.adviserName || <span className="text-muted-foreground">—</span>}
                </Field>

                <div className="col-span-2">
                  <Field label="Address">
                    {selectedOrg.address || <span className="text-muted-foreground">—</span>}
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field label="Facebook">
                    {selectedOrg.facebookPageUrl ? (
                      <a href={selectedOrg.facebookPageUrl} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-4 hover:underline">
                        {selectedOrg.facebookPageUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field label="Advocacies">
                    {selectedOrg.advocacies.length > 0 ? (
                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                        {selectedOrg.advocacies.map((advocacy) => (
                          <Badge key={advocacy} variant="outline" className="font-normal">
                            {advocacy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Field>
                </div>

                {selectedOrg.internalNotes ? (
                  <div className="col-span-2">
                    <Field label="Internal Notes">{selectedOrg.internalNotes}</Field>
                  </div>
                ) : null}

                {selectedOrg.verifiedAt ? (
                  <Field label="Verified">
                    {new Date(selectedOrg.verifiedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </Field>
                ) : null}
                <Field label="Registered">
                  {new Date(selectedOrg.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                </Field>
              </div>

              <div className="yorp-registry-details__body min-h-0 overflow-y-auto overscroll-contain lg:hidden">
                <div className="border-b border-border/60 px-4 pb-4 pt-5">
                  <div className="pr-12">
                    <h2 className="text-lg font-semibold leading-6 text-foreground">
                      {selectedOrg.organizationName || "Organization"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[selectedOrg.barangay, selectedOrg.majorClassification].filter(Boolean).join(" · ") || "Not available"}
                    </p>
                    <div className="mt-2">
                      <PortalStatusBadge status={selectedOrg.profileStatus} />
                    </div>
                  </div>
                </div>

                <div className="space-y-5 px-4 py-4">
                  <MobileDetailsSection title="Registration">
                    <div className="details-grid grid grid-cols-2 gap-x-4 gap-y-4">
                      <MobileField label="Status">
                        <PortalStatusBadge status={selectedOrg.profileStatus} />
                      </MobileField>
                      <MobileField label="Registration No.">
                        <span className="font-mono">{selectedOrg.organizationIdentifierNumber || "Not available"}</span>
                      </MobileField>
                      <MobileField label="YORP Registration Year">
                        {selectedOrg.yorpRegisteredYear != null ? selectedOrg.yorpRegisteredYear : "Not available"}
                      </MobileField>
                      <MobileField label="YORP Renewed Year">
                        {selectedOrg.yorpRenewedYear != null ? selectedOrg.yorpRenewedYear : "Not available"}
                      </MobileField>
                    </div>
                  </MobileDetailsSection>

                  <MobileDetailsSection title="Contact & Location">
                    <div className="details-grid grid grid-cols-2 gap-x-4 gap-y-4">
                      <MobileField label="Contact Number">
                        {renderOrFallback(selectedOrg.contactNumber)}
                      </MobileField>
                      <MobileField label="District">
                        {renderOrFallback(selectedOrg.district)}
                      </MobileField>
                      <MobileField className="details-field--full col-span-2" label="Email">
                        {renderOrFallback(selectedOrg.organizationEmail)}
                      </MobileField>
                      <MobileField className="details-field--full col-span-2" label="Address">
                        {renderOrFallback(selectedOrg.address)}
                      </MobileField>
                      <MobileField className="details-field--full col-span-2" label="Facebook">
                        {selectedOrg.facebookPageUrl ? (
                          <a href={selectedOrg.facebookPageUrl} target="_blank" rel="noreferrer" className="break-words text-primary underline-offset-4 hover:underline">
                            {selectedOrg.facebookPageUrl}
                          </a>
                        ) : (
                          "Not available"
                        )}
                      </MobileField>
                    </div>
                  </MobileDetailsSection>

                  <MobileDetailsSection title="Leadership">
                    <div className="grid grid-cols-1 gap-y-4">
                      <MobileField className="details-field--full" label="Representative">
                        {renderOrFallback(selectedOrg.representativeName)}
                      </MobileField>
                      <MobileField className="details-field--full" label="Adviser">
                        {renderOrFallback(selectedOrg.adviserName)}
                      </MobileField>
                    </div>
                  </MobileDetailsSection>

                  <MobileDetailsSection title="Classification">
                    <div className="details-grid grid grid-cols-2 gap-x-4 gap-y-4">
                      <MobileField label="Major">
                        {renderOrFallback(selectedOrg.majorClassification)}
                      </MobileField>
                      <MobileField label="Sub-classification">
                        {renderOrFallback(selectedOrg.subClassification)}
                      </MobileField>
                    </div>
                  </MobileDetailsSection>

                  <MobileDetailsSection title="Advocacies">
                    {selectedOrg.advocacies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedOrg.advocacies.map((advocacy) => (
                          <Badge key={advocacy} variant="outline" className="font-normal">
                            {advocacy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not available</p>
                    )}
                  </MobileDetailsSection>

                  <MobileDetailsSection title="Record Information">
                    <div className="grid grid-cols-1 gap-y-4">
                      {selectedOrg.verifiedAt ? (
                        <MobileField className="details-field--full" label="Verified">
                          {new Date(selectedOrg.verifiedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </MobileField>
                      ) : null}
                      <MobileField className="details-field--full" label="Registered">
                        {new Date(selectedOrg.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                      </MobileField>
                    </div>
                  </MobileDetailsSection>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ExportReportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportTitle="YORP Registry"
        description="Export all YORP records matching the current search and filters."
        onExport={handleExport}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted-foreground/75">{label}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function MobileDetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MobileField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground/75">{label}</p>
      <div className="mt-1 text-[0.9rem] font-medium leading-6 text-foreground">{children}</div>
    </div>
  );
}
