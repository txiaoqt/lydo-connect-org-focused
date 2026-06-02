import { ArrowRight, BarChart3, Calendar, FileText, Map, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import ProgramCard from "@/components/ProgramCard";
import StatCard from "@/components/StatCard";
import heroImage from "@/assets/hero-image.png";
import { useAuth } from "@/hooks/use-auth";
import type { YouthProgram } from "@/lib/youthCatalog";
import { fetchFinancialDashboardData, fetchPrograms } from "@/lib/data-api";

const youthFeatures = [
  {
    icon: Calendar,
    title: "Programs and Events",
    description: "Discover youth programs, register for events, and track participation in one account.",
    href: "/programs",
  },
  {
    icon: Users,
    title: "Organizations",
    description: "Find LYDO-connected youth organizations, advocacy groups, and community partners.",
    href: "/organizations",
  },
  {
    icon: Users,
    title: "Advocacy Groups",
    description: "Join youth advocacy communities focused on environment, leadership, and social impact.",
    href: "/organizations",
  },
];

const transparencyFeatures = [
  {
    icon: FileText,
    title: "Transparency Reports",
    description: "Access downloadable reports and official disclosures.",
    href: "/transparency/reports",
  },
  {
    icon: BarChart3,
    title: "Financial Disclosure",
    description: "Review SK budget allocations and utilization by barangay.",
    href: "/transparency/financial-disclosure",
  },
  {
    icon: Shield,
    title: "SK Full Disclosure Board",
    description: "View board status and monthly compliance turnovers in one place.",
    href: "/transparency/board",
  },
  {
    icon: Map,
    title: "Barangay Map",
    description: "View governance and youth metrics across all barangays.",
    href: "/transparency/barangay-map",
  },
];

const Index = () => {
  const { isAuthenticated, role } = useAuth();
  const [featuredPrograms, setFeaturedPrograms] = useState<YouthProgram[]>([]);
  const [displayBudget, setDisplayBudget] = useState(0);
  const [programCount, setProgramCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [barangayCount, setBarangayCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [programs, financial] = await Promise.all([fetchPrograms(), fetchFinancialDashboardData()]);
      if (!mounted) return;
      setFeaturedPrograms(programs.slice(0, 4));
      setProgramCount(programs.length);
      const liveBudget = financial.rows.reduce((sum, row) => sum + row.skBudget, 0);
      setDisplayBudget(liveBudget);
      setParticipantCount(financial.rows.reduce((sum, row) => sum + row.participants, 0));
      setBarangayCount(financial.rows.length);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="hero-gradient relative overflow-x-clip pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-8 sm:py-10 md:py-16 lg:py-20 relative z-10">
          <div className="grid items-center gap-6 md:grid-cols-2 lg:gap-12">
            <div className="animate-fade-up">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-secondary-foreground/20 bg-secondary-foreground/10 px-3 py-1.5 mb-3 sm:mb-5">
                <span className="h-2 w-2 rounded-full bg-brand-skGold animate-pulse" />
                <span className="text-[11px] sm:text-xs font-medium text-secondary-foreground/80 truncate">Prototype Local Youth Development Offices</span>
              </div>
              <h1 className="text-[1.9rem] leading-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] font-heading font-extrabold text-secondary-foreground mb-3 sm:mb-5">
                Empowering Youth through Programs, Opportunities, and <span className="text-gradient">Transparent Governance</span>
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-secondary-foreground/75 sm:text-lg mb-4 sm:mb-7">
                A centralized digital platform connecting youth with programs, events, organizations, advocacy groups, and transparency data.
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/programs">Explore Programs <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/transparency/reports">View Transparency Portal</Link>
                </Button>
              </div>
            </div>
            <div className="animate-float order-last md:order-none">
              <img
                src={heroImage}
                alt="Youth participants in a community activity"
                className="mx-auto h-auto w-full max-w-full rounded-2xl object-contain shadow-2xl md:max-w-[560px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="stats-gradient py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-8">
            <StatCard value={participantCount.toLocaleString()} label="Youth Engaged" compact />
            <StatCard value={programCount.toLocaleString()} label="Programs" compact />
            <StatCard value={`PHP ${(displayBudget / 1000000).toFixed(1)}M`} label="Budget Transparency" compact />
            <StatCard value={barangayCount.toLocaleString()} label="Barangays Monitored" compact />
          </div>
        </div>
      </section>

      <section className="bg-background py-12 sm:py-14 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:p-8 card-shadow transition-all hover:card-shadow-hover">
              <h2 className="mb-2 text-xl font-bold sm:mb-3 sm:text-2xl">Youth Zone</h2>
              <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">Programs, events, organizations, and advocacy groups for young people.</p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {youthFeatures.map((feature) => (
                  <Link key={feature.title} to={feature.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:p-8 card-shadow transition-all hover:card-shadow-hover">
              <h2 className="mb-2 text-xl font-bold sm:mb-3 sm:text-2xl">Transparency Zone</h2>
              <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">Public reports, financial disclosure, SK compliance, and barangay monitoring.</p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {transparencyFeatures.map((feature) => (
                  <Link key={feature.title} to={feature.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-12 sm:py-14 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex flex-col items-start justify-between gap-3 md:mb-12 md:flex-row md:items-center">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-primary">Youth Opportunities</span>
              <h2 className="text-[1.55rem] font-heading font-bold text-foreground sm:text-3xl md:text-4xl">
                Programs, Events and Organizations
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/events">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {featuredPrograms.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPrograms.map((program) => (
                <ProgramCard key={program.id ?? program.title} {...program} recordHref={`/programs/${program.id}`} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground sm:p-8">
              No programs are published in Supabase yet.
            </div>
          )}
        </div>
      </section>

      <section className="bg-background py-12 sm:py-14 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-primary">Platform Features</span>
            <h2 className="mb-3 text-[1.55rem] font-heading font-bold text-foreground sm:text-3xl md:text-4xl">
              Explore what you can do
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Access youth programs, events, organization information, and transparency resources in one place.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <p className="font-semibold text-sm sm:text-base">Browse Programs and Events</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Discover available programs and upcoming youth events.</p>
            </div>
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <p className="font-semibold text-sm sm:text-base">View Youth Organizations</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Explore LYDO-related organization information, focus areas, and activities.</p>
            </div>
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <p className="font-semibold text-sm sm:text-base">Access Transparency Records</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">View public reports, disclosures, and governance-related documents.</p>
            </div>
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <p className="font-semibold text-sm sm:text-base">Check Barangay Youth Data</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Explore youth metrics and barangay-level information.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hero-gradient relative overflow-hidden py-12 sm:py-14 md:py-24">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="mb-3 text-[1.55rem] font-heading font-bold text-secondary-foreground sm:text-3xl md:text-4xl">
            LYDO Connect
          </h2>
          <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-secondary-foreground/70 sm:mb-8">
            {isAuthenticated
              ? "You are signed in. Continue exploring programs, events, organizations, and transparency records from the navigation menu."
              : "Sign in to access saved participation features, while public transparency records remain available to everyone."}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/signin">{isAuthenticated ? "Open Portal" : "Sign In"} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/transparency/reports">Open Transparency</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
