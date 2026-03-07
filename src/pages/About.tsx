import { Users, Target, Heart, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary-foreground mb-6">About Youth Governance Transparency and Accountability System</h1>
            <p className="text-secondary-foreground/70 text-lg leading-relaxed">
              Youth Governance Transparency and Accountability System is a centralized digital platform developed for the Municipality of San Mateo, Rizal to consolidate youth programs, events, and organizations while improving information dissemination and transparency.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">The Problem</span>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">Why Youth Governance Transparency and Accountability System?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Youth programs in San Mateo are promoted across fragmented channels — separate Facebook pages, Messenger groups, and face-to-face assemblies. This makes it difficult for youth to discover opportunities, coordinate participation, or access program information efficiently.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Youth Governance Transparency and Accountability System solves this by providing a single, searchable, role-based platform that connects youth with programs, events, organizations, and transparency services offered by LYDO and partner youth groups.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FeatureCard icon={Users} title="5,000+" description="Youth engaged across San Mateo" />
                <FeatureCard icon={Target} title="120+" description="Programs and initiatives offered" />
                <FeatureCard icon={Heart} title="45" description="Active advocacy groups" />
                <FeatureCard icon={Award} title="16" description="Barangays monitored for accountability" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block text-center">Our Sectors</span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-8 text-center">Who We Serve</h2>
              <div className="space-y-6">
                {[
                  { name: "LYDO", full: "Local Youth Development Office", desc: "The central coordinating body responsible for youth development policies, programs, and services in the municipality." },
                  { name: "LYDC", full: "Local Youth Development Council", desc: "An advisory council that ensures youth representation in local governance and policymaking." },
                  { name: "YDAC", full: "Youth Development Advocates Circle", desc: "Advocacy groups composed of young volunteers driving causes from environment and education to health and culture." },
                  { name: "SK Network", full: "Sangguniang Kabataan ng San Mateo", desc: "Barangay youth governance network aligned with LYDO accountability and youth participation programs." },
                ].map((sector) => (
                  <div key={sector.name} className="bg-card border border-border rounded-xl p-6 card-shadow">
                    <h3 className="font-heading font-semibold text-foreground text-lg">{sector.name} — <span className="text-primary">{sector.full}</span></h3>
                    <p className="text-muted-foreground text-sm mt-2">{sector.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-3xl mx-auto mt-20 text-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">Legal Basis</span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">RA 10742 Compliant</h2>
              <p className="text-muted-foreground leading-relaxed">
                Youth Governance Transparency and Accountability System is designed in compliance with Republic Act 10742 (Sangguniang Kabataan Reform Act of 2015), ensuring that youth governance tools are standardized, scalable, and adaptable for implementation by other Local Youth Development Offices nationwide.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default About;
