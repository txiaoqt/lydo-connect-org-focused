
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Users, User } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Barangay } from '../types';

export const Barangays = () => {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBarangays = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('barangays')
          .select('*')
          .order('name', { ascending: true });
        
        if (data) setBarangays(data);
        if (error) console.error('Error fetching barangays:', error);
      } else {
        // Mock data
        setBarangays([
          {
            id: '1',
            name: 'Ampid I',
            sk_chairperson: 'John Doe',
            youth_population: 1250,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Ampid II',
            sk_chairperson: 'Jane Smith',
            youth_population: 980,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Banaba',
            sk_chairperson: 'Mike Johnson',
            youth_population: 2100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchBarangays();
  }, []);

  const columns = [
    { 
      header: 'Barangay Name', 
      accessor: (b: Barangay) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <MapPin size={16} />
          </div>
          <span className="font-bold text-slate-100">{b.name}</span>
        </div>
      )
    },
    { 
      header: 'SK Chairperson', 
      accessor: (b: Barangay) => (
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <User size={14} className="text-slate-400" />
          {b.sk_chairperson || 'Not set'}
        </div>
      )
    },
    { 
      header: 'Youth Population', 
      accessor: (b: Barangay) => (
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Users size={14} className="text-slate-400" />
          {b.youth_population.toLocaleString()}
        </div>
      )
    },
  ];

  const filteredBarangays = barangays.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Barangay Management</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage barangay-level data and SK leadership information.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Add Barangay
        </button>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search barangays..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#12263a] border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredBarangays} 
        isLoading={isLoading}
        onEdit={(b) => console.log('Edit', b)}
        onDelete={(b) => console.log('Delete', b)}
      />
    </div>
  );
};

