import {
  Bell, ChevronRight, FileText, HelpCircle, LogOut, Medal, Megaphone,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePwaNavigation } from "./hooks/usePwaNavigation";
import { PWA_ROUTES } from "./pwaRoutes";

const links = [
  { label: "Organization Profile", detail: "Identity, classification and contacts", path: PWA_ROUTES.profile, icon: UserRound },
  { label: "YPOP Incentive", detail: "Semesters, scores and proof records", path: PWA_ROUTES.ypop, icon: Medal },
  { label: "Templates", detail: "View and download official files", path: PWA_ROUTES.templates, icon: FileText },
  { label: "News Releases", detail: "Official LYDO updates", path: PWA_ROUTES.news, icon: Megaphone },
  { label: "Notifications", detail: "Updates about your records", path: PWA_ROUTES.notifications, icon: Bell },
  { label: "Inquiries", detail: "Send and review inquiries", path: PWA_ROUTES.inquiries, icon: HelpCircle },
];

export function PwaMorePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { go } = usePwaNavigation();
  const [signOutConfirmationOpen, setSignOutConfirmationOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
      setSignOutConfirmationOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="pwa-stack">
      <section className="pwa-card pwa-menu-card">
        {links.map(({ label, detail, path, icon: Icon }) => (
          <button key={path} type="button" onClick={() => go(path)}>
            <span className="pwa-menu-icon"><Icon aria-hidden="true" /></span>
            <span className="pwa-menu-copy"><strong>{label}</strong><small>{detail}</small></span>
            <ChevronRight aria-hidden="true" className="pwa-chevron" />
          </button>
        ))}
      </section>
      <button type="button" className="pwa-signout-button" onClick={() => setSignOutConfirmationOpen(true)}>
        <LogOut aria-hidden="true" /> Sign Out
      </button>

      <AlertDialog open={signOutConfirmationOpen} onOpenChange={setSignOutConfirmationOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your Y-TRACE account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={signingOut}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void confirmSignOut();
              }}
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
