import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFacebookEmbedIssue, normalizeSourcePostUrl, toFacebookEmbedConfig } from "@/lib/source-post";

type SourcePostEmbedProps = {
  sourcePostUrl?: string | null;
  title: string;
  className?: string;
};

export default function SourcePostEmbed({ sourcePostUrl, title, className }: SourcePostEmbedProps) {
  const normalizedSourceUrl = normalizeSourcePostUrl(sourcePostUrl);
  if (!normalizedSourceUrl) return null;

  const embedIssue = getFacebookEmbedIssue(normalizedSourceUrl);
  const embedConfig = toFacebookEmbedConfig(normalizedSourceUrl, 750);
  const iframeHeight = embedConfig?.kind === "video" ? 460 : 640;

  return (
    <div className={cn("space-y-3", className)}>
      <a
        href={normalizedSourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Open Source Post <ExternalLink className="h-4 w-4" />
      </a>

      {embedConfig ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <iframe
            title={`${title} source post`}
            src={embedConfig.embedUrl}
            width="100%"
            height={iframeHeight}
            style={{ border: "none", overflow: "hidden" }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          This URL can be opened as source, but Facebook cannot embed this link format.
        </div>
      )}
      {embedIssue ? (
        <p className="text-xs text-amber-600">{embedIssue.message}</p>
      ) : embedConfig ? (
        <p className="text-xs text-muted-foreground">
          If Facebook shows "post no longer available", the post is usually not public/embeddable for all visitors.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Use a direct public Facebook post permalink for embedding.</p>
      )}
    </div>
  );
}
