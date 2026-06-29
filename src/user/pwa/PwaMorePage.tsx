import {
  Bell, ChevronRight, FileText, HelpCircle, LogOut, Medal, Megaphone,
  Scale, ShieldCheck, UserRound, WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const links = [
  { label: "Organization Profile", detail: "Identity, classification and contacts", path: "/organization-profile", icon: UserRound },
  { label: "Compliance Status", detail: "Review requirements and remarks", path: "/compliance-status", icon: ShieldCheck },
  { label: "YPOP Incentive", detail: "Semesters, scores and proof records", path: "/ypop", icon: Medal },
  { label: "Templates", detail: "View and download official files", path: "/templates", icon: FileText },
  { label: "News Releases", detail: "Official LYDO updates", path: "/news-releases", icon: Megaphone },
  { label: "Public Transparency", detail: "Published budget information", path: "/public-transparency", icon: Scale },
  { label: "Notifications", detail: "Updates about your records", path: "/notifications", icon: Bell },
  { label: "Inquiries", detail: "Send and review inquiries", path: "/app-inquiries", icon: HelpCircle },
  { label: "Full Portal Tools", detail: "Open the complete transaction workspace", path: "/dashboard?webView=1", icon: WalletCards },
];

export function PwaMorePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const navigate = useNavigate();
  return (
    <div className="pwa-stack">
      <section className="pwa-card pwa-menu-card">
        {links.map(({ label, detail, path, icon: Icon }) => (
          <button key={path} type="button" onClick={() => navigate(path)}>
            <span className="pwa-menu-icon"><Icon aria-hidden="true" /></span>
            <span className="pwa-menu-copy"><strong>{label}</strong><small>{detail}</small></span>
            <ChevronRight aria-hidden="true" className="pwa-chevron" />
          </button>
        ))}
      </section>
      <button type="button" className="pwa-signout-button" onClick={() => void onSignOut()}>
        <LogOut aria-hidden="true" /> Sign Out
      </button>
    </div>
  );
}
