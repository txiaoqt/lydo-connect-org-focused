import { ArrowRight, Users, Calendar, GraduationCap, Search, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import ProgramCard from "@/components/ProgramCard";
import StatCard from "@/components/StatCard";
import heroImage from "@/assets/hero-image.png";

const features = [
  {
    icon: Search,
    title: "Centralized Portal",
    description: "One platform for all youth programs, events, and scholarships across LYDO sectors.",
  },
  {
    icon: Users,
    title: "Advocacy Groups",
    description: "Discover and join YDAC advocacy groups aligned with your passions and causes.",
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Browse upcoming events, register online, and track your participation history.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship Finder",
    description: "Search and apply for educational assistance through the San Mateo scholarship portal.",
  },
  {
    icon: BarChart3,
    title: "Participation Tracking",
    description: "Monitor your engagement across programs and build your volunteer portfolio.",
  },
  {
    icon: Shield,
    title: "RA 10742 Compliant",
    description: "Built to support the SK Reform Act with scalable, standardized youth governance tools.",
  },
];

const samplePrograms = [
  {
    title: "Youth Leadership Summit 2026",
    sector: "LYDO",
    description: "A three-day intensive leadership development program for aspiring youth leaders in San Mateo.",
    date: "March 15-17, 2026",
    location: "San Mateo Town Hall",
    type: "event" as const,
  },
  {
    title: "Digital Skills Training Program",
    sector: "LYDC",
    description: "Free workshops on web development, graphic design, and digital marketing for Filipino youth.",
    date: "Ongoing",
    location: "LYDO Office",
    type: "program" as const,
  },
  {
    title: "San Mateo Educational Grant",
    sector: "Educational Assistance",
    description: "Financial assistance for deserving college students residing in San Mateo, Rizal.",
    date: "April 1-30, 2026",
    type: "scholarship" as const,
  },
  {
    title: "Environmental Youth Advocates",
    sector: "YDAC",
    description: "Join the movement to protect and preserve the natural resources of Rizal province.",
    date: "Year-round",
    location: "Various",
    type: "program" as const,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-secondary-foreground/10 backdrop-blur-sm border border-secondary-foreground/20 rounded-full px-4 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-secondary-foreground/80">
                  Municipality of San Mateo, Rizal
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-secondary-foreground leading-tight mb-6">
                Empowering Youth,{" "}
                <span className="text-gradient">One Connection</span>{" "}
                at a Time
              </h1>

              <p className="text-lg text-secondary-foreground/70 max-w-lg mb-8 leading-relaxed">
                LYDO Connect is your centralized portal for youth programs, events, scholarships, and advocacy groups — all in one place.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="lg">
                  Explore Programs <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="heroOutline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>

            <div className="hidden md:block animate-float">
              <img
                src={heroImage}
                alt="Filipino youth volunteers collaborating together"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="5,000+" label="Youth Engaged" />
            <StatCard value="120+" label="Programs Offered" />
            <StatCard value="45" label="Advocacy Groups" />
            <StatCard value="300+" label="Scholarships Granted" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Everything Youth Need in One Place
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              From discovering programs to tracking participation, LYDO Connect streamlines youth engagement for the Municipality of San Mateo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Programs & Events */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">
                Opportunities
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Programs, Events & Scholarships
              </h2>
            </div>
            <Button variant="outline">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {samplePrograms.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">
              Our Sectors
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Serving the Youth of San Mateo
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "LYDO", full: "Local Youth Development Office", desc: "The central coordinating body for youth programs and policies." },
              { name: "LYDC", full: "Local Youth Development Council", desc: "Advisory council ensuring youth representation in governance." },
              { name: "YDAC", full: "Youth Development Advocates Circle", desc: "Advocacy groups driving causes from environment to education." },
              { name: "SMREAU", full: "Educational Assistance Unit", desc: "Scholarship and financial assistance for deserving students." },
            ].map((sector) => (
              <div key={sector.name} className="bg-card border border-border rounded-xl p-6 text-center card-shadow hover:card-shadow-hover transition-all duration-300 group">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="font-heading font-bold text-primary text-lg">{sector.name.charAt(0)}</span>
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1">{sector.name}</h3>
                <p className="text-xs text-primary mb-2">{sector.full}</p>
                <p className="text-muted-foreground text-sm">{sector.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary-foreground mb-4">
            Ready to Get Involved?
          </h2>
          <p className="text-secondary-foreground/70 max-w-lg mx-auto mb-8 leading-relaxed">
            Join thousands of youth in San Mateo making a difference. Sign up now and start your journey with LYDO Connect.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button variant="hero" size="lg">
              Create Account <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="heroOutline" size="lg">
              Contact LYDO
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
