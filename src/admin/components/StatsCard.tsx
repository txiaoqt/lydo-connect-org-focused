
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo';
}

export const StatsCard = ({ label, value, icon: Icon, trend, trendLabel, color = 'blue' }: StatsCardProps) => {
  const colorClasses = {
    emerald: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    blue: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
    amber: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    rose: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    indigo: "bg-indigo-400/15 text-indigo-300 border-indigo-400/30",
  };

  return (
    <div className="bg-[#0f1c2b] p-6 rounded-2xl border border-[#1f3348] shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl border", colorClasses[color])}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            trend >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
          )}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      
      {trendLabel && (
        <p className="text-xs text-slate-400 mt-2 font-medium">{trendLabel}</p>
      )}
    </div>
  );
};

