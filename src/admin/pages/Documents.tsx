
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, Calendar, Tag } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DisclosureDocument } from '../types';
import { format } from 'date-fns';

export const Documents = () => {
  const [docs, setDocs] = useState<DisclosureDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('disclosure_documents')
          .select('*')
          .order('published_date', { ascending: false });
        
        if (data) setDocs(data);
        if (error) console.error('Error fetching documents:', error);
      } else {
        // Mock data
        setDocs([
          {
            id: '1',
            doc_code: 'CBYDP-2024-AMPID1',
            title: 'CBYDP 2024 - Barangay Ampid I',
            document_type: 'cbydp',
            fiscal_year: 2024,
            quarter: 'q1',
            applies_to_all_barangays: false,
            published_date: '2024-01-15',
            file_size_bytes: 2450000,
            file_mime_type: 'application/pdf',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            doc_code: 'ABYIP-2024-GEN',
            title: 'Annual Budget 2024 - General Fund',
            document_type: 'annual_budget',
            fiscal_year: 2024,
            quarter: 'q1',
            applies_to_all_barangays: true,
            published_date: '2024-01-10',
            file_size_bytes: 5600000,
            file_mime_type: 'application/pdf',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchDocs();
  }, []);

  const columns = [
    { 
      header: 'Document Title', 
      accessor: (d: DisclosureDocument) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{d.title}</span>
            <span className="text-xs text-slate-400 font-medium">{d.doc_code}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Type', 
      accessor: (d: DisclosureDocument) => (
        <div className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-lg w-fit uppercase">
          <Tag size={12} />
          {d.document_type.replace('_', ' ')}
        </div>
      )
    },
    { 
      header: 'Fiscal Period', 
      accessor: (d: DisclosureDocument) => (
        <div className="flex flex-col text-xs font-medium text-slate-300">
          <span>FY {d.fiscal_year}</span>
          <span className="text-slate-400 uppercase">{d.quarter}</span>
        </div>
      )
    },
    { 
      header: 'Published', 
      accessor: (d: DisclosureDocument) => (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <Calendar size={12} className="text-slate-400" />
          {format(new Date(d.published_date), 'MMM d, yyyy')}
        </div>
      )
    },
    { 
      header: 'File Info', 
      accessor: (d: DisclosureDocument) => (
        <div className="flex flex-col text-xs font-medium text-slate-400">
          <span>{d.file_mime_type?.split('/')[1].toUpperCase() || 'PDF'}</span>
          <span>{(d.file_size_bytes ? (d.file_size_bytes / 1024 / 1024).toFixed(2) : '0')} MB</span>
        </div>
      )
    },
  ];

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.doc_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Transparency Documents</h1>
          <p className="text-slate-400 mt-1 font-medium">Upload and manage public disclosure documents and financial reports.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Upload Document
        </button>
      </header>

      <div className="flex items-center gap-4 bg-[#0f1c2b] p-4 rounded-2xl border border-[#1f3348] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#12263a] border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredDocs} 
        isLoading={isLoading}
        onEdit={(d) => console.log('Edit', d)}
        onDelete={(d) => console.log('Delete', d)}
        onView={(d) => window.open(d.public_url, '_blank')}
      />
    </div>
  );
};

