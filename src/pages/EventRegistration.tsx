import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type LocationState = {
  eventTitle?: string;
};

const EventRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const state = (location.state as LocationState | null) ?? null;
  const eventTitle = state?.eventTitle ?? "Selected Event";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration Submitted",
      description: `You are registered for ${eventTitle}.`,
    });
    setFullName("");
    setEmail("");
    setContact("");
    navigate("/events");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Event Registration</h1>
            <p className="text-secondary-foreground/70 max-w-xl mx-auto">Complete the form below to register for <span className="font-semibold">{eventTitle}</span>.</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-xl">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 card-shadow space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="09XXXXXXXXX" required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/events")}>Cancel</Button>
                <Button type="submit" className="w-full">Submit Registration</Button>
              </div>
            </form>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default EventRegistration;
