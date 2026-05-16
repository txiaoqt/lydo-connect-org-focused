import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <div
      className="group h-full rounded-lg border border-border bg-card p-5 card-shadow hover:card-shadow-hover transition-all duration-200 hover:border-primary/30"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-lg leading-snug text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-6">{description}</p>
    </div>
  );
};

export default FeatureCard;
