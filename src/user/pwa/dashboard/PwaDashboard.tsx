import {
  AlertTriangle, CalendarClock, ChevronRight, FileText, Megaphone,
  ReceiptText, Sparkles, UserRound, WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/portal/StatusBadge";
import type { usePwaPortalData } from "../hooks/usePwaPortalData";

type PortalData = ReturnType<typeof usePwaPortalData>;

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const actionIcons = {
  profile: UserRound,
  documents: FileText,
  budget: WalletCards,
  liquidation: ReceiptText,
  news: Megaphone,
} as const;

export default function PwaDashboard({ data }: { data: PortalData }) {
  const navigate = useNavigate();
  const overview = [
    { label: "Profile", value: `${data.profilePercent}%`, status: data.profile?.profileStatus ?? "incomplete", icon: UserRound, path: "/organization-profile" },
    { label: "Documents", value: `${data.documentPercent}%`, status: data.submission?.status ?? "not_started", icon: FileText, path: "/document-submission" },
    { label: "Budget", value: `${data.budgetPercent}%`, status: data.latestBudget?.status ?? "draft", icon: WalletCards, path: "/budget-request" },
    { label: "Liquidation", value: `${data.liquidationPercent}%`, status: data.latestLiquidation?.status ?? "not_started", icon: ReceiptText, path: "/liquidation-reporting" },
  ];

  return (
    <div className="pwa-dashboard pwa-stack">
      <section className={`pwa-briefing pwa-briefing--${data.briefing.tone}`}>
        <div className="pwa-eyebrow"><Sparkles aria-hidden="true" /> Today&apos;s Briefing</div>
        <div className="pwa-briefing-copy">
          <h2>{data.briefing.title}</h2>
          <p>{data.briefing.description}</p>
        </div>
        <div className="pwa-briefing-stats">
          <div><FileText aria-hidden="true" /><span><strong>{data.pendingActions}</strong><small>Pending Actions</small></span></div>
          <div><WalletCards aria-hidden="true" /><span><strong>{money.format(data.releasedBudget)}</strong><small>Budget Released</small></span></div>
          <div><CalendarClock aria-hidden="true" /><span><strong>{data.daysUntilDeadline ?? "—"}</strong><small>Days to Milestone</small></span></div>
        </div>
      </section>

      <section className="pwa-overview-grid" aria-label="Workflow overview">
        {overview.map(({ label, value, status, icon: Icon, path }) => (
          <button key={label} type="button" className="pwa-overview-card" onClick={() => navigate(path)}>
            <span className="pwa-overview-icon"><Icon aria-hidden="true" /></span>
            <span className="pwa-overview-copy">
              <small>{label}</small>
              <strong>{value}</strong>
              <StatusBadge status={status} />
            </span>
          </button>
        ))}
      </section>

      <section className="pwa-card">
        <h2 className="pwa-section-title">Recommended Next Steps</h2>
        <div className="pwa-action-grid">
          {data.actions.map((action) => {
            const Icon = actionIcons[action.kind as keyof typeof actionIcons] ?? AlertTriangle;
            return (
              <button key={`${action.path}-${action.title}`} type="button" onClick={() => navigate(action.path)}>
                <span className="pwa-action-icon"><Icon aria-hidden="true" /></span>
                <span><strong>{action.title}</strong><small>{action.detail}</small></span>
                <ChevronRight aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="pwa-card">
        <div className="pwa-section-heading">
          <h2 className="pwa-section-title">Recent Activity</h2>
          {data.activities.length > 3 ? <button type="button" onClick={() => navigate("/organization-profile")}>View All</button> : null}
        </div>
        <div className="pwa-activity-list">
          {data.activities.slice(0, 3).map((activity) => (
            <article key={activity.id}>
              <span className="pwa-activity-marker" aria-hidden="true" />
              <div><strong>{activity.description}</strong><time>{formatDate(activity.createdAt)}</time></div>
            </article>
          ))}
          {!data.activities.length ? <p className="pwa-empty-copy">Recent organization updates will appear here.</p> : null}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
