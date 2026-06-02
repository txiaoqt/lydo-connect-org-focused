import { useEffect, useRef, useState } from "react";
import { ExternalLink, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFacebookEmbedIssue, normalizeSourcePostUrl, toFacebookEmbedConfig } from "@/lib/source-post";

type SourcePostEmbedProps = {
  sourcePostUrl?: string | null;
  title: string;
  className?: string;
};

export default function SourcePostEmbed({ sourcePostUrl, title, className }: SourcePostEmbedProps) {
  const normalizedSourceUrl = normalizeSourcePostUrl(sourcePostUrl);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!normalizedSourceUrl) return;

    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setMeasuredWidth(Math.round(element.getBoundingClientRect().width));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [normalizedSourceUrl]);

  if (!normalizedSourceUrl) return null;

  const embedIssue = getFacebookEmbedIssue(normalizedSourceUrl);
  const embedConfig = toFacebookEmbedConfig(normalizedSourceUrl, measuredWidth ?? 500);
  const iframeHeight = embedConfig?.kind === "video" ? 460 : 640;
  const openLabel = embedConfig?.kind === "page" ? "Open Source Page" : "Open Source Post";

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      <a
        href={normalizedSourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {openLabel} <ExternalLink className="h-4 w-4" />
      </a>

      {embedConfig ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <iframe
            title={`${title} source post`}
            src={embedConfig.embedUrl}
            width="100%"
            height={iframeHeight}
            className="block w-full"
            style={{ border: "none", overflow: "hidden" }}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-6 md:p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center">
              <Link2Off className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Post Preview Unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This source link can be opened, but Facebook cannot render an embeddable preview for this post format or visibility setting.
            </p>
          </div>
        </div>
      )}
      {embedIssue ? (
        <p className="text-xs text-warning">{embedIssue.message}</p>
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
