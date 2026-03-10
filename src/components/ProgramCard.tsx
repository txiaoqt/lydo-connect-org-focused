import { Calendar } from "lucide-react";
import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LocationPreviewButton from "@/components/LocationPreviewButton";

interface ProgramCardProps {
  id?: string;
  title: string;
  sector: string;
  description: string;
  date?: string;
  location?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  type: "program" | "event" | "organization";
  sourcePostUrl?: string;
  isJoined?: boolean;
  onToggleJoin?: () => void;
}

const typeColors: Record<string, string> = {
  program: "bg-primary/10 text-primary",
  event: "bg-accent/20 text-accent-foreground",
  organization: "bg-secondary/80 text-secondary-foreground",
};

const formatSingleDate = (value: string) => {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = parseISO(normalized);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : normalized;
};

const formatCardDate = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  const rangeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return `${formatSingleDate(rangeMatch[1])} - ${formatSingleDate(rangeMatch[2])}`;
  }
  return formatSingleDate(trimmed);
};

const ProgramCard = ({
  title,
  sector,
  description,
  date,
  location,
  locationLatitude,
  locationLongitude,
  type,
  sourcePostUrl,
  isJoined,
  onToggleJoin,
}: ProgramCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const displayDate = formatCardDate(date);

  return (
    <div className="h-full bg-card rounded-xl border border-border card-shadow hover:card-shadow-hover transition-all duration-300 overflow-hidden group">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[type]}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground">{sector}</span>
        </div>
        <h3 className="font-heading font-semibold text-foreground text-lg mb-2 min-h-[3.5rem] line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p
          className={cn(
            "text-muted-foreground text-sm mb-4 leading-relaxed h-20",
            expanded ? "overflow-y-auto pr-1" : "line-clamp-3",
          )}
        >
          {description}
        </p>
        <div className="space-y-2 text-xs text-muted-foreground mb-4 min-h-[3.75rem]">
          {displayDate && (
            <div className="flex items-start gap-1.5 leading-relaxed">
              <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2 break-words">{displayDate}</span>
            </div>
          )}
          {location && (
            <LocationPreviewButton
              location={location}
              locationLatitude={locationLatitude}
              locationLongitude={locationLongitude}
              className="w-full text-xs leading-relaxed"
              iconClassName="mt-0.5 shrink-0"
              labelClassName="line-clamp-2 break-words"
            />
          )}
        </div>
        <div className="mb-3 min-h-5">
          {sourcePostUrl ? (
            <a href={sourcePostUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block">
              Source Post
            </a>
          ) : (
            <span className="invisible text-xs">Source Post</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 mt-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show Less" : "Learn More"}
          </Button>
          {onToggleJoin && (
            <Button type="button" size="sm" className="w-full" onClick={onToggleJoin}>
              {isJoined ? "Joined (Click to Leave)" : "Join Program"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
