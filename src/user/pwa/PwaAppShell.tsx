import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PwaHeader } from "./PwaHeader";
import { PwaBottomNavigation } from "./PwaBottomNavigation";
import { usePwaNavigation } from "./hooks/usePwaNavigation";
import { PWA_ROUTES } from "./pwaRoutes";

export function PwaAppShell({
  title,
  organizationName,
  unreadCount,
  dashboard,
  children,
}: {
  title: string;
  organizationName: string;
  unreadCount: number;
  dashboard?: boolean;
  children: ReactNode;
}) {
  const { go } = usePwaNavigation();
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("ytrace-pwa-active");
    document.body.classList.add("ytrace-pwa-active");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return () => {
      document.documentElement.classList.remove("ytrace-pwa-active");
      document.body.classList.remove("ytrace-pwa-active");
    };
  }, [pathname]);

  return (
    <div className="ytrace-pwa-app">
      <div className="pwa-app-frame">
        <PwaHeader
          title={title}
          organizationName={organizationName}
          unreadCount={unreadCount}
          dashboard={dashboard}
          onNotifications={() => go(PWA_ROUTES.notifications)}
        />
        <main className="pwa-main-content" aria-label={title}>{children}</main>
      </div>
      <PwaBottomNavigation />
    </div>
  );
}
