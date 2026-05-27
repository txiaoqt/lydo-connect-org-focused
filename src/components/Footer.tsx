import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
const Footer = () => {
  return (
    <footer className="hero-gradient text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <div className="mb-4">
              <BrandLogo
                imgClassName="h-9 w-9"
                showText
                textClassName="text-sm sm:text-base text-secondary-foreground"
              />
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
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">FAQs</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/about" className="hover:text-primary transition-colors">What is LYDO Connect?</Link></li>
              <li><Link to="/programs" className="hover:text-primary transition-colors">How to join programs?</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">How to register for events?</Link></li>
              <li><Link to="/feedback" className="hover:text-primary transition-colors">Where to send concerns?</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms and privacy details</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Contacts</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Prototype Municipality, Philippines</li>
              <li>Regional LYDO coverage</li>
              <li>
                <a href="mailto:lydo@prototype-lydo.demo" className="hover:text-primary transition-colors">
                  lydo@prototype-lydo.demo
                </a>
              </li>
              <li>
                <a href="tel:+630000000000" className="hover:text-primary transition-colors">
                  +63 000 000 0000
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/50 text-center md:text-left">
            (c) 2026 LYDO Connect - Prototype LYDO Portal. Compliant with RA 10742.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-xs text-secondary-foreground/50">
            <Link to="/privacy" className="hover:text-secondary-foreground/80 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-secondary-foreground/80 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
