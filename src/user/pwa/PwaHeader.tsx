import { Bell } from "lucide-react";

export function PwaHeader({
  title,
  organizationName,
  unreadCount,
  dashboard,
  onNotifications,
}: {
  title: string;
  organizationName: string;
  unreadCount: number;
  dashboard?: boolean;
  onNotifications: () => void;
}) {
  const initial = organizationName.trim().charAt(0).toUpperCase() || "Y";

  return (
    <header className="pwa-app-header">
      <div className="pwa-avatar" aria-hidden="true">{initial}</div>
      <div className="pwa-header-copy">
        <h1>{title}</h1>
        <p>{dashboard ? `Good ${getDayPart()}, ${organizationName || "Organization"}` : organizationName}</p>
      </div>
      <button type="button" className="pwa-icon-button" aria-label="Open notifications" onClick={onNotifications}>
        <Bell aria-hidden="true" />
        {unreadCount > 0 ? <span className="pwa-notification-dot">{Math.min(unreadCount, 9)}</span> : null}
      </button>
    </header>
  );
}

function getDayPart() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
