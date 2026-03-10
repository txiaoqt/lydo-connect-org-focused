
import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";

export const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Search for programs, events, or users..." 
          className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-border mx-2"></div>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {user?.displayName || "Admin User"}
            </p>
            <p className="text-xs text-muted-foreground">Super Administrator</p>
          </div>
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-transparent group-hover:border-primary/20 transition-all">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};
