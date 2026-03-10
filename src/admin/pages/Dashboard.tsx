
import React from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';

export const Dashboard = () => {
  const stats = [
    { label: 'Total Youth Users', value: '12,482', icon: Users, trend: 12, color: 'blue' as const },
    { label: 'Active Programs', value: '48', icon: Briefcase, trend: 5, color: 'blue' as const },
    { label: 'Upcoming Events', value: '14', icon: Calendar, trend: -2, color: 'amber' as const },
    { label: 'Registered Orgs', value: '86', icon: Building2, trend: 8, color: 'indigo' as const },
  ];

  const recentActivities = [
    { id: 1, type: 'registration', user: 'Juan Dela Cruz', target: 'Youth Leadership Summit 2024', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'program', user: 'Admin', target: 'Digital Literacy Workshop', time: '5 hours ago', status: 'update' },
    { id: 3, type: 'org', user: 'San Mateo Youth Council', target: 'New Organization Registration', time: '1 day ago', status: 'pending' },
    { id: 4, type: 'event', user: 'Admin', target: 'Community Clean-up Drive', time: '2 days ago', status: 'completed' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard Overview</h1>
        <p className="text-slate-400 mt-1 font-medium">Welcome back, here's what's happening with LYDO Connect today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={stat.label}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0f1c2b] p-8 rounded-3xl border border-[#1f3348] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-100">Engagement Trends</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg">Weekly</button>
              <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-[#12263a] rounded-lg transition-colors">Monthly</button>
            </div>
          </div>
          <div className="h-64 bg-[#12263a] rounded-2xl flex items-center justify-center border-2 border-dashed border-[#1f3348]">
            <p className="text-slate-400 font-medium">Engagement Chart Placeholder</p>
          </div>
        </div>

        <div className="bg-[#0f1c2b] p-8 rounded-3xl border border-[#1f3348] shadow-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                  activity.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  activity.status === 'update' ? 'bg-blue-50 text-blue-600' :
                  activity.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  'bg-[#12263a] text-slate-300'
                }`}>
                  {activity.status === 'success' ? <CheckCircle2 size={16} /> :
                   activity.status === 'pending' ? <AlertCircle size={16} /> :
                   <Clock size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    {activity.user} <span className="font-medium text-slate-400">
                      {activity.type === 'registration' ? 'registered for' :
                       activity.type === 'program' ? 'updated' :
                       activity.type === 'org' ? 'submitted' : 'completed'}
                    </span> {activity.target}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

