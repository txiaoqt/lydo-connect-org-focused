import { Building2, Filter, Search, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { youthOrganizations } from "@/lib/youthCatalog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Organizations() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "partner">("active");
  const { isJoined, join, leave } = useUserProfile();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const filtered = useMemo(
    () =>
      youthOrganizations.filter(
        (org) =>
          org.status === tab &&
          (org.name.toLowerCase().includes(search.toLowerCase()) ||
            org.focus.toLowerCase().includes(search.toLowerCase())),
      ),
    [search, tab],
  );

  const toggleJoin = (orgId: string, orgName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in first to join organizations and manage them in your profile.",
      });
      return;
    }

    if (isJoined("organizations", orgId)) {
      leave("organizations", orgId);
      toast({ title: "Organization Left", description: `Removed ${orgName} from your profile.` });
      return;
    }

    join("organizations", orgId);
    toast({ title: "Organization Joined", description: `${orgName} added to your profile.` });
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
              Verified organizations and partners connected to LYDO San Mateo, Rizal based on municipal
              public announcements.
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

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((org) => (
                  <div
                    key={org.id}
                    className="bg-card border border-border rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                        {org.type}
                      </span>
                      {isJoined("organizations", org.id) && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">Joined</span>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-lg mb-2">{org.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{org.focus}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        LYDO-Connected
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {org.sourceTag}
                      </span>
                    </div>
                    {org.sourcePostUrl && (
                      <a href={org.sourcePostUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mb-4">
                        Source Post
                      </a>
                    )}
                    <Button size="sm" className="w-full" onClick={() => toggleJoin(org.id, org.name)}>
                      {isJoined("organizations", org.id) ? "Joined (Click to Leave)" : "Join Organization"}
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
                Organization list is based on publicly posted LYDO-related announcements from the Municipality of San
                Mateo website (which republishes official LGU updates).
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
