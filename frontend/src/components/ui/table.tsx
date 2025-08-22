import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

interface ModernTableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered' | 'minimal' | 'glass';
  animated?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, ModernTableProps>(
  ({ className, variant = 'default', animated = true, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm',
      striped: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm [&_tbody_tr:nth-child(odd)]:bg-gray-50 dark:[&_tbody_tr:nth-child(odd)]:bg-gray-900/50',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md [&_td]:border-r [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_th]:border-r [&_th]:border-gray-200 dark:[&_th]:border-gray-700',
      minimal: 'bg-transparent [&_tr]:border-b [&_tr]:border-gray-100 dark:[&_tr]:border-gray-800',
      glass: 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl shadow-xl'
    };

    return (
      <motion.div 
        className="relative w-full overflow-hidden"
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table
            ref={ref}
            className={cn(
              'w-full caption-bottom text-sm',
              variantStyles[variant],
              className
            )}
            {...(props as any)}
          />
        </div>
      </motion.div>
    );
  }
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

interface ModernTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  animated?: boolean;
  selected?: boolean;
  index?: number;
}

const TableRow = React.forwardRef<HTMLTableRowElement, ModernTableRowProps>(
  ({ className, animated = true, selected = false, index = 0, ...props }, ref) => (
    <motion.tr
      ref={ref}
      initial={animated ? { opacity: 0, x: -20 } : undefined}
      animate={animated ? { opacity: 1, x: 0 } : undefined}
      transition={animated ? { duration: 0.3, delay: index * 0.05 } : undefined}
      whileHover={animated ? { 
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        scale: 1.001,
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 transition-all duration-200',
        'hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
        selected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
        className
      )}
      {...(props as any)}
    />
  )
);
TableRow.displayName = 'TableRow';

interface ModernTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  animated?: boolean;
}

const TableHead = React.forwardRef<HTMLTableCellElement, ModernTableHeadProps>(
  ({ className, sortable = false, sortDirection = null, onSort, animated = true, children, ...props }, ref) => (
    <motion.th
      ref={ref}
      initial={animated ? { opacity: 0, y: -10 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.3 } : undefined}
      className={cn(
        'h-14 px-4 text-left align-middle font-semibold text-gray-700 dark:text-gray-300',
        'bg-gray-50/50 dark:bg-gray-800/50',
        'border-b-2 border-gray-200 dark:border-gray-700',
        '[&:has([role=checkbox])]:pr-0',
        sortable && 'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...(props as any)}
    >
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        {sortable && (
          <motion.div
            className="flex flex-col"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence>
              {sortDirection === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
              {sortDirection === 'asc' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-blue-500"
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.div>
              )}
              {sortDirection === 'desc' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-blue-500"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.th>
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Advanced Table Components

interface TableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  searchValue = '',
  onSearchChange,
  onRefresh,
  onExport,
  children,
  loading = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Input
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-64"
            variant="minimal"
          />
        </div>
        {children}
      </div>
      
      <div className="flex items-center space-x-2">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            loading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Atualizar
          </Button>
        )}
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
        )}
      </div>
    </motion.div>
  );
};

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl"
    >
      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Mostrando {startItem} a {endItem} de {totalItems} resultados
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center space-x-2">
            <span>Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Anterior
        </Button>

        {getVisiblePages().map((page, index) => (
          <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {page === '...' ? (
              <span className="px-3 py-1 text-gray-400">...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )}
          </motion.div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Próximo
        </Button>
      </div>
    </motion.div>
  );
};

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

const TableActions: React.FC<TableActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  customActions = []
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const actions = [
    ...(onView ? [{ label: 'Visualizar', icon: <Eye className="w-4 h-4" />, onClick: onView }] : []),
    ...(onEdit ? [{ label: 'Editar', icon: <Edit className="w-4 h-4" />, onClick: onEdit }] : []),
    ...customActions,
    ...(onDelete ? [{ label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, variant: 'destructive' as const }] : []),
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
            >
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center space-x-2 px-3 py-2 text-sm text-left transition-colors',
                    action.variant === 'destructive'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableToolbar,
  TablePagination,
  TableActions,
};
