import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgramCard from "@/components/ProgramCard";
import { youthPrograms } from "@/lib/youthCatalog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const sectors = ["All", "LYDO", "YDAC", "SK"];

const Programs = () => {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("All");
  const { isJoined, join, leave } = useUserProfile();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const filtered = youthPrograms.filter((program) => {
    const matchSearch =
      program.title.toLowerCase().includes(search.toLowerCase()) ||
      program.description.toLowerCase().includes(search.toLowerCase());
    const matchSector = activeSector === "All" || program.sector === activeSector;
    return matchSearch && matchSector;
  });

  const toggleJoin = (programId: string, programTitle: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in first to join programs and manage them in your profile.",
      });
      return;
    }

    if (isJoined("programs", programId)) {
      leave("programs", programId);
      toast({ title: "Program Left", description: `Removed ${programTitle} from your profile.` });
      return;
    }

    join("programs", programId);
    toast({ title: "Program Joined", description: `${programTitle} added to your profile.` });
  };

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
                {sectors.map((sector) => (
                  <Button key={sector} variant={activeSector === sector ? "default" : "outline"} size="sm" onClick={() => setActiveSector(sector)}>
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((program) => (
                  <ProgramCard
                    key={program.id}
                    {...program}
                    isJoined={isJoined("programs", program.id)}
                    onToggleJoin={() => toggleJoin(program.id, program.title)}
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
