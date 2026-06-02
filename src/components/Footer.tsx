import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
const Footer = () => {
  return (
    <footer className="hero-gradient text-secondary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
          <div className="space-y-2.5">
            <div>
              <BrandLogo
                imgClassName="h-8 w-8 sm:h-9 sm:w-9"
                showText
                textClassName="text-sm sm:text-base text-secondary-foreground"
              />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-secondary-foreground/70">
              Empowering youth through programs, opportunities, and transparent governance in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:col-span-2 md:grid-cols-2">
            <div>
              <h4 className="mb-2.5 text-sm font-semibold text-secondary-foreground">Platform</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link to="/transparency/youth-desk" className="hover:text-primary transition-colors">Youth Desk</Link></li>
                <li><Link to="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
                <li><Link to="/contacts" className="hover:text-primary transition-colors">Contacts</Link></li>
                <li><Link to="/site-map" className="hover:text-primary transition-colors">Site Map</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2.5 text-sm font-semibold text-secondary-foreground">Transparency</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/transparency/reports" className="hover:text-primary transition-colors">Disclosure Registry</Link></li>
                <li><Link to="/transparency/board" className="hover:text-primary transition-colors">Transparency Board</Link></li>
                <li><Link to="/transparency/financial-disclosure" className="hover:text-primary transition-colors">Financial Disclosure</Link></li>
                <li><Link to="/transparency/barangay-map" className="hover:text-primary transition-colors">Barangay Map</Link></li>
                <li><Link to="/transparency/board" className="hover:text-primary transition-colors">Monthly Compliance</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-6 border-t border-secondary-foreground/10 pt-4">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <p className="text-[11px] sm:text-xs text-secondary-foreground/55 leading-relaxed">
              (c) 2026 LYDO Connect - Prototype LYDO Portal. Compliant with RA 10742.
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-secondary-foreground/55">
              <Link to="/privacy" className="hover:text-secondary-foreground/85 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-secondary-foreground/85 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
