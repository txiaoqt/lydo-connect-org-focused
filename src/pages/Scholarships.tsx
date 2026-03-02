import { Search, Filter, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const allScholarships = [
  { title: "San Mateo Educational Grant", provider: "SMREAU", description: "Financial assistance for deserving college students residing in San Mateo, Rizal.", deadline: "April 30, 2026", amount: "PHP 10,000/semester", eligibility: "College students, San Mateo resident", status: "open" },
  { title: "SK Academic Excellence Award", provider: "LYDO", description: "Merit-based scholarship for top-performing youth in academics and leadership.", deadline: "May 15, 2026", amount: "PHP 15,000/year", eligibility: "High school or college, top 10%", status: "open" },
  { title: "YDAC Advocacy Scholarship", provider: "YDAC", description: "Support for youth actively involved in community advocacy and volunteer work.", deadline: "June 1, 2026", amount: "PHP 8,000/semester", eligibility: "Active YDAC member", status: "open" },
  { title: "Digital Skills Training Grant", provider: "LYDC", description: "Covers training costs for youth enrolling in approved digital skills programs.", deadline: "March 31, 2026", amount: "PHP 5,000", eligibility: "Ages 15-30, San Mateo resident", status: "closed" },
  { title: "Youth Leadership Fund", provider: "LYDO", description: "Financial support for youth attending national leadership conferences and summits.", deadline: "Feb 28, 2026", amount: "Up to PHP 20,000", eligibility: "SK officials or youth leaders", status: "closed" },
];

const Scholarships = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"open" | "closed">("open");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const filtered = allScholarships.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch && s.status === tab;
  });

  const handleApply = (scholarshipTitle: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to apply for scholarships.",
      });
      navigate("/signin");
      return;
    }

    navigate("/scholarships/apply", { state: { scholarshipTitle } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Scholarships</h1>
            <p className="text-secondary-foreground/70 max-w-lg mx-auto">Find and apply for educational assistance and scholarship programs available to the youth of San Mateo.</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search scholarships..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button variant={tab === "open" ? "default" : "outline"} size="sm" onClick={() => setTab("open")}>Open</Button>
                <Button variant={tab === "closed" ? "default" : "outline"} size="sm" onClick={() => setTab("closed")}>Closed</Button>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((s) => (
                  <div key={s.title} className="bg-card border border-border rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.status === "open" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {s.status === "open" ? "Open" : "Closed"}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.provider}</span>
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{s.description}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> {s.amount}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Deadline: {s.deadline}</span>
                      <p className="text-xs">Eligibility: {s.eligibility}</p>
                    </div>
                    {s.status === "open" && (
                      <Button size="sm" className="w-full" onClick={() => handleApply(s.title)}>
                        Apply Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No scholarships found</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Scholarships;
