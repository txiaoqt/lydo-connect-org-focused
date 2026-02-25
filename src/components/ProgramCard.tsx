import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramCardProps {
  title: string;
  sector: string;
  description: string;
  date?: string;
  location?: string;
  type: "program" | "event" | "scholarship";
}

const typeColors: Record<string, string> = {
  program: "bg-primary/10 text-primary",
  event: "bg-accent/20 text-accent-foreground",
  scholarship: "bg-secondary/80 text-secondary-foreground",
};

const ProgramCard = ({ title, sector, description, date, location, type }: ProgramCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border card-shadow hover:card-shadow-hover transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[type]}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground">{sector}</span>
        </div>
        <h3 className="font-heading font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">{description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {date}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default ProgramCard;
