'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface DataTableProProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  dense?: boolean;
  stickyHeader?: boolean;
}

export function DataTablePro<T extends Record<string, any>>({
  columns,
  data,
  className,
  dense = false,
  stickyHeader = true,
}: DataTableProProps<T>) {
  return (
    <div className={cn('card-dark overflow-auto', className)}>
      <table className="table-dark w-full">
        <thead className={cn('table-header-dark', stickyHeader && 'sticky top-0 z-10')}>
          <tr className="table-row-dark">
            {columns.map((col, idx) => (
              <th
                key={String(col.key) + idx}
                className={cn(
                  'px-4 py-3 text-left text-gray-700 dark:text-gray-200 font-medium',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className={cn('table-row-dark', dense ? 'h-10' : 'h-12')}>
              {columns.map((col, cIdx) => (
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
        </tbody>
      </table>
    </div>
  );
}

export default DataTablePro;


