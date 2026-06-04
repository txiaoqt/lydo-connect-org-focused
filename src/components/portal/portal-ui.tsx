import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statusLabelMap, statusToneMap } from "@/lib/lydo-connect-data";

export const PortalStatusBadge = ({ status }: { status: string }) => (
  <Badge variant={statusToneMap[status] ?? "secondary"} className="capitalize">
    {statusLabelMap[status] ?? status.replaceAll("_", " ")}
  </Badge>
);

export const PortalMetricCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) => (
  <Card className="border-border/70 bg-card/90">
    <CardContent className="p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">{label}</p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </CardContent>
  </Card>
);

export const PortalSection = ({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <Card className="border-border/70 bg-card/90 shadow-sm">
    <CardHeader className={cn(action ? "flex flex-row items-start justify-between gap-4" : undefined)}>
      <div className="min-w-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export const PortalEmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
    <p className="font-medium">{title}</p>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

