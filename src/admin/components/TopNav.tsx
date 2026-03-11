import React, { useEffect, useState } from 'react';
import { Download, Menu, Search, Bell, User } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface TopNavProps {
  title?: string;
  onMenuToggle?: () => void;
}

export const TopNav = ({ title = "Admin Portal", onMenuToggle }: TopNavProps) => {
  const { user } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <header className="h-16 md:h-20 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden h-10 w-10 rounded-lg border border-border bg-background text-foreground flex items-center justify-center"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>
        <div className="md:hidden min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        </div>
      </div>

      <div className="relative hidden md:block w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Search for programs, events, or users..." 
          className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {installPrompt && (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="sm:hidden h-9 w-9 rounded-lg border border-border text-primary bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center"
            aria-label="Install admin app"
          >
            <Download size={16} />
          </button>
        )}

        {installPrompt && (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Download size={14} />
            Install App
          </button>
        )}

        <button className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card"></span>
        </button>
        
        <div className="hidden sm:block h-8 w-[1px] bg-border mx-1"></div>

        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 cursor-pointer group min-w-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {user?.displayName || "Admin User"}
            </p>
            <p className="text-xs text-muted-foreground">Super Administrator</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-transparent group-hover:border-primary/20 transition-all">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};
