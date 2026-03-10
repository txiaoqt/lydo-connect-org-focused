
import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Shield, MoreVertical } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '../types';

export const UsersPage = () => {
  const [users, setUsers] = useState<(UserProfile & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      let fetchedUsers: UserProfile[] = [];
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) fetchedUsers = data;
        if (error) console.error('Error fetching users:', error);
      } else {
        // Mock data
        fetchedUsers = [
          {
            user_id: '1',
            email: 'juan.delacruz@example.com',
            full_name: 'Juan Dela Cruz',
            display_name: 'JuanDC',
            contact_number: '09123456789',
            municipality: 'San Mateo, Rizal',
            notifications: true,
            show_email_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            user_id: '2',
            email: 'maria.clara@example.com',
            full_name: 'Maria Clara',
            display_name: 'MariaC',
            contact_number: '09987654321',
            municipality: 'San Mateo, Rizal',
            notifications: true,
            show_email_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];
      }
      
      // Map user_id to id for DataTable
      setUsers(fetchedUsers.map(u => ({ ...u, id: u.user_id })));
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  const columns: { header: string; accessor: keyof (UserProfile & { id: string }) | ((u: UserProfile & { id: string }) => React.ReactNode) }[] = [
    { 
      header: 'User', 
      accessor: (u: UserProfile & { id: string }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{u.full_name || 'Anonymous'}</span>
            <span className="text-xs text-slate-400 font-medium">{u.display_name || '@user'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Contact Info', 
      accessor: (u: UserProfile & { id: string }) => (
        <div className="flex flex-col text-xs font-medium text-slate-300 gap-1">
          <div className="flex items-center gap-1">
            <Mail size={12} className="text-slate-400" />
            <span>{u.email}</span>
          </div>
          {u.contact_number && (
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              <span>{u.contact_number}</span>
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Location', 
      accessor: (u: UserProfile & { id: string }) => (
        <span className="text-xs font-medium text-slate-300">{u.municipality}</span>
      )
    },
    { 
      header: 'Joined', 
      accessor: (u: UserProfile & { id: string }) => (
        <span className="text-xs font-medium text-slate-400">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      )
    },
  ];

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">User Management</h1>
          <p className="text-slate-400 mt-1 font-medium">View and manage youth profiles and account information.</p>
        </div>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#12263a] border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        isLoading={isLoading}
        onEdit={(u) => console.log('Edit', u)}
        onView={(u) => console.log('View', u)}
      />
    </div>
  );
};

