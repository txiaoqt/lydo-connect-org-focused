import { useEffect, useMemo, useState } from "react";
import { Clock3, MessageSquareWarning, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ticketTypes, TicketType } from "@/lib/transparencyPortalData";
import { useToast } from "@/hooks/use-toast";

type TicketStatus = "Received" | "In Progress" | "Resolved" | "Closed";
type CitizenTicket = {
  id: string;
  createdAt: string;
  type: TicketType;
  subject: string;
  message: string;
  email: string;
  status: TicketStatus;
};

const STORAGE_KEY = "lydo_citizen_tickets";

const readTickets = (): CitizenTicket[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CitizenTicket[];
  } catch {
    return [];
  }
};

export default function CitizenDesk() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<CitizenTicket[]>([]);
  const [type, setType] = useState<TicketType>("Information Request");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [searchTicketId, setSearchTicketId] = useState("");

  useEffect(() => {
    setTickets(readTickets());
  }, []);

  const persistTickets = (next: CitizenTicket[]) => {
    setTickets(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = `LYDO-${Date.now().toString().slice(-6)}`;
    const item: CitizenTicket = {
      id,
      createdAt: new Date().toISOString().slice(0, 10),
      type,
      subject,
      message,
      email,
      status: "Received",
    };
    persistTickets([item, ...tickets]);
    toast({
      title: "Ticket Submitted",
      description: `Your reference number is ${id}.`,
    });
    setSubject("");
    setMessage("");
    setEmail("");
    setType("Information Request");
  };

  const trackedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id.toLowerCase() === searchTicketId.trim().toLowerCase()),
    [tickets, searchTicketId],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-12">
          <div className="container">
            <h1 className="text-2xl md:text-4xl font-bold text-secondary-foreground">Citizen Desk (FOI / Ugnayan)</h1>
            <p className="text-secondary-foreground/70 mt-2 max-w-2xl text-sm">
              File information requests, complaints, suggestions, and service requests with reference IDs and status tracking.
            </p>
          </div>
        </section>

        <section className="container py-8 grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 card-shadow space-y-4">
            <h2 className="text-xl font-semibold">Submit Ticket</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Request Type</label>
              <Select value={type} onValueChange={(value: TicketType) => setType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Details</label>
              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <Button type="submit">Submit Ticket</Button>
          </form>

          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-6 card-shadow space-y-3">
              <h2 className="text-xl font-semibold">Track Ticket</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Enter reference ID (e.g. LYDO-123456)" value={searchTicketId} onChange={(e) => setSearchTicketId(e.target.value)} />
              </div>
              {searchTicketId && (
                <div className="rounded-lg border p-4 bg-muted/20 text-sm">
                  {trackedTicket ? (
                    <>
                      <p className="font-semibold">{trackedTicket.id}</p>
                      <p className="text-muted-foreground">{trackedTicket.type}</p>
                      <p className="text-muted-foreground">{trackedTicket.subject}</p>
                      <p className="mt-2 inline-flex items-center gap-2 font-medium">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Status: {trackedTicket.status}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No ticket found for this reference.</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6 card-shadow">
              <h2 className="text-lg font-semibold mb-3">Recent Tickets</h2>
              <div className="space-y-3 text-sm">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="border rounded-md p-3">
                    <p className="font-medium">{ticket.id}</p>
                    <p className="text-muted-foreground">{ticket.type} • {ticket.createdAt}</p>
                    <p className="inline-flex items-center gap-1 mt-1">
                      <MessageSquareWarning className="h-3.5 w-3.5 text-primary" />
                      {ticket.status}
                    </p>
                  </div>
                ))}
                {tickets.length === 0 && <p className="text-muted-foreground">No tickets submitted yet.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
