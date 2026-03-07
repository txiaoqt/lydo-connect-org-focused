import { Search, Filter, Calendar, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { youthEvents } from "@/lib/youthCatalog";
import { useUserProfile } from "@/hooks/use-user-profile";

const Events = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "past">("all");
  const { isJoined } = useUserProfile();

  const filtered = youthEvents.filter((event) => {
    const matchSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" ? true : event.status === tab;
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Events</h1>
            <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
              Official LYDO event and activity highlights from municipal public announcements, including completed youth programs.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button variant={tab === "all" ? "default" : "outline"} size="sm" onClick={() => setTab("all")}>All</Button>
                <Button variant={tab === "past" ? "default" : "outline"} size="sm" onClick={() => setTab("past")}>Past</Button>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => {
                  const registered = isJoined("events", event.id);
                  return (
                    <div key={event.id} className="bg-card border border-border rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 group">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground capitalize">{event.status}</span>
                        <span className="text-xs text-muted-foreground">{event.sector}</span>
                        {registered && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">Registered</span>}
                      </div>
                      <h3 className="font-heading font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{event.description}</p>
                      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {event.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                      </div>
                      {event.sourcePostUrl && (
                        <a href={event.sourcePostUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mb-4">
                          Source Post
                        </a>
                      )}
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link to={`/events/${event.id}`}>View Event Record</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-40" />
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
