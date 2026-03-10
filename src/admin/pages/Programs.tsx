
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, ExternalLink } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Program } from '../types';
import { format } from 'date-fns';

export const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) setPrograms(data);
        if (error) console.error('Error fetching programs:', error);
      } else {
        // Mock data
        setPrograms([
          {
            id: '1',
            slug: 'digital-literacy-2024',
            title: 'Digital Literacy Workshop',
            sector: 'Education',
            description: 'A comprehensive workshop on digital tools and internet safety.',
            start_date: '2024-04-15',
            end_date: '2024-05-15',
            location: 'San Mateo Municipal Hall',
            status: 'published',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            slug: 'youth-leadership-summit',
            title: 'Youth Leadership Summit',
            sector: 'Governance',
            description: 'Empowering the next generation of community leaders.',
            start_date: '2024-06-10',
            end_date: '2024-06-12',
            location: 'Various Barangays',
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchPrograms();
  }, []);

  const columns = [
    { 
      header: 'Title', 
      accessor: (p: Program) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-100">{p.title}</span>
          <span className="text-xs text-slate-400 font-medium">{p.slug}</span>
        </div>
      )
    },
    { header: 'Sector', accessor: 'sector' as const },
    { 
      header: 'Status', 
      accessor: (p: Program) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          p.status === 'published' ? 'bg-blue-50 text-blue-600' :
          p.status === 'draft' ? 'bg-amber-50 text-amber-600' :
          'bg-[#12263a] text-slate-300'
        }`}>
          {p.status}
        </span>
      )
    },
    { 
      header: 'Dates', 
      accessor: (p: Program) => (
        <div className="flex flex-col text-xs font-medium">
          <span>{p.start_date ? format(new Date(p.start_date), 'MMM d, yyyy') : 'N/A'}</span>
          <span className="text-slate-400">to {p.end_date ? format(new Date(p.end_date), 'MMM d, yyyy') : 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Location', 
      accessor: 'location' as const,
      className: 'max-w-[150px] truncate'
    },
  ];

  const filteredPrograms = programs.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Programs Management</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage and monitor youth development programs in San Mateo.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Create New Program
        </button>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search programs..." 
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
        data={filteredPrograms} 
        isLoading={isLoading}
        onEdit={(p) => console.log('Edit', p)}
        onDelete={(p) => console.log('Delete', p)}
        onView={(p) => console.log('View', p)}
      />
    </div>
  );
};

