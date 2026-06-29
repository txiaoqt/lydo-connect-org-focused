import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PwaHeader } from "./PwaHeader";
import { PwaBottomNavigation } from "./PwaBottomNavigation";

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
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("ytrace-pwa-active");
    document.body.classList.add("ytrace-pwa-active");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return () => {
      document.documentElement.classList.remove("ytrace-pwa-active");
      document.body.classList.remove("ytrace-pwa-active");
    };
  }, [title]);

  return (
    <div className="ytrace-pwa-app">
      <div className="pwa-app-frame">
        <PwaHeader
          title={title}
          organizationName={organizationName}
          unreadCount={unreadCount}
          dashboard={dashboard}
          onNotifications={() => navigate("/notifications")}
        />
        <main className="pwa-main-content" aria-label={title}>{children}</main>
      </div>
      <PwaBottomNavigation />
    </div>
  );
}
