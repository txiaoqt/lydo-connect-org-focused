import { Calendar, Clock, FileText, Loader2, MapPin, User, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { YouthEvent } from "@/lib/youthCatalog";
import { fetchEventById } from "@/lib/data-api";
import { validateRegistrationForm, type RegistrationFormErrors } from "@/lib/registration-validation";
import { searchPhilippineLocationSuggestions, type LocationSuggestion } from "@/lib/location-autocomplete";
import LocationPreviewButton from "@/components/LocationPreviewButton";
import SourcePostEmbed from "@/components/SourcePostEmbed";

export default function EventRecord() {
  const { eventId = "", programId = "" } = useParams<{
    eventId?: string;
    programId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    fullName: string;
    email: string;
    contactNumber: string;
    municipality: string;
    barangay: string;
  } | null>(null);
  const locationSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const locationRequestControllerRef = useRef<AbortController | null>(null);

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
    if (requestedView === "registration" && !isAuthenticated) {
      setView("details");
      setIsSignInPromptOpen(true);
      return;
    }
    setView(requestedView);
  }, [isAuthenticated, recordId, requestedView]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!locationSearchContainerRef.current) return;
      if (locationSearchContainerRef.current.contains(event.target as Node)) return;
      setShowLocationSuggestions(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const query = locationSearch.trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setIsLocationSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      locationRequestControllerRef.current?.abort();
      const controller = new AbortController();
      locationRequestControllerRef.current = controller;

      setIsLocationSearching(true);
      try {
        const suggestions = await searchPhilippineLocationSuggestions(query, 6, controller.signal);
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setLocationSuggestions([]);
      } finally {
        setIsLocationSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [locationSearch]);

  useEffect(() => {
    return () => {
      locationRequestControllerRef.current?.abort();
    };
  }, []);

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
  const summaryText = event?.description?.trim() ?? "";

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

  const applyLocationSuggestion = (suggestion: LocationSuggestion) => {
    setLocationSearch(suggestion.displayName);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setForm((previous) => ({
      ...previous,
      municipality: suggestion.municipality || previous.municipality,
      barangay: suggestion.barangay || previous.barangay,
    }));
    setFormErrors((previous) => ({
      ...previous,
      municipality: undefined,
      barangay: undefined,
    }));
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

  const handleTabChange = (nextView: "details" | "registration") => {
    if (nextView === "registration" && !isAuthenticated) {
      setIsSignInPromptOpen(true);
      return;
    }
    setView(nextView);
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
            <section className="hero-gradient py-12 md:py-14">
              <div className="container">
                <div className="max-w-4xl space-y-4">
                  <p className="text-secondary-foreground/75 text-sm font-medium">{isProgramRecord ? "Program Record" : "Event Record"}</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground leading-tight">{event.title}</h1>
                  {summaryText ? (
                    <p className="text-secondary-foreground/80 text-base leading-relaxed max-w-3xl line-clamp-3">
                      {summaryText}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary-foreground/95 text-primary">
                      {event.sector}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary-foreground/20 text-secondary-foreground capitalize border border-secondary-foreground/25">
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="container py-8 md:py-10">
              <div className="grid gap-5 lg:gap-6 xl:grid-cols-5 items-start">
                <div className="xl:col-span-3 bg-card border rounded-xl p-5 md:p-6 card-shadow min-w-0">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Official Source Post</h2>
                    {event.sourcePostUrl ? (
                      <SourcePostEmbed sourcePostUrl={event.sourcePostUrl} title={event.title} />
                    ) : (
                      <div className="rounded-xl border bg-muted/25 p-5 text-sm text-muted-foreground">
                        No source post URL was provided for this record.
                      </div>
                    )}
                  </div>
                </div>

                <aside className="xl:col-span-2 space-y-4 xl:sticky xl:top-24">
                  <div className="bg-card border rounded-xl p-1.5 card-shadow">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTabChange("details")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          view === "details"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          Details
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("registration")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          view === "registration"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          Registration
                        </span>
                      </button>
                    </div>
                  </div>

                  {view === "details" ? (
                    <div className="bg-card border rounded-xl p-5 md:p-6 card-shadow space-y-5">
                      <div className="space-y-2">
                        <p className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          Event Details
                        </p>
                        <h2 className="text-xl font-bold leading-tight">{event.sourcePostUrl ? "Local Summary" : "Description"}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {event.description.trim() || "No summary was provided for this record."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="rounded-lg border bg-muted/20 p-3.5 min-h-[92px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{recordTypeLabel}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3.5 min-h-[92px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{sourceTypeLabel}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3.5 min-h-[92px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{event.date || "TBA"}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3.5 min-h-[92px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
                          <p className="text-sm font-semibold text-foreground mt-1">{event.time || "TBA"}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3.5">
                        <div className="min-w-0 w-full">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Location</p>
                          <LocationPreviewButton
                            location={event.location}
                            locationLatitude={event.locationLatitude}
                            locationLongitude={event.locationLongitude}
                            className="text-sm font-semibold"
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Tip: click the location to open map preview and directions.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !registered ? (
                    <form onSubmit={handleRegister} className="bg-card border rounded-xl p-5 md:p-6 card-shadow bg-muted/20 space-y-4">
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
                        <div ref={locationSearchContainerRef} className="relative">
                          <Label htmlFor="locationSearch">Location Search (Optional)</Label>
                          <div className="relative">
                            <Input
                              id="locationSearch"
                              value={locationSearch}
                              onChange={(e) => {
                                setLocationSearch(e.target.value);
                                setShowLocationSuggestions(true);
                              }}
                              placeholder="Type place or address for smart suggestions"
                              className="pr-9"
                              autoComplete="off"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {isLocationSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Selecting a suggestion can auto-fill Municipality and Barangay.
                          </p>
                          {showLocationSuggestions ? (
                            locationSuggestions.length > 0 ? (
                              <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
                                {locationSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    type="button"
                                    onClick={() => applyLocationSuggestion(suggestion)}
                                    className="w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                                  >
                                    <p className="line-clamp-1 font-medium text-foreground">{suggestion.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {suggestion.barangay || "Barangay N/A"} | {suggestion.municipality || "Municipality N/A"}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            ) : locationSearch.trim().length >= 3 && !isLocationSearching ? (
                              <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
                                No location suggestions found.
                              </div>
                            ) : null
                          ) : null}
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
                    <div className="bg-card border rounded-xl p-5 md:p-6 card-shadow bg-primary/5">
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
      <Dialog open={isSignInPromptOpen} onOpenChange={setIsSignInPromptOpen}>
        <DialogContent className="max-w-sm border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Sign in required</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sign in first to registration
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setIsSignInPromptOpen(false);
              navigate("/signin");
            }}
          >
            Sign In
          </Button>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
