
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Event } from '../types';
import { format } from 'date-fns';

export const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });
        
        if (data) setEvents(data);
        if (error) console.error('Error fetching events:', error);
      } else {
        // Mock data
        setEvents([
          {
            id: '1',
            slug: 'youth-clean-up-2024',
            title: 'Community Clean-up Drive',
            sector: 'Environment',
            description: 'Join us for a community-wide clean-up activity.',
            event_date: '2024-04-22',
            time_text: '8:00 AM - 12:00 PM',
            location: 'San Mateo Riverbanks',
            status: 'upcoming',
            capacity: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            slug: 'sk-elections-forum',
            title: 'SK Elections Forum',
            sector: 'Governance',
            description: 'A forum for aspiring SK leaders to share their vision.',
            event_date: '2024-05-05',
            time_text: '1:00 PM - 5:00 PM',
            location: 'Municipal Gymnasium',
            status: 'upcoming',
            capacity: 250,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchEvents();
  }, []);

  const columns = [
    { 
      header: 'Event', 
      accessor: (e: Event) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-100">{e.title}</span>
          <span className="text-xs text-slate-400 font-medium">{e.sector}</span>
        </div>
      )
    },
    { 
      header: 'Date & Time', 
      accessor: (e: Event) => (
        <div className="flex flex-col text-xs font-medium">
          <div className="flex items-center gap-1">
            <CalendarIcon size={12} className="text-slate-400" />
            <span>{e.event_date ? format(new Date(e.event_date), 'MMM d, yyyy') : 'N/A'}</span>
          </div>
          <span className="text-slate-400 ml-4">{e.time_text || 'TBD'}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (e: Event) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          e.status === 'upcoming' ? 'bg-blue-50 text-blue-600' :
          e.status === 'ongoing' ? 'bg-indigo-50 text-indigo-600' :
          e.status === 'completed' ? 'bg-[#12263a] text-slate-300' :
          'bg-rose-50 text-rose-600'
        }`}>
          {e.status}
        </span>
      )
    },
    { 
      header: 'Location', 
      accessor: (e: Event) => (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <MapPin size={12} className="text-slate-400" />
          <span className="max-w-[120px] truncate">{e.location}</span>
        </div>
      )
    },
    { 
      header: 'Capacity', 
      accessor: (e: Event) => (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <Users size={12} className="text-slate-400" />
          <span>{e.capacity || 'Unlimited'}</span>
        </div>
      )
    },
  ];

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Events Management</h1>
          <p className="text-slate-400 mt-1 font-medium">Coordinate and manage community events for the youth.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Create New Event
        </button>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#12263a] border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-slate-300 font-bold hover:bg-[#12263a] rounded-xl transition-all border border-[#1f3348]">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredEvents} 
        isLoading={isLoading}
        onEdit={(e) => console.log('Edit', e)}
        onDelete={(e) => console.log('Delete', e)}
        onView={(e) => console.log('View', e)}
      />
    </div>
  );
};

