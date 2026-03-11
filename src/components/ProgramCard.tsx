import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import LocationPreviewButton from "@/components/LocationPreviewButton";

interface ProgramCardProps {
  id?: string;
  title: string;
  sector: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  type: "program" | "event" | "organization";
  sourcePostUrl?: string;
  recordHref?: string;
  showModeActions?: boolean;
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
  time,
  location,
  locationLatitude,
  locationLongitude,
  type,
  sourcePostUrl,
  recordHref,
  showModeActions = false,
  isJoined,
  onToggleJoin,
}: ProgramCardProps) => {
  const displayDate = formatCardDate(date);
  const detailsHref = recordHref ? `${recordHref}${recordHref.includes("?") ? "&" : "?"}view=details` : "";
  const registrationHref = recordHref ? `${recordHref}${recordHref.includes("?") ? "&" : "?"}view=registration` : "";

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
        <p className="text-muted-foreground text-sm mb-2 leading-relaxed h-20 line-clamp-3">{description}</p>
        {recordHref && (
          <Link to={showModeActions ? detailsHref : recordHref} className="text-xs text-primary hover:underline mb-3 block">
            See more
          </Link>
        )}
        <div className="space-y-2 text-xs text-muted-foreground mb-4 min-h-[5rem]">
          {displayDate && (
            <div className="flex items-start gap-1.5 leading-relaxed">
              <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2 break-words">{displayDate}</span>
            </div>
          )}
          {time && (
            <div className="flex items-start gap-1.5 leading-relaxed">
              <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2 break-words">{time}</span>
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
          {recordHref && (
            showModeActions ? (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                  <Link to={detailsHref}>Details</Link>
                </Button>
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                  <Link to={registrationHref}>Registration</Link>
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                <Link to={recordHref}>{type === "program" ? "View Program Record" : "View Event Record"}</Link>
              </Button>
            )
          )}
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
