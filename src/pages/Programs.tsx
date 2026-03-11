import { Search, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgramCard from "@/components/ProgramCard";
import type { YouthProgram } from "@/lib/youthCatalog";
import { fetchPrograms } from "@/lib/data-api";

const Programs = () => {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("All");
  const [programs, setPrograms] = useState<YouthProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadPrograms = async () => {
      setIsLoadingPrograms(true);
      const data = await fetchPrograms();
      if (!mounted) return;
      setPrograms(data);
      setIsLoadingPrograms(false);
    };
    void loadPrograms();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = programs.filter((program) => {
    const matchSearch =
      program.title.toLowerCase().includes(search.toLowerCase()) ||
      program.description.toLowerCase().includes(search.toLowerCase());
    const matchSector = activeSector === "All" || program.sector === activeSector;
    return matchSearch && matchSector;
  });

  const sectorOptions = useMemo(() => {
    const dynamicSectors = Array.from(
      new Set(programs.map((program) => program.sector.trim()).filter((sector) => Boolean(sector))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All", ...dynamicSectors];
  }, [programs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Youth Programs</h1>
            <p className="text-secondary-foreground/70 max-w-2xl mx-auto">Includes core LYDO initiatives such as Hirayang Kabataan and Simula, alongside published local youth development activities.</p>
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
                {sectorOptions.map((sector) => (
                  <Button key={sector} variant={activeSector === sector ? "default" : "outline"} size="sm" onClick={() => setActiveSector(sector)}>
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            {isLoadingPrograms ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">Loading programs...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filtered.map((program) => (
                  <ProgramCard
                    key={program.id}
                    {...program}
                    recordHref={`/programs/${program.id}`}
                    showModeActions
                  />
                ))}
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
