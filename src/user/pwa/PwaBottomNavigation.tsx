import { FileText, Home, Menu, ReceiptText, WalletCards } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const items = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Documents", path: "/document-submission", icon: FileText },
  { label: "Budget", path: "/budget-request", icon: WalletCards },
  { label: "Liquidation", path: "/liquidation-reporting", icon: ReceiptText },
  { label: "More", path: "/app-more", icon: Menu },
];

const secondaryPaths = new Set([
  "/organization-profile", "/news-releases", "/public-transparency", "/compliance-status",
  "/notifications", "/ypop", "/templates", "/app-inquiries",
]);

export function PwaBottomNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="pwa-bottom-nav" aria-label="Primary app navigation">
      <div className="pwa-bottom-nav-inner">
        {items.map((item) => {
          const isSecondaryPage = [...secondaryPaths].some(
            (path) => pathname === path || pathname.startsWith(`${path}/`),
          );
          const active = pathname === item.path || (item.path === "/app-more" && isSecondaryPage);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              className={active ? "is-active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(item.path)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
