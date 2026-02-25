import { Search, Filter, Calendar, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const allEvents = [
  { title: "Youth Leadership Summit 2026", sector: "LYDO", description: "A three-day intensive leadership development program for aspiring youth leaders.", date: "March 15-17, 2026", time: "8:00 AM - 5:00 PM", location: "San Mateo Town Hall", status: "upcoming" },
  { title: "Barangay Sports Fest", sector: "LYDO", description: "Inter-barangay sports competition featuring basketball, volleyball, and athletics.", date: "April 5-7, 2026", time: "7:00 AM - 6:00 PM", location: "Municipal Gym", status: "upcoming" },
  { title: "Career Guidance Seminar", sector: "LYDC", description: "Industry professionals share insights on career paths and opportunities for the youth.", date: "April 20, 2026", time: "1:00 PM - 5:00 PM", location: "LYDO Office", status: "upcoming" },
  { title: "Environmental Awareness Day", sector: "YDAC", description: "Tree planting, river clean-up, and eco-education workshops.", date: "May 5, 2026", time: "6:00 AM - 12:00 PM", location: "Marikina River Park", status: "upcoming" },
  { title: "SK Summit 2025", sector: "LYDO", description: "Annual summit bringing together SK leaders from across San Mateo.", date: "Dec 10, 2025", time: "9:00 AM - 4:00 PM", location: "San Mateo Town Hall", status: "past" },
  { title: "Youth Day Celebration", sector: "LYDO", description: "Celebrating National Youth Day with performances, awards, and community activities.", date: "Aug 12, 2025", time: "All Day", location: "Municipal Plaza", status: "past" },
];

const Events = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const filtered = allEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch && e.status === tab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4">Events</h1>
            <p className="text-secondary-foreground/70 max-w-lg mx-auto">Stay updated with upcoming youth events and activities in San Mateo.</p>
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
                <Button variant={tab === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setTab("upcoming")}>Upcoming</Button>
                <Button variant={tab === "past" ? "default" : "outline"} size="sm" onClick={() => setTab("past")}>Past</Button>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <div key={event.title} className="bg-card border border-border rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">{event.status === "upcoming" ? "Upcoming" : "Completed"}</span>
                      <span className="text-xs text-muted-foreground">{event.sector}</span>
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{event.description}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {event.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                    </div>
                    {event.status === "upcoming" && <Button size="sm" className="w-full">Register Now</Button>}
                  </div>
                ))}
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
