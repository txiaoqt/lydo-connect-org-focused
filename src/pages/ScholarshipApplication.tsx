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
  scholarshipTitle?: string;
};

const ScholarshipApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const state = (location.state as LocationState | null) ?? null;
  const scholarshipTitle = state?.scholarshipTitle ?? "Selected Scholarship";

  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted",
      description: `Your application for ${scholarshipTitle} has been received.`,
    });
    setFullName("");
    setSchool("");
    setCourse("");
    navigate("/scholarships");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Scholarship Application</h1>
            <p className="text-secondary-foreground/70 max-w-xl mx-auto">Fill out this form to apply for <span className="font-semibold">{scholarshipTitle}</span>.</p>
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
                <Label htmlFor="school">School</Label>
                <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="San Mateo College" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course / Strand</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="BS Information Technology" required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/scholarships")}>Cancel</Button>
                <Button type="submit" className="w-full">Submit Application</Button>
              </div>
            </form>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default ScholarshipApplication;
