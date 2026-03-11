import { ArrowUpRight, Calendar, Clock, FileText, MapPin, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { YouthEvent } from "@/lib/youthCatalog";
import { fetchEventById } from "@/lib/data-api";
import { validateRegistrationForm, type RegistrationFormErrors } from "@/lib/registration-validation";
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
  const [formErrors, setFormErrors] = useState<RegistrationFormErrors>({});
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [isRegistrationConfirmOpen, setIsRegistrationConfirmOpen] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    fullName: string;
    email: string;
    contactNumber: string;
    municipality: string;
    barangay: string;
  } | null>(null);

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

  const setFormValue = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const submitRegistration = async (payload: {
    fullName: string;
    email: string;
    contactNumber: string;
    municipality: string;
    barangay: string;
  }) => {
    if (!event) return;

    setIsSubmittingRegistration(true);
    try {
      if (isProgramRecord) {
        await registerForProgram(event.id, payload);
        toast({
          title: "Program Registration Successful",
          description: `You are now registered for ${event.title}.`,
        });
      } else {
        await registerForEvent(event.id, payload);
        toast({
          title: "Registration Successful",
          description: `You are now registered for ${event.title}.`,
        });
      }
      setIsRegistrationConfirmOpen(false);
      setPendingRegistration(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit registration.";
      toast({
        title: "Registration Failed",
        description: message,
      });
    } finally {
      setIsSubmittingRegistration(false);
    }
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
    const validation = validateRegistrationForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      toast({
        title: "Registration Form Error",
        description: "Please review highlighted fields before submitting.",
      });
      return;
    }

    const normalizedForm = validation.normalized;
    setForm(normalizedForm);
    setFormErrors({});
    setPendingRegistration(normalizedForm);
    setIsRegistrationConfirmOpen(true);
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
                      {event.registrationFormUrl ? (
                        <div className="rounded-lg border bg-background px-3 py-2">
                          <p className="text-xs text-muted-foreground">Official External Registration Form</p>
                          <a
                            href={event.registrationFormUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Open Google Form
                          </a>
                        </div>
                      ) : null}
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="fullName">Name</Label>
                          <Input
                            id="fullName"
                            value={form.fullName}
                            onChange={(e) => setFormValue("fullName", e.target.value)}
                            className={formErrors.fullName ? "border-destructive focus-visible:ring-destructive/40" : ""}
                            required
                          />
                          {formErrors.fullName ? <p className="mt-1 text-xs text-destructive">{formErrors.fullName}</p> : null}
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setFormValue("email", e.target.value)}
                            className={formErrors.email ? "border-destructive focus-visible:ring-destructive/40" : ""}
                            required
                          />
                          {formErrors.email ? <p className="mt-1 text-xs text-destructive">{formErrors.email}</p> : null}
                        </div>
                        <div>
                          <Label htmlFor="contactNumber">Contact Number</Label>
                          <Input
                            id="contactNumber"
                            type="tel"
                            value={form.contactNumber}
                            onChange={(e) => setFormValue("contactNumber", e.target.value)}
                            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                            className={formErrors.contactNumber ? "border-destructive focus-visible:ring-destructive/40" : ""}
                            required
                          />
                          {formErrors.contactNumber ? <p className="mt-1 text-xs text-destructive">{formErrors.contactNumber}</p> : null}
                        </div>
                        <div>
                          <Label htmlFor="municipality">Municipality</Label>
                          <Input
                            id="municipality"
                            value={form.municipality}
                            onChange={(e) => setFormValue("municipality", e.target.value)}
                            className={formErrors.municipality ? "border-destructive focus-visible:ring-destructive/40" : ""}
                            required
                          />
                          {formErrors.municipality ? <p className="mt-1 text-xs text-destructive">{formErrors.municipality}</p> : null}
                        </div>
                        <div>
                          <Label htmlFor="barangay">Barangay</Label>
                          <Input
                            id="barangay"
                            value={form.barangay}
                            onChange={(e) => setFormValue("barangay", e.target.value)}
                            className={formErrors.barangay ? "border-destructive focus-visible:ring-destructive/40" : ""}
                            required
                          />
                          {formErrors.barangay ? <p className="mt-1 text-xs text-destructive">{formErrors.barangay}</p> : null}
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmittingRegistration}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        {isSubmittingRegistration
                          ? "Submitting..."
                          : isProgramRecord
                            ? "Review Program Registration"
                            : "Review Registration"}
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
      <AlertDialog
        open={isRegistrationConfirmOpen}
        onOpenChange={(open) => {
          if (isSubmittingRegistration) return;
          setIsRegistrationConfirmOpen(open);
          if (!open) setPendingRegistration(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isProgramRecord ? "Confirm Program Registration" : "Confirm Event Registration"}</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm the details below before completing your registration.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 rounded-lg border bg-muted/25 p-3 text-sm">
            <p><span className="text-muted-foreground">Record:</span> {event?.title ?? "N/A"}</p>
            <p><span className="text-muted-foreground">Name:</span> {pendingRegistration?.fullName ?? "-"}</p>
            <p><span className="text-muted-foreground">Email:</span> {pendingRegistration?.email ?? "-"}</p>
            <p><span className="text-muted-foreground">Contact:</span> {pendingRegistration?.contactNumber ?? "-"}</p>
            <p>
              <span className="text-muted-foreground">Location:</span>{" "}
              {pendingRegistration?.municipality ?? "-"}, {pendingRegistration?.barangay ?? "-"}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingRegistration}>Edit Details</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingRegistration || !pendingRegistration}
              onClick={(actionEvent) => {
                actionEvent.preventDefault();
                if (!pendingRegistration) return;
                void submitRegistration(pendingRegistration);
              }}
            >
              {isSubmittingRegistration
                ? "Submitting..."
                : isProgramRecord
                  ? "Confirm Program Registration"
                  : "Confirm Event Registration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
