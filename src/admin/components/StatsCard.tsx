
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
    emerald: "bg-accent/15 text-accent border-accent/30",
    blue: "bg-primary/10 text-primary border-primary/20",
    amber: "bg-warning/20 text-warning border-warning/30",
    rose: "bg-destructive/15 text-destructive border-destructive/25",
    indigo: "bg-info/15 text-info border-info/25",
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border card-shadow hover:card-shadow-hover transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl border", colorClasses[color])}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            trend >= 0 ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
          )}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <h3 className="text-muted-foreground text-sm font-medium mb-1">{label}</h3>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      
      {trendLabel && (
        <p className="text-xs text-muted-foreground/80 mt-2 font-medium">{trendLabel}</p>
      )}
    </div>
  );
};
