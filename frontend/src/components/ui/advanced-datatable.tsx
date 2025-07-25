'use client';

import { useState, useMemo, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'number' | 'date';
  filterOptions?: Array<{ value: string; label: string }>;
  width?: string;
  sticky?: boolean;
}

interface AdvancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function AdvancedDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Pesquisar...',
  className = '',
  emptyMessage = 'Nenhum dado encontrado',
  loading = false,
}: AdvancedDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>({
    key: '',
    direction: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar dados
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Filtro global
    if (globalFilter) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }

    // Filtros por coluna
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => {
          const cellValue = String(row[key] || '').toLowerCase();
          return cellValue.includes(filterValue.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, globalFilter, columnFilters]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginar dados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Total de páginas
  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Lidar com ordenação
  const handleSort = (key: string) => {
    if (!columns.find(col => col.key === key)?.sortable) return;

    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  // Atualizar filtro de coluna
  const updateColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setGlobalFilter('');
    setColumnFilters({});
    setCurrentPage(1);
  };

  // Obter ícone de ordenação
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (sortConfig.direction === 'asc')
      return <ChevronUp className="w-4 h-4 text-blue-600" />;
    if (sortConfig.direction === 'desc')
      return <ChevronDown className="w-4 h-4 text-blue-600" />;
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  // Calcular estatísticas
  const hasActiveFilters =
    globalFilter || Object.values(columnFilters).some(v => v);
  const showingResults = `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, sortedData.length)} de ${sortedData.length}`;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header com controles */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filtros e pesquisa */}
          <div className="flex flex-col sm:flex-row gap-3">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              {Object.values(columnFilters).filter(v => v).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.values(columnFilters).filter(v => v).length}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Estatísticas */}
          <div className="text-sm text-gray-600">
            Mostrando {showingResults} resultados
            {data.length !== sortedData.length && (
              <span className="text-blue-600 ml-1">
                (filtrado de {data.length} total)
              </span>
            )}
          </div>
        </div>

        {/* Filtros por coluna */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {columns
              .filter(col => col.filterable)
              .map(column => (
                <div key={String(column.key)}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {column.label}
                  </label>
                  {column.filterType === 'select' && column.filterOptions ? (
                    <Select
                      value={columnFilters[String(column.key)] || ''}
                      onValueChange={value =>
                        updateColumnFilter(String(column.key), value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {column.filterOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={`Filtrar ${column.label.toLowerCase()}...`}
                      value={columnFilters[String(column.key)] || ''}
                      onChange={e =>
                        updateColumnFilter(String(column.key), e.target.value)
                      }
                      className="h-8"
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`
                    text-left py-4 px-4 font-semibold text-gray-700 text-sm
                    ${column.width || 'min-w-[120px]'}
                    ${column.sticky ? 'sticky left-0 bg-gray-50 z-10 border-r border-gray-200' : ''}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                  `}
                  onClick={() =>
                    column.sortable && handleSort(String(column.key))
                  }
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      className={`
                        py-3 px-4 text-sm
                        ${column.sticky ? 'sticky left-0 bg-white z-10 border-r border-gray-200' : ''}
                      `}
                      style={{ width: column.width }}
                    >
                      {column.render
                        ? column.render(row, index)
                        : String(row[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
