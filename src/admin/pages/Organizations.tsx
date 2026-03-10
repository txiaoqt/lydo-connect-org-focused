
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building2, Tag, Globe } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Organization } from '../types';

export const Organizations = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name', { ascending: true });
        
        if (data) setOrgs(data);
        if (error) console.error('Error fetching organizations:', error);
      } else {
        // Mock data
        setOrgs([
          {
            id: '1',
            slug: 'san-mateo-youth-council',
            name: 'San Mateo Youth Council',
            type: 'Government',
            focus: 'Governance',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            slug: 'green-youth-alliance',
            name: 'Green Youth Alliance',
            type: 'NGO',
            focus: 'Environment',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchOrgs();
  }, []);

  const columns = [
    { 
      header: 'Organization', 
      accessor: (o: Organization) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
            <Building2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{o.name}</span>
            <span className="text-xs text-slate-400 font-medium">{o.slug}</span>
          </div>
        </div>
      )
    },
    { header: 'Type', accessor: 'type' as const },
    { 
      header: 'Focus Area', 
      accessor: (o: Organization) => (
        <div className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-lg w-fit">
          <Tag size={12} />
          {o.focus}
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (o: Organization) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          o.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-[#12263a] text-slate-300'
        }`}>
          {o.status}
        </span>
      )
    },
  ];

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Organizations</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage youth organizations and councils registered in the municipality.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Register New Org
        </button>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search organizations..." 
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
        data={filteredOrgs} 
        isLoading={isLoading}
        onEdit={(o) => console.log('Edit', o)}
        onDelete={(o) => console.log('Delete', o)}
        onView={(o) => console.log('View', o)}
      />
    </div>
  );
};

