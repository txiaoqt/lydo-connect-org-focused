import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqs = [
  {
    question: "What is LYDO Connect?",
    answer:
      "LYDO Connect is a centralized youth governance platform where users can discover programs, events, organizations, and transparency resources in one place.",
  },
  {
    question: "How can I join youth programs?",
    answer:
      "Go to the Programs page, open a program record, and follow the registration instructions shown for that specific opportunity.",
  },
  {
    question: "How do I register for events?",
    answer:
      "Visit the Events page, choose an event, and complete the registration process listed in the event details.",
  },
  {
    question: "Where can I send concerns or requests?",
    answer:
      "Use the Youth Desk page to submit information requests, feedback, and service concerns linked to your account.",
  },
  {
    question: "Where can I read privacy and terms information?",
    answer:
      "You can review platform policies through the Terms of Service and Privacy Policy pages in the footer.",
  },
];

const Faqs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-10 sm:py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-[1.9rem] sm:text-4xl md:text-5xl font-heading font-bold text-secondary-foreground mb-4 sm:mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-secondary-foreground/70 text-sm sm:text-base md:text-lg leading-relaxed">
              Quick answers about using LYDO Connect services and platform features.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-4 sm:space-y-5">
              {faqs.map((item) => (
                <article key={item.question} className="bg-card border border-border rounded-xl p-4 sm:p-6 card-shadow">
                  <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">{item.question}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Faqs;
