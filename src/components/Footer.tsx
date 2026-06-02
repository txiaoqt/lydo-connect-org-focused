import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
const Footer = () => {
  return (
    <footer className="hero-gradient text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/transparency/youth-desk" className="hover:text-primary transition-colors">Youth Desk</Link></li>
              <li><Link to="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="/contacts" className="hover:text-primary transition-colors">Contacts</Link></li>
              <li><Link to="/site-map" className="hover:text-primary transition-colors">Site Map</Link></li>
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
