import { ArrowUpRight, Calendar, Clock, FileText, MapPin, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { YouthEvent } from "@/lib/youthCatalog";
import { fetchEventById } from "@/lib/data-api";
import LocationPreviewButton from "@/components/LocationPreviewButton";
import SourcePostEmbed from "@/components/SourcePostEmbed";

export default function EventRecord() {
  const { eventId = "", programId = "" } = useParams<{
    eventId?: string;
    programId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const recordId = programId || eventId;
  const requestedKind = programId ? "program" : "event";
  const requestedView = searchParams.get("view") === "registration" ? "registration" : "details";
  const { isAuthenticated } = useAuth();
  const { profile, isJoined, leave, registerForEvent, registerForProgram, getEventRegistration, getProgramRegistration } = useUserProfile();
  const { toast } = useToast();
  const [event, setEvent] = useState<YouthEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [view, setView] = useState<"details" | "registration">(requestedView);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    municipality: "",
    barangay: "",
  });

  useEffect(() => {
    let mounted = true;
    const loadEvent = async () => {
      setIsLoadingEvent(true);
      const loaded = await fetchEventById(recordId, requestedKind);
      if (!mounted) return;
      setEvent(loaded);
      setIsLoadingEvent(false);
    };
    void loadEvent();
    return () => {
      mounted = false;
    };
  }, [recordId, requestedKind]);

  const isProgramRecord = event?.recordKind === "program";
  const eventRegistrationInfo = event && !isProgramRecord ? getEventRegistration(event.id) : null;
  const programRegistrationInfo = event && isProgramRecord ? getProgramRegistration(event.id) : null;
  const registrationInfo = isProgramRecord ? programRegistrationInfo : eventRegistrationInfo;

  useEffect(() => {
    setView(requestedView);
  }, [recordId, requestedView]);

  useEffect(() => {
    setForm({
      fullName: registrationInfo?.fullName ?? profile.settings.fullName,
      email: registrationInfo?.email ?? profile.settings.email,
      contactNumber: registrationInfo?.contactNumber ?? profile.settings.contactNumber,
      municipality: registrationInfo?.municipality ?? profile.settings.municipality,
      barangay: registrationInfo?.barangay ?? profile.settings.barangay,
    });
  }, [
    profile.settings.barangay,
    profile.settings.contactNumber,
    profile.settings.email,
    profile.settings.fullName,
    profile.settings.municipality,
    registrationInfo?.barangay,
    registrationInfo?.contactNumber,
    registrationInfo?.email,
    registrationInfo?.fullName,
    registrationInfo?.municipality,
  ]);

  if (!isLoadingEvent && !event) {
    return <Navigate to={requestedKind === "program" ? "/programs" : "/events"} replace />;
  }

  const registered = event
    ? isProgramRecord
      ? isJoined("programs", event.id)
      : isJoined("events", event.id)
    : false;
  const recordTypeLabel = isProgramRecord ? "Program" : "Event";
  const sourceTypeLabel = event?.sourcePostUrl ? "Facebook Source" : "Portal Entry";

  const handleUnregister = () => {
    if (!event) return;
    if (isProgramRecord) {
      leave("programs", event.id);
      toast({
        title: "Program Registration Removed",
        description: `Your registration for ${event.title} was cancelled.`,
      });
      return;
    }
    leave("events", event.id);
    toast({
      title: "Registration Removed",
      description: `You are no longer registered for ${event.title}.`,
    });
  };

  const handleRegister = (eventForm: React.FormEvent) => {
    eventForm.preventDefault();
    if (!event) return;

    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: `Please sign in first to register and manage this ${isProgramRecord ? "program" : "event"} from your profile.`,
      });
      return;
    }
    if (!form.fullName || !form.email || !form.contactNumber || !form.municipality || !form.barangay) {
      toast({ title: "Incomplete Form", description: "Please complete all registration fields." });
      return;
    }
    if (isProgramRecord) {
      registerForProgram(event.id, form);
      toast({
        title: "Program Registration Successful",
        description: `You are now registered for ${event.title}.`,
      });
      return;
    }

    registerForEvent(event.id, form);
    toast({
      title: "Registration Successful",
      description: `You are now registered for ${event.title}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {isLoadingEvent ? (
          <section className="container py-16">
            <p className="text-sm text-muted-foreground">Loading event details...</p>
          </section>
        ) : event ? (
          <>
            <section className="hero-gradient py-14">
              <div className="container">
                <p className="text-secondary-foreground/70 text-sm mb-3">{isProgramRecord ? "Program Record" : "Event Record"}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground max-w-4xl">{event.title}</h1>
              </div>
            </section>

            <section className="container py-10">
              <div className="grid gap-6 xl:grid-cols-5 items-start">
                <div className="xl:col-span-3 bg-card border rounded-xl p-6 card-shadow min-w-0">
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">{event.sector}</span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground capitalize">{event.status}</span>
                  </div>

                  <div className="mb-7">
                    <h2 className="text-base font-semibold mb-3">Official Source Post</h2>
                    {event.sourcePostUrl ? (
                      <SourcePostEmbed sourcePostUrl={event.sourcePostUrl} title={event.title} />
                    ) : (
                      <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                        No source post URL was provided for this record.
                      </div>
                    )}
                  </div>
                </div>

                <aside className="xl:col-span-2 space-y-4 xl:sticky xl:top-24">
                  <div className="bg-card border rounded-xl p-2 card-shadow">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setView("details")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          view === "details" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setView("registration")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          view === "registration" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Registration
                      </button>
                    </div>
                  </div>

                  {view === "details" ? (
                    <div className="bg-card border rounded-xl p-6 card-shadow space-y-5">
                      <div className="space-y-2">
                        <p className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {recordTypeLabel} Details
                        </p>
                        <h2 className="text-lg font-semibold">{event.sourcePostUrl ? "Local Summary" : "Description"}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {event.description.trim() || "No summary was provided for this record."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
                          <p className="text-sm font-medium mt-1">{recordTypeLabel}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
                          <p className="text-sm font-medium mt-1">{sourceTypeLabel}</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="rounded-lg border bg-background px-3 py-2.5">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Date</span>
                          </div>
                          <p className="mt-1 text-foreground">{event.date || "TBA"}</p>
                        </div>
                        <div className="rounded-lg border bg-background px-3 py-2.5">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Time</span>
                          </div>
                          <p className="mt-1 text-foreground">{event.time || "TBA"}</p>
                        </div>
                        <div className="rounded-lg border bg-background px-3 py-2.5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Location</span>
                          </div>
                          <LocationPreviewButton
                            location={event.location}
                            locationLatitude={event.locationLatitude}
                            locationLongitude={event.locationLongitude}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : !registered ? (
                    <form onSubmit={handleRegister} className="bg-card border rounded-xl p-6 card-shadow bg-muted/20 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        {isProgramRecord ? "Program Registration Details" : "Event Registration Details"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Complete your details to register. You can manage this registration from your profile later.
                      </p>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="fullName">Name</Label>
                          <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="contactNumber">Contact Number</Label>
                          <Input
                            id="contactNumber"
                            value={form.contactNumber}
                            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="municipality">Municipality</Label>
                          <Input
                            id="municipality"
                            value={form.municipality}
                            onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="barangay">Barangay</Label>
                          <Input id="barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        <UserCheck className="h-4 w-4 mr-2" />
                        {isProgramRecord ? "Submit Program Registration" : "Confirm Registration"}
                      </Button>
                    </form>
                  ) : (
                    <div className="bg-card border rounded-xl p-6 card-shadow bg-primary/5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Registered Participant</p>
                      <p className="font-medium">{registrationInfo?.fullName ?? form.fullName}</p>
                      <p className="text-sm text-muted-foreground">{registrationInfo?.email ?? form.email}</p>
                      <p className="text-sm text-muted-foreground">{registrationInfo?.contactNumber ?? form.contactNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {registrationInfo?.municipality ?? form.municipality}, {registrationInfo?.barangay ?? form.barangay}
                      </p>
                      <Button variant="outline" className="mt-4 w-full" onClick={handleUnregister}>
                        {isProgramRecord ? "Cancel Program Registration" : "Cancel Registration"}
                      </Button>
                    </div>
                  )}

                  <div className="bg-card border rounded-xl p-6 card-shadow space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
                    <Button variant="outline" asChild className="w-full justify-between">
                      <Link to={isProgramRecord ? "/programs" : "/events"}>
                        {isProgramRecord ? "Back to Programs" : "Back to Events"}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isAuthenticated ? (
                      <Button variant="outline" asChild className="w-full justify-between">
                        <Link to="/profile">
                          Go to Profile
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild className="w-full justify-between">
                        <Link to="/signin">
                          Sign In to Participate
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </aside>
              </div>
            </section>
          </>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}
