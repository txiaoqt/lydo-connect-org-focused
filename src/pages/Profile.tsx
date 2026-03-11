import { Building2, Calendar, Camera, FolderOpen, Save, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { UserSettings, useUserProfile } from "@/hooks/use-user-profile";
import type { YouthEvent, YouthOrganization, YouthProgram } from "@/lib/youthCatalog";
import { fetchEvents, fetchOrganizations, fetchPrograms } from "@/lib/data-api";
import { useToast } from "@/hooks/use-toast";

const findLabel = (
  list: Array<{ id: string; title?: string; name?: string }>,
  id: string,
) => list.find((item) => item.id === id)?.title ?? list.find((item) => item.id === id)?.name ?? id;

const initialsFrom = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "LY";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const roleTagLabel = (role: string) => {
  if (role === "sk") return "Barangay SK";
  if (role === "staff") return "LYDO Staff";
  if (role === "admin") return "Admin";
  if (role === "youth") return "Youth";
  return "User";
};

export default function Profile() {
  const { isAuthenticated, user, isInitialized, role } = useAuth();
  const { profile, updateSettings, leave, joinedCounts } = useUserProfile();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<{
    events: YouthEvent[];
    programs: YouthProgram[];
    organizations: YouthOrganization[];
  }>({
    events: [],
    programs: [],
    organizations: [],
  });
  const [settings, setSettings] = useState<UserSettings>(profile.settings);

  useEffect(() => {
    setSettings(profile.settings);
  }, [profile.settings]);

  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      const [events, programs, organizations] = await Promise.all([
        fetchEvents(),
        fetchPrograms(),
        fetchOrganizations(),
      ]);
      if (!mounted) return;
      setCatalog({ events, programs, organizations });
    };
    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const joinedEvents = useMemo(
    () => profile.joined.events.map((id) => ({ id, label: findLabel(catalog.events, id) })),
    [catalog.events, profile.joined.events],
  );
  const joinedPrograms = useMemo(
    () => profile.joined.programs.map((id) => ({ id, label: findLabel(catalog.programs, id) })),
    [catalog.programs, profile.joined.programs],
  );
  const joinedOrganizations = useMemo(
    () => profile.joined.organizations.map((id) => ({ id, label: findLabel(catalog.organizations, id) })),
    [catalog.organizations, profile.joined.organizations],
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container">
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const handleSaveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    updateSettings(settings);
    toast({
      title: "Settings Saved",
      description: "Your profile settings were updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="container py-8 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-5 card-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined Events</p>
                  <p className="text-3xl leading-none font-semibold mt-1">{joinedCounts.events}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-5 card-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined Programs</p>
                  <p className="text-3xl leading-none font-semibold mt-1">{joinedCounts.programs}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-5 card-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined Organizations</p>
                  <p className="text-3xl leading-none font-semibold mt-1">{joinedCounts.organizations}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-card border rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Account Settings</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-primary/10 grid place-items-center text-primary text-3xl font-bold">
                    {initialsFrom(settings.fullName || user?.displayName || "LYDO")}
                  </div>
                  <button type="button" className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-semibold">{settings.fullName || user?.displayName || "LYDO User"}</p>
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
                      {roleTagLabel(role)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{settings.email || user?.email || "user@lydo.local"}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={settings.fullName || "Not set"} readOnly />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="contactNumber">Phone Number</Label>
                  <Input id="contactNumber" value={settings.contactNumber} onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="municipality">Municipality</Label>
                  <Input id="municipality" value={settings.municipality || "San Mateo, Rizal"} readOnly />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Input id="barangay" value={settings.barangay || "Not set"} readOnly />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="min-w-36">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </form>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> My Events</h3>
              <div className="space-y-3">
                {joinedEvents.length === 0 && <p className="text-sm text-muted-foreground">No joined events.</p>}
                {joinedEvents.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <p className="text-sm">{item.label}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/events/${item.id}`}>Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:text-destructive" onClick={() => leave("events", item.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><FolderOpen className="h-4 w-4 text-muted-foreground" /> My Programs</h3>
              <div className="space-y-3">
                {joinedPrograms.length === 0 && <p className="text-sm text-muted-foreground">No joined programs.</p>}
                {joinedPrograms.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <p className="text-sm">{item.label}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/programs/${item.id}`}>Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:text-destructive" onClick={() => leave("programs", item.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 card-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> My Organizations</h3>
              <div className="space-y-3">
                {joinedOrganizations.length === 0 && <p className="text-sm text-muted-foreground">No joined organizations.</p>}
                {joinedOrganizations.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <p className="text-sm">{item.label}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/organizations">Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:text-destructive" onClick={() => leave("organizations", item.id)}>
                        Leave
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
