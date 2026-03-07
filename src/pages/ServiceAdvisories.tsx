import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { serviceAdvisories } from "@/lib/transparencyPortalData";

const badgeStyle = (status: string) => {
  if (status === "Operational") return "bg-primary/10 text-primary";
  if (status === "Maintenance") return "bg-warning/20 text-warning-foreground";
  return "bg-muted text-muted-foreground";
};

const iconFor = (status: string) => {
  if (status === "Operational") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "Maintenance") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
};

export default function ServiceAdvisories() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-12">
          <div className="container">
            <h1 className="text-2xl md:text-4xl font-bold text-secondary-foreground">Service Reliability Advisories</h1>
            <p className="text-secondary-foreground/70 mt-2 max-w-2xl text-sm">
              System status, maintenance notices, and operational advisories for transparency services.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="space-y-4">
            {serviceAdvisories.map((item) => (
              <div key={item.id} className="bg-card border rounded-xl p-5 card-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {iconFor(item.status)}
                    <h2 className="font-semibold">{item.title}</h2>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${badgeStyle(item.status)}`}>{item.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <p className="text-xs text-muted-foreground mt-2">Updated: {item.updatedAt}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
