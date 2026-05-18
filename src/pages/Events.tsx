import { Search, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgramCard from "@/components/ProgramCard";
import type { YouthEvent } from "@/lib/youthCatalog";
import { fetchEvents } from "@/lib/data-api";
import { useUserProfile } from "@/hooks/use-user-profile";

const Events = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "past">("all");
  const [events, setEvents] = useState<YouthEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const { isJoined } = useUserProfile();

  useEffect(() => {
    let mounted = true;
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      const data = await fetchEvents();
      if (!mounted) return;
      setEvents(data);
      setIsLoadingEvents(false);
    };
    void loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = events.filter((event) => {
    const matchSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" ? true : event.status === tab;
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-[1.9rem] sm:text-4xl md:text-5xl font-heading font-bold text-secondary-foreground mb-3 sm:mb-4">Events</h1>
            <p className="text-sm sm:text-base text-secondary-foreground/70 max-w-xl md:max-w-2xl mx-auto leading-relaxed">
              Official LYDO event and activity highlights from municipal public announcements, including completed youth programs.
            </p>
          </div>
        </section>

        <section className="py-6 sm:py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 sm:h-11 text-sm" />
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button variant={tab === "all" ? "default" : "outline"} size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => setTab("all")}>All</Button>
                <Button variant={tab === "past" ? "default" : "outline"} size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => setTab("past")}>Past</Button>
              </div>
            </div>

            {isLoadingEvents ? (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <p className="text-sm">Loading events...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 items-stretch">
                {filtered.map((event) => {
                  const registered = isJoined("events", event.id);
                  return (
                    <ProgramCard
                      key={event.id}
                      title={event.title}
                      sector={event.sector}
                      description={event.description}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                      locationLatitude={event.locationLatitude}
                      locationLongitude={event.locationLongitude}
                      type={event.recordKind === "program" ? "program" : "event"}
                      sourcePostUrl={event.sourcePostUrl}
                      recordHref={`/events/${event.id}`}
                      showModeActions
                      isJoined={registered}
                      joinedLabel="Registered"
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <Filter className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-40" />
                <p className="text-lg font-medium">No events found</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Events;
