'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sistema de Toast/Feedback moderno para Zykor
 * Notificações visuais elegantes e animadas
 */

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

// Hook para usar toasts
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}

// Provider de Toasts
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration || 5000
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });

    if ((newToast.duration || 0) > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration || 5000);
    }

    return id;
  }, [maxToasts, removeToast]);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className={cn('fixed z-50 flex flex-col space-y-2', positionClasses[position])}>
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem 
              key={toast.id} 
              toast={toast} 
              onRemove={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Componente individual de Toast
interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2
  };

  const Icon = icons[toast.type];

  const typeStyles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    loading: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
  };

  const iconStyles = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
    loading: 'text-gray-500 dark:text-gray-400 animate-spin'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'max-w-sm w-full border rounded-lg shadow-lg backdrop-blur-sm',
        'pointer-events-auto relative overflow-hidden',
        typeStyles[toast.type]
      )}
    >
      {/* Progress bar para loading */}
      {toast.type === 'loading' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 4,
              ease: 'linear',
              repeat: Infinity
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconStyles[toast.type])} />
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">
              {toast.title}
            </h4>
            
            {toast.description && (
              <p className="text-sm opacity-90">
                {toast.description}
              </p>
            )}
            
            {toast.action && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                {toast.action.label}
              </motion.button>
            )}
          </div>

          {/* Close button */}
          {!toast.persistent && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook de conveniência para diferentes tipos de toast
export function useZykorToast() {
  const { addToast, removeToast, clearAllToasts } = useToast();

  return {
    success: (title: string, description?: string, options?: Partial<ToastData>) => 
      addToast({ type: 'success', title, description, ...options }),
    
    error: (title: string, description?: string, options?: Partial<ToastData>) => 
      addToast({ type: 'error', title, description, ...options }),
    
    warning: (title: string, description?: string, options?: Partial<ToastData>) => 
      addToast({ type: 'warning', title, description, ...options }),
    
    info: (title: string, description?: string, options?: Partial<ToastData>) => 
      addToast({ type: 'info', title, description, ...options }),
    
    loading: (title: string, description?: string) => 
      addToast({ type: 'loading', title, description, persistent: true }),
    
    // Métodos específicos para Zykor
    syncSuccess: (entity: string) => 
      addToast({ 
        type: 'success', 
        title: 'Sincronização concluída', 
        description: `${entity} sincronizado com sucesso` 
      }),
    
    syncError: (entity: string, error?: string) => 
      addToast({ 
        type: 'error', 
        title: 'Erro na sincronização', 
        description: error || `Falha ao sincronizar ${entity}`,
        duration: 8000
      }),
    
    checklistCompleted: (checklistName: string) => 
      addToast({ 
        type: 'success', 
        title: 'Checklist concluído', 
        description: `${checklistName} foi marcado como completo` 
      }),
    
    salesAlert: (amount: number, barName: string) => 
      addToast({ 
        type: 'info', 
        title: 'Meta de vendas atingida!', 
        description: `${barName} atingiu R$ ${amount.toLocaleString()} hoje`,
        duration: 10000
      }),
    
    systemMaintenance: (message: string) => 
      addToast({ 
        type: 'warning', 
        title: 'Manutenção do sistema', 
        description: message,
        persistent: true
      }),
    
    aiResponse: (query: string) => 
      addToast({ 
        type: 'info', 
        title: 'IA processando consulta', 
        description: `Analisando: "${query}"`,
        duration: 3000
      }),
    
    remove: removeToast,
    clearAll: clearAllToasts
  };
}

// Componente para confirmações com toast
interface ConfirmToastProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'error' | 'info';
}

export function useConfirmToast() {
  const { addToast } = useToast();

  return (options: ConfirmToastProps) => {
    addToast({
      type: options.type || 'warning',
      title: options.title,
      description: options.description,
      persistent: true,
      action: {
        label: options.confirmLabel || 'Confirmar',
        onClick: options.onConfirm
      }
    });
  };
}

export default ToastProvider;
