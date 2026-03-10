
import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";

export const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-[#0b1625]/95 backdrop-blur-md border-b border-[#1f3348] sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search for programs, events, or users..." 
          className="w-full pl-10 pr-4 py-2.5 bg-[#12263a] border border-[#1f3348] rounded-xl text-sm text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/30 transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-300 hover:bg-[#12263a] rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#0b1625]"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-[#1f3348] mx-2"></div>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
              {user?.displayName || "Admin User"}
            </p>
            <p className="text-xs text-slate-400">Super Administrator</p>
          </div>
          <div className="w-10 h-10 bg-[#12263a] rounded-xl flex items-center justify-center text-slate-300 overflow-hidden border-2 border-transparent group-hover:border-emerald-500/20 transition-all">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

