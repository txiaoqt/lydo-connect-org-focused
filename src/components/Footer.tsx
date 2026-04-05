import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const { toast } = useToast();

  return (
    <footer className="hero-gradient text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-start gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xs tracking-tight">YG</span>
              </div>
              <span className="font-heading font-bold text-sm sm:text-base text-secondary-foreground leading-tight">
                Youth Governance Transparency and Accountability System
              </span>
            </div>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Empowering youth through programs, opportunities, and transparent governance in one platform.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/programs" className="hover:text-primary transition-colors">Programs</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">Events</Link></li>
              <li><Link to="/organizations" className="hover:text-primary transition-colors">Organizations</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">Platform Overview</Link></li>
              <li><Link to="/feedback" className="hover:text-primary transition-colors">Citizen Desk</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Transparency</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/transparency/reports" className="hover:text-primary transition-colors">Disclosure Registry</Link></li>
              <li><Link to="/transparency/board" className="hover:text-primary transition-colors">Transparency Board</Link></li>
              <li><Link to="/transparency/financial-disclosure" className="hover:text-primary transition-colors">Financial Disclosure</Link></li>
              <li><Link to="/transparency/barangay-map" className="hover:text-primary transition-colors">Barangay Map</Link></li>
              <li><Link to="/transparency/board" className="hover:text-primary transition-colors">Monthly Compliance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Metro Manila, Philippines</li>
              <li>Regional LYDO coverage</li>
              <li>
                <a href="mailto:lydo@metro-manila.gov.ph" className="hover:text-primary transition-colors">
                  lydo@metro-manila.gov.ph
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/50 text-center md:text-left">
            (c) 2026 Youth Governance Transparency and Accountability System - Metro Manila LYDOs. Compliant with RA 10742.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-xs text-secondary-foreground/50">
            <button
              type="button"
              className="hover:text-secondary-foreground/80 transition-colors"
              onClick={() =>
                toast({
                  title: "Privacy Policy",
                  description: "This page is coming soon.",
                })
              }
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="hover:text-secondary-foreground/80 transition-colors"
              onClick={() =>
                toast({
                  title: "Terms of Service",
                  description: "This page is coming soon.",
                })
              }
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
