import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contacts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-10 sm:py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-[1.9rem] sm:text-4xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4 sm:mb-6">
              Contact Information
            </h1>
            <p className="text-secondary-foreground/70 text-sm sm:text-base md:text-lg leading-relaxed">
              Reach out to the LYDO team for support, coordination, and youth services.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-card border border-border rounded-xl p-5 sm:p-7 card-shadow space-y-4">
              <div>
                <h2 className="text-sm uppercase tracking-widest text-primary font-semibold">Office</h2>
                <p className="text-foreground mt-1">Prototype Municipality, Philippines</p>
              </div>
              <div>
                <h2 className="text-sm uppercase tracking-widest text-primary font-semibold">Coverage</h2>
                <p className="text-foreground mt-1">Regional LYDO services and partner youth sectors</p>
              </div>
              <div>
                <h2 className="text-sm uppercase tracking-widest text-primary font-semibold">Email</h2>
                <a href="mailto:lydo@prototype-lydo.demo" className="text-foreground hover:text-primary transition-colors mt-1 inline-block">
                  lydo@prototype-lydo.demo
                </a>
              </div>
              <div>
                <h2 className="text-sm uppercase tracking-widest text-primary font-semibold">Phone</h2>
                <a href="tel:+630000000000" className="text-foreground hover:text-primary transition-colors mt-1 inline-block">
                  +63 000 000 0000
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contacts;
