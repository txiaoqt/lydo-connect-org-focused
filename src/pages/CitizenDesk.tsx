import { useEffect, useMemo, useState } from "react";
import { Clock3, MessageSquareWarning, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyCitizenTickets,
  fetchTicketTypeOptions,
  submitCitizenTicket,
  trackCitizenTicket,
  type TicketTypeOption,
} from "@/lib/data-api";

type TicketStatus = "received" | "in_progress" | "resolved" | "closed";
type CitizenTicketItem = {
  id: string;
  referenceNo: string;
  type: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
};

const formatStatus = (value: TicketStatus | string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function CitizenDesk() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [ticketOptions, setTicketOptions] = useState<TicketTypeOption[]>([]);
  const [tickets, setTickets] = useState<CitizenTicketItem[]>([]);
  const [type, setType] = useState<TicketTypeOption | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [searchTicketId, setSearchTicketId] = useState("");
  const [searchTicketEmail, setSearchTicketEmail] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setSearchTicketEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      const options = await fetchTicketTypeOptions();
      if (!mounted) return;
      setTicketOptions(options);
      setType(options[0] ?? "");

      if (isAuthenticated && user?.id) {
        const myTickets = await fetchMyCitizenTickets(user.id);
        if (!mounted) return;
        setTickets(
          myTickets.map((ticket) => ({
            id: ticket.id,
            referenceNo: ticket.referenceNo,
            type: ticket.type,
            subject: ticket.subject,
            status: ticket.status as TicketStatus,
            createdAt: ticket.createdAt,
          })),
        );
      } else {
        setTickets([]);
      }
      setIsLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!type) {
      toast({
        title: "Missing Ticket Type",
        description: "No ticket type is configured in Supabase yet.",
      });
      return;
    }
    try {
      const created = await submitCitizenTicket({
        type,
        subject,
        message,
        email,
        userId: user?.id ?? null,
      });

      const item: CitizenTicketItem = {
        id: created.id,
        referenceNo: created.reference_no,
        type,
        subject,
        status: created.status as TicketStatus,
        createdAt: created.created_at,
      };

      setTickets((prev) => [item, ...prev].slice(0, 10));
      toast({
        title: "Ticket Submitted",
        description: `Your reference number is ${created.reference_no}.`,
      });
      setSubject("");
      setMessage("");
      if (!isAuthenticated) setEmail("");
      setType(ticketOptions[0] ?? "");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Unable to submit ticket right now.",
      });
    }
  };

  const [trackedTicket, setTrackedTicket] = useState<{
    reference_no: string;
    ticket_type: string;
    subject: string;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const runTrack = async () => {
      if (!searchTicketId.trim() || !searchTicketEmail.trim()) {
        setTrackedTicket(null);
        return;
      }
      const result = await trackCitizenTicket(searchTicketId.trim(), searchTicketEmail.trim());
      if (!mounted) return;
      setTrackedTicket(result as typeof trackedTicket);
    };
    void runTrack();
    return () => {
      mounted = false;
    };
  }, [searchTicketEmail, searchTicketId]);

  const localMatch = useMemo(
    () =>
      tickets.find((ticket) => ticket.referenceNo.toLowerCase() === searchTicketId.trim().toLowerCase()),
    [searchTicketId, tickets],
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
            {ticketOptions.length === 0 && (
              <p className="text-sm text-warning-foreground bg-warning/10 border border-warning/40 rounded-md p-3">
                No ticket types found. Insert rows into `ticket_types` first.
              </p>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Request Type</label>
              <Select value={type} onValueChange={(value: TicketTypeOption) => setType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ticketOptions.map((item) => (
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
            <Button type="submit" disabled={ticketOptions.length === 0}>Submit Ticket</Button>
          </form>

          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-6 card-shadow space-y-3">
              <h2 className="text-xl font-semibold">Track Ticket</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Enter reference ID (e.g. LYDO-123456)" value={searchTicketId} onChange={(e) => setSearchTicketId(e.target.value)} />
              </div>
              <Input
                placeholder="Enter requester email used on ticket"
                type="email"
                value={searchTicketEmail}
                onChange={(e) => setSearchTicketEmail(e.target.value)}
              />

              {(searchTicketId || searchTicketEmail) && (
                <div className="rounded-lg border p-4 bg-muted/20 text-sm">
                  {trackedTicket ? (
                    <>
                      <p className="font-semibold">{trackedTicket.reference_no}</p>
                      <p className="text-muted-foreground">{trackedTicket.ticket_type}</p>
                      <p className="text-muted-foreground">{trackedTicket.subject}</p>
                      <p className="mt-2 inline-flex items-center gap-2 font-medium">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Status: {formatStatus(trackedTicket.status)}
                      </p>
                    </>
                  ) : localMatch ? (
                    <>
                      <p className="font-semibold">{localMatch.referenceNo}</p>
                      <p className="text-muted-foreground">{localMatch.type}</p>
                      <p className="text-muted-foreground">{localMatch.subject}</p>
                      <p className="mt-2 inline-flex items-center gap-2 font-medium">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Status: {formatStatus(localMatch.status)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No ticket found for this reference/email pair.</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6 card-shadow">
              <h2 className="text-lg font-semibold mb-3">Recent Tickets</h2>
              <div className="space-y-3 text-sm">
                {isLoading ? (
                  <p className="text-muted-foreground">Loading tickets...</p>
                ) : tickets.length > 0 ? (
                  tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="border rounded-md p-3">
                      <p className="font-medium">{ticket.referenceNo}</p>
                      <p className="text-muted-foreground">{ticket.type} • {new Date(ticket.createdAt).toISOString().slice(0, 10)}</p>
                      <p className="inline-flex items-center gap-1 mt-1">
                        <MessageSquareWarning className="h-3.5 w-3.5 text-primary" />
                        {formatStatus(ticket.status)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No tickets submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
