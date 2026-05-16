import { AlertCircle, Building2, CalendarDays, FileText, Filter, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { YouthOrganization } from "@/lib/youthCatalog";
import { fetchOrganizations } from "@/lib/data-api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Organizations() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "partner">("active");
  const [organizations, setOrganizations] = useState<YouthOrganization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<YouthOrganization | null>(null);

  const loadOrganizations = async () => {
    setIsLoadingOrgs(true);
    setErrorMessage(null);
    try {
      const data = await fetchOrganizations();
      setOrganizations(data);
    } catch {
      setErrorMessage("Unable to load organizations right now. Please try again.");
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const filtered = useMemo(
    () =>
      organizations.filter(
        (org) =>
          org.status === tab &&
          (org.name.toLowerCase().includes(search.toLowerCase()) ||
            org.type.toLowerCase().includes(search.toLowerCase()) ||
            org.focus.toLowerCase().includes(search.toLowerCase()) ||
            (org.overview ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (org.location ?? "").toLowerCase().includes(search.toLowerCase())),
      ),
    [organizations, search, tab],
  );

  const showValue = (value?: string | null) => {
    const text = (value ?? "").trim();
    return text.length > 0 ? text : "N/A";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">
              Youth Organizations
            </h1>
            <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
              Verified Pasig-based youth organizations and partners, sourced from official city and government
              announcements.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={tab === "active" ? "default" : "outline"} size="sm" onClick={() => setTab("active")}>
                  Active
                </Button>
                <Button variant={tab === "partner" ? "default" : "outline"} size="sm" onClick={() => setTab("partner")}>
                  Partners
                </Button>
              </div>
            </div>

            {isLoadingOrgs ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">Loading organizations...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive/70" />
                <p className="text-lg font-medium text-foreground">Could not load organization records</p>
                <p className="mt-2 mb-5 text-sm">{errorMessage}</p>
                <Button variant="outline" onClick={() => void loadOrganizations()}>Retry</Button>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filtered.map((org) => (
                  <div
                    key={org.id}
                    className="h-full rounded-lg border border-border bg-card p-5 card-shadow hover:card-shadow-hover transition-all duration-200 flex flex-col"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                        {showValue(org.category ?? org.type)}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground/80">
                        {org.status === "partner" ? "Partner" : "Active"}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg leading-snug mb-2 min-h-[3.25rem] line-clamp-2">{org.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-6 min-h-[3rem] line-clamp-2">{org.overview ?? org.focus}</p>
                    <div className="space-y-3 text-sm text-muted-foreground mb-4 border-t border-border pt-4">
                      <span className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-primary" />
                        {showValue(org.type)}
                      </span>
                      <span className="flex items-start gap-3">
                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        {showValue(org.sourceTag)}
                      </span>
                      {(org.coverageArea || org.location) && (
                        <span className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          {showValue(org.coverageArea ?? org.location)}
                        </span>
                      )}
                      {org.sourcePostUrl && (
                        <a
                          href={org.sourcePostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-3 font-semibold text-primary hover:text-primary/80"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          Source Post
                        </a>
                      )}
                    </div>
                    <Button size="sm" className="w-full mt-auto" onClick={() => setSelectedOrganization(org)}>
                      <FileText className="h-4 w-4" />
                      View Organization Info
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No organizations found</p>
              </div>
            )}

            <div className="mt-10 bg-muted/40 border rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Organization list is based on official Pasig City pages, announcements, and verified government
                references.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={Boolean(selectedOrganization)} onOpenChange={(open) => !open && setSelectedOrganization(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedOrganization ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl pr-8">{selectedOrganization.name}</DialogTitle>
                <DialogDescription>{showValue(selectedOrganization.category ?? selectedOrganization.type)}</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-5 text-sm">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Description / Overview</h4>
                    <p className="text-muted-foreground leading-6">{showValue(selectedOrganization.overview ?? selectedOrganization.focus)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Mission / Purpose / Objectives</h4>
                    <p className="text-muted-foreground leading-6">
                      {showValue(selectedOrganization.mission ?? selectedOrganization.objectives)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Programs / Projects / Activities</h4>
                    <p className="text-muted-foreground leading-6">
                      {showValue(selectedOrganization.programs ?? selectedOrganization.activities ?? selectedOrganization.relatedInitiatives)}
                    </p>
                    {selectedOrganization.relatedInitiativesList && selectedOrganization.relatedInitiativesList.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {selectedOrganization.relatedInitiativesList.map((initiative, index) => (
                          <li key={`${initiative.name}-${index}`} className="leading-6">
                            {initiative.name}
                            {initiative.year ? ` (${initiative.year})` : ""}
                            {initiative.sourceUrl ? (
                              <>
                                {" - "}
                                <a
                                  href={initiative.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-primary hover:text-primary/80"
                                >
                                  Source
                                </a>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Target Beneficiaries</h4>
                    <p className="text-muted-foreground leading-6">{showValue(selectedOrganization.targetBeneficiaries)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Location / Coverage Area</h4>
                    <p className="text-muted-foreground leading-6">{showValue(selectedOrganization.coverageArea ?? selectedOrganization.location)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Contact Information</h4>
                    <p className="text-muted-foreground leading-6">
                      {showValue(
                        [selectedOrganization.contactPerson, selectedOrganization.contactEmail, selectedOrganization.contactPhone]
                          .filter((value) => value && value.trim().length > 0)
                          .join(" | "),
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Related Activity Date / Year</h4>
                    <p className="text-muted-foreground leading-6 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                      {showValue(selectedOrganization.activityYear ?? selectedOrganization.sourceDate)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Credibility Notes</h4>
                    <p className="text-muted-foreground leading-6">{showValue(selectedOrganization.credibilityNotes ?? selectedOrganization.sourceTag)}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Source Name:</span>{" "}
                  {showValue(selectedOrganization.sourceName)}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Official Reference:</span>{" "}
                  {selectedOrganization.sourcePostUrl ? (
                    <a
                      href={selectedOrganization.sourcePostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Source Link
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                {selectedOrganization.sourceLinks && selectedOrganization.sourceLinks.length > 0 ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Additional Official Sources:</p>
                    {selectedOrganization.sourceLinks.map((source, index) => (
                      <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-primary hover:text-primary/80 font-medium"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
