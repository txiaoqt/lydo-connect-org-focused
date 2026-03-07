import { LucideIcon } from "lucide-react";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "accent" | "warning";
  compact?: boolean;
}

export default function StatCard({
  value,
  label,
  icon: Icon,
  description,
  variant = "default",
  compact = false,
}: StatCardProps) {
  if (compact) {
    return (
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-1">
          {value}
        </div>
        <div className="text-sm text-primary-foreground/70">{label}</div>
      </div>
    );
  }

  const variantStyles = {
    default: "bg-card",
    primary: "bg-primary/5 border-primary/20",
    accent: "bg-accent/5 border-accent/20",
    warning: "bg-warning/5 border-warning/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className={`rounded-lg border p-5 card-shadow transition-all hover:card-shadow-hover ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold font-heading mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
