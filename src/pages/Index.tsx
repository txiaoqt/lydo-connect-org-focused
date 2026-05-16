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

      <section className="hero-gradient relative overflow-hidden pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-secondary-foreground/10 backdrop-blur-sm border border-secondary-foreground/20 rounded-full px-4 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-secondary-foreground/80">Metro Manila Local Youth Development Offices</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-secondary-foreground leading-tight mb-6">
                Empowering Youth through Programs, Opportunities, and <span className="text-gradient">Transparent Governance</span>
              </h1>
              <p className="text-lg text-secondary-foreground/75 max-w-xl mb-8 leading-relaxed">
                A centralized digital platform for Metro Manila LYDOs connecting youth with programs, events, organizations, advocacy groups, and transparency data.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/programs">Explore Programs <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <Link to="/transparency/reports">View Transparency Portal</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block animate-float">
              <img src={heroImage} alt="Metro Manila youth participants" className="rounded-2xl shadow-2xl w-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="stats-gradient py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value={participantCount.toLocaleString()} label="Youth Engaged" compact />
            <StatCard value={programCount.toLocaleString()} label="Programs" compact />
            <StatCard value={`PHP ${(displayBudget / 1000000).toFixed(1)}M`} label="Budget Transparency" compact />
            <StatCard value={barangayCount.toLocaleString()} label="Barangays Monitored" compact />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-8 card-shadow hover:card-shadow-hover transition-all">
              <h2 className="text-2xl font-bold mb-3">Youth Zone</h2>
              <p className="text-muted-foreground mb-6">Programs, events, organizations, and advocacy groups for young citizens.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {youthFeatures.map((feature) => (
                  <Link key={feature.title} to={feature.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-8 card-shadow hover:card-shadow-hover transition-all">
              <h2 className="text-2xl font-bold mb-3">Transparency Zone</h2>
              <p className="text-muted-foreground mb-6">Public reports, financial disclosure, SK compliance, and barangay monitoring.</p>
              <div className="grid sm:grid-cols-2 gap-4">
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

      <section className="py-20 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Youth Opportunities</span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Programs, Events and Organizations</h2>
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
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              No programs are published in Supabase yet.
            </div>
          )}
        </div>
      </section>

      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Role Based Access</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">One Platform, Three Active Roles</h2>
            <p className="text-muted-foreground">Guests, youth users, and SK officials each get tailored views and actions.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-5"><p className="font-semibold">Guest</p><p className="text-sm text-muted-foreground mt-1">Browse programs and transparency pages.</p></div>
            <div className="bg-card border rounded-lg p-5"><p className="font-semibold">Youth User</p><p className="text-sm text-muted-foreground mt-1">Join programs, participate in events, and connect with organizations.</p></div>
            <div className="bg-card border rounded-lg p-5"><p className="font-semibold">Barangay SK</p><p className="text-sm text-muted-foreground mt-1">Track compliance and governance data.</p></div>
          </div>
        </div>
      </section>

      <section className="hero-gradient py-20 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary-foreground mb-4">Youth Governance Transparency and Accountability System</h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            {isAuthenticated
              ? `You are signed in as ${role === "sk" ? "Barangay SK" : role}. Continue to your zone from the navigation menu.`
              : "Sign in to access role-based features while keeping all transparency data public for citizens."}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button variant="hero" size="lg" asChild>
              <Link to="/signin">Access Your Role <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
