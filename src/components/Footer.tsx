import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="hero-gradient text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-lg">L</span>
              </div>
              <span className="font-heading font-bold text-lg text-secondary-foreground">
                LYDO Connect
              </span>
            </div>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Empowering Filipino youth through centralized access to programs, events, and scholarships.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/programs" className="hover:text-primary transition-colors">Programs</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">Events</Link></li>
              <li><Link to="/scholarships" className="hover:text-primary transition-colors">Scholarships</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About LYDO</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Sectors</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>LYDO</li>
              <li>LYDC</li>
              <li>YDAC</li>
              <li>Educational Assistance</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-secondary-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Municipality of San Mateo</li>
              <li>Rizal, Philippines</li>
              <li>lydo@sanmateo.gov.ph</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/50">
            © 2026 LYDO Connect — Municipality of San Mateo, Rizal. Compliant with RA 10742.
          </p>
          <div className="flex gap-6 text-xs text-secondary-foreground/50">
            <span className="hover:text-secondary-foreground/80 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-secondary-foreground/80 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
