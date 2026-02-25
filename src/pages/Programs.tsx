import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgramCard from "@/components/ProgramCard";

const allPrograms = [
  { title: "Youth Leadership Summit 2026", sector: "LYDO", description: "A three-day intensive leadership development program for aspiring youth leaders in San Mateo.", date: "March 15-17, 2026", location: "San Mateo Town Hall", type: "program" as const },
  { title: "Digital Skills Training Program", sector: "LYDC", description: "Free workshops on web development, graphic design, and digital marketing for Filipino youth.", date: "Ongoing", location: "LYDO Office", type: "program" as const },
  { title: "Environmental Youth Advocates", sector: "YDAC", description: "Join the movement to protect and preserve the natural resources of Rizal province.", date: "Year-round", location: "Various", type: "program" as const },
  { title: "Youth Health & Wellness Program", sector: "LYDO", description: "Mental health awareness, sports activities, and wellness workshops for the youth of San Mateo.", date: "Monthly", location: "Municipal Gym", type: "program" as const },
  { title: "Community Clean-Up Drive", sector: "YDAC", description: "Organized clean-up activities across barangays to promote environmental stewardship.", date: "Every Saturday", location: "Rotating Barangays", type: "program" as const },
  { title: "Youth Entrepreneurship Bootcamp", sector: "LYDC", description: "Learn business basics, create your pitch, and get mentored by local entrepreneurs.", date: "June 2026", location: "San Mateo Business Center", type: "program" as const },
];

const sectors = ["All", "LYDO", "LYDC", "YDAC"];

const Programs = () => {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("All");

  const filtered = allPrograms.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchSector = activeSector === "All" || p.sector === activeSector;
    return matchSearch && matchSector;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Youth Programs</h1>
            <p className="text-secondary-foreground/70 max-w-lg mx-auto">Discover programs designed to empower, educate, and engage the youth of San Mateo, Rizal.</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                {sectors.map((s) => (
                  <Button key={s} variant={activeSector === s ? "default" : "outline"} size="sm" onClick={() => setActiveSector(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => <ProgramCard key={p.title} {...p} />)}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No programs found</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Programs;
