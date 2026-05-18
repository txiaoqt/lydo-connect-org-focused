import { ArrowRight, Calendar, Clock, FileText, Info, UserPlus } from "lucide-react";
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
  joinedLabel?: string;
  onToggleJoin?: () => void;
}

const typeColors: Record<string, string> = {
  program: "bg-primary/10 text-primary",
  event: "bg-primary/10 text-primary",
  organization: "bg-primary/10 text-primary",
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
  joinedLabel = "Joined",
  onToggleJoin,
}: ProgramCardProps) => {
  const displayDate = formatCardDate(date);
  const detailsHref = recordHref ? `${recordHref}${recordHref.includes("?") ? "&" : "?"}view=details` : "";
  const registrationHref = recordHref ? `${recordHref}${recordHref.includes("?") ? "&" : "?"}view=registration` : "";

  return (
    <div className="h-full rounded-lg border border-border bg-card card-shadow hover:card-shadow-hover transition-all duration-200 overflow-hidden group">
      <div className="p-4 sm:p-5 h-full flex flex-col">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
          <span className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg ${typeColors[type]}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">{sector}</span>
          {isJoined && (
            <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-accent/15 text-accent">
              {joinedLabel}
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-foreground text-base sm:text-lg leading-snug mb-2 min-h-[2.5rem] sm:min-h-[3.25rem] line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="min-h-[4.5rem] sm:min-h-[4.5rem] md:min-h-[5.25rem]">
          <p className="text-muted-foreground text-sm leading-5 sm:leading-6 line-clamp-3 md:line-clamp-3">{description}</p>
        </div>
        {recordHref && (
          <Link
            to={showModeActions ? detailsHref : recordHref}
            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80"
          >
            See more
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        )}
        <div className="mt-3 border-t border-border pt-3 sm:pt-4">
          <div className="space-y-2 text-sm text-muted-foreground min-h-[6.5rem] sm:min-h-[6.75rem]">
          {displayDate && (
            <div className="flex items-start gap-2.5 leading-relaxed">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2 break-words">{displayDate}</span>
            </div>
          )}
          {time && (
            <div className="flex items-start gap-2.5 leading-relaxed">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2 break-words">{time}</span>
            </div>
          )}
          {location && (
            <LocationPreviewButton
              location={location}
              locationLatitude={locationLatitude}
              locationLongitude={locationLongitude}
              className="w-full gap-2.5 text-sm leading-relaxed"
              iconClassName="mt-0.5 shrink-0 text-primary h-3.5 w-3.5 sm:h-4 sm:w-4"
              labelClassName="line-clamp-2 break-words"
            />
          )}
          {sourcePostUrl ? (
            <a
              href={sourcePostUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 font-semibold text-primary hover:text-primary/80"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              Source Post
            </a>
          ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-auto pt-3 sm:pt-4">
          {recordHref && (
            showModeActions ? (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" className="w-full h-10 sm:h-9 px-2.5" asChild>
                  <Link to={detailsHref}>
                    <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Details
                  </Link>
                </Button>
                <Button type="button" size="sm" className="w-full h-10 sm:h-9 px-2.5" asChild>
                  <Link to={registrationHref}>
                    <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Registration
                  </Link>
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                <Link to={recordHref}>
                  <Info className="h-4 w-4" />
                  {type === "program" ? "View Program Record" : "View Event Record"}
                </Link>
              </Button>
            )
          )}
          {onToggleJoin && (
            <Button type="button" size="sm" className="w-full" onClick={onToggleJoin}>
              <UserPlus className="h-4 w-4" />
              {isJoined ? "Joined (Click to Leave)" : "Join Program"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
