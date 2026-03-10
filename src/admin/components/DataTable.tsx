
import React from 'react';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  onView,
  isLoading 
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#1f3348] bg-[#0f1c2b]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#12263a] border-b border-[#1f3348]">
              {columns.map((column, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2f46]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#11253a] transition-colors group">
                  {columns.map((column, idx) => (
                    <td key={idx} className={`px-6 py-4 text-sm text-slate-300 ${column.className || ''}`}>
                      {typeof column.accessor === 'function' 
                        ? column.accessor(item) 
                        : (item[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onView && (
                          <button 
                            onClick={() => onView(item)}
                            className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(item)}
                            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item)}
                            className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

