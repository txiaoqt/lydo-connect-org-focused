import { Calendar, Clock, MapPin, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getEventById } from "@/lib/youthCatalog";

export default function EventRecord() {
  const { eventId = "" } = useParams();
  const event = getEventById(eventId);
  const { isAuthenticated } = useAuth();
  const { profile, isJoined, leave, registerForEvent, getEventRegistration } = useUserProfile();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    municipality: "",
    barangay: "",
  });

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const registered = isJoined("events", event.id);
  const registrationInfo = getEventRegistration(event.id);

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

  const handleUnregister = () => {
    leave("events", event.id);
    toast({
      title: "Registration Removed",
      description: `You are no longer registered for ${event.title}.`,
    });
  };

  const handleRegister = (eventForm: React.FormEvent) => {
    eventForm.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in first to register and manage this event from your profile.",
      });
      return;
    }
    if (!form.fullName || !form.email || !form.contactNumber || !form.municipality || !form.barangay) {
      toast({ title: "Incomplete Form", description: "Please complete all registration fields." });
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
        <section className="hero-gradient py-14">
          <div className="container">
            <p className="text-secondary-foreground/70 text-sm mb-3">Event Record</p>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground max-w-4xl">{event.title}</h1>
          </div>
        </section>

        <section className="container py-10">
          <div className="max-w-3xl bg-card border rounded-xl p-7 card-shadow">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">{event.sector}</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground capitalize">{event.status}</span>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>

            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {event.time}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="outline" asChild>
                <Link to="/events">Back to Events</Link>
              </Button>
              {isAuthenticated && (
                <Button variant="outline" asChild>
                  <Link to="/profile">Go to Profile</Link>
                </Button>
              )}
            </div>

            {!registered ? (
              <form onSubmit={handleRegister} className="border rounded-lg p-5 bg-muted/20 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Event Registration Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
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
                    <Input id="contactNumber" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="municipality">Municipality</Label>
                    <Input id="municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Input id="barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} required />
                  </div>
                </div>
                <Button type="submit">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Confirm Registration
                </Button>
              </form>
            ) : (
              <div className="border rounded-lg p-5 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-2">Registered Participant</p>
                <p className="font-medium">{registrationInfo?.fullName ?? form.fullName}</p>
                <p className="text-sm text-muted-foreground">{registrationInfo?.email ?? form.email}</p>
                <p className="text-sm text-muted-foreground">{registrationInfo?.contactNumber ?? form.contactNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {registrationInfo?.municipality ?? form.municipality}, {registrationInfo?.barangay ?? form.barangay}
                </p>
                <Button variant="outline" className="mt-4" onClick={handleUnregister}>
                  Cancel Registration
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
