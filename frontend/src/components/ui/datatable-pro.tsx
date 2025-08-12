'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  toolbarTitle?: string;
  searchable?: boolean;
  initialVisibleColumns?: string[];
  selectableRows?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  actions?: React.ReactNode;
}

export function DataTablePro<T extends Record<string, any>>({
  columns,
  data,
  className,
  dense = false,
  stickyHeader = true,
  toolbarTitle,
  searchable = true,
  initialVisibleColumns,
  selectableRows = false,
  onSelectionChange,
  actions,
}: DataTableProProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [visibleCols, setVisibleCols] = useState<string[]>(
    initialVisibleColumns ?? columns.map(c => String(c.key))
  );
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set());

  const visibleColumns = useMemo(
    () => columns.filter(c => visibleCols.includes(String(c.key))),
    [columns, visibleCols]
  );

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col.key as keyof T] ?? '').toLowerCase().includes(q))
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const sortedCopy = [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof T];
      const bv = b[sortKey as keyof T];
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return av - bv;
      }
      return String(av).localeCompare(String(bv));
    });
    return sortDir === 'asc' ? sortedCopy : sortedCopy.reverse();
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  const allSelected = selectableRows && sorted.length > 0 && sorted.every((_, i) => selectedIdxs.has(i));
  const toggleSelectAll = () => {
    if (!selectableRows) return;
    const next = new Set<number>();
    if (!allSelected) {
      sorted.forEach((_, i) => next.add(i));
    }
    setSelectedIdxs(next);
    onSelectionChange?.(Array.from(next).map(i => sorted[i]));
  };

  const toggleRow = (idx: number) => {
    if (!selectableRows) return;
    const next = new Set(selectedIdxs);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIdxs(next);
    onSelectionChange?.(Array.from(next).map(i => sorted[i]));
  };

  return (
    <div className={cn('card-dark overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {toolbarTitle && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{toolbarTitle}</h3>
          )}
          {/* Column visibility */}
          <div className="flex items-center gap-2">
            {columns.map(col => (
              <label key={String(col.key)} className="text-xs text-gray-600 dark:text-gray-400 inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={visibleCols.includes(String(col.key))}
                  onChange={(e) => {
                    const key = String(col.key);
                    setVisibleCols(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key));
                  }}
                />
                {col.header}
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {searchable && (
            <input
              placeholder="Pesquisar..."
              className="input-dark px-3 py-2 text-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="table-dark w-full">
          <thead className={cn('table-header-dark', stickyHeader && 'sticky top-0 z-10')}>
            <tr className="table-row-dark">
              {selectableRows && (
                <th className="px-4 py-3">
                  <input type="checkbox" className="accent-blue-600" checked={allSelected} onChange={toggleSelectAll} />
                </th>
              )}
              {visibleColumns.map((col, idx) => (
                <th
                  key={String(col.key) + idx}
                  className={cn(
                    'px-4 py-3 text-left text-gray-700 dark:text-gray-200 font-medium select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer'
                  )}
                  style={{ width: col.width }}
                  scope="col"
                  onClick={() => toggleSort(String(col.key), col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === String(col.key) && (
                      <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, rIdx) => (
              <tr key={rIdx} className={cn('table-row-dark', dense ? 'h-10' : 'h-12')}>
                {selectableRows && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedIdxs.has(rIdx)}
                      onChange={() => toggleRow(rIdx)}
                    />
                  </td>
                )}
                {visibleColumns.map((col, cIdx) => (
                  <td
                    key={String(col.key) + cIdx}
                    className={cn(
                      'table-cell-dark px-4 py-3 align-middle',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={(selectableRows ? 1 : 0) + visibleColumns.length} className="px-4 py-6 text-center text-gray-600 dark:text-gray-400">
                  Nenhum dado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTablePro;


