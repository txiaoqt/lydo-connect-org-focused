
import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Plus, Search } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Role {
  id: number;
  code: string;
  label: string;
  description: string;
  created_at: string;
}

export const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('id', { ascending: true });
        
        if (data) setRoles(data);
        if (error) console.error('Error fetching roles:', error);
      } else {
        // Mock data
        setRoles([
          {
            id: 1,
            code: 'super_admin',
            label: 'Super Administrator',
            description: 'Full access to all features and settings.',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            code: 'lydo_staff',
            label: 'LYDO Staff',
            description: 'Can manage programs, events, and organizations.',
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            code: 'sk_official',
            label: 'SK Official',
            description: 'Can manage barangay-level data and activities.',
            created_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  const columns = [
    { 
      header: 'Role Label', 
      accessor: (r: Role) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            r.code === 'super_admin' ? 'bg-rose-50 text-rose-600' :
            r.code === 'lydo_staff' ? 'bg-blue-50 text-blue-600' :
            'bg-indigo-50 text-indigo-600'
          }`}>
            {r.code === 'super_admin' ? <ShieldAlert size={20} /> :
             r.code === 'lydo_staff' ? <ShieldCheck size={20} /> :
             <Shield size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{r.label}</span>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{r.code}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Description', 
      accessor: 'description' as const,
      className: 'max-w-[300px]'
    },
    { 
      header: 'Created', 
      accessor: (r: Role) => (
        <span className="text-xs font-medium text-slate-400">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Roles & Permissions</h1>
          <p className="text-slate-400 mt-1 font-medium">Define and manage access levels for administrative users.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Create New Role
        </button>
      </header>

      <DataTable 
        columns={columns} 
        data={roles} 
        isLoading={isLoading}
        onEdit={(r) => console.log('Edit', r)}
        onDelete={(r) => console.log('Delete', r)}
      />
    </div>
  );
};

