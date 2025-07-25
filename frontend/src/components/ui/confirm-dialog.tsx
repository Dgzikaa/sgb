'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertTriangle,
  HelpCircle,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  details?: string[];
  danger?: boolean;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  isOpen: boolean;
}

const ConfirmDialogContext = createContext<
  ConfirmDialogContextValue | undefined
>(undefined);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      'useConfirmDialog must be used within a ConfirmDialogProvider'
    );
  }
  return context;
};

interface ConfirmDialogProviderProps {
  children: React.ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback(
    (dialogOptions: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise(resolve => {
        setOptions(dialogOptions);
        setResolvePromise(() => resolve);
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = async () => {
    if (!options || !resolvePromise) return;

    setIsLoading(true);

    try {
      if (options.onConfirm) {
        await options.onConfirm();
      }

      resolvePromise(true);
    } catch (error) {
      console.error('Erro ao executar confirmação:', error);
      resolvePromise(false);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      setOptions(null);
      setResolvePromise(null);
    }
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }

    if (resolvePromise) {
      resolvePromise(false);
    }

    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  };

  const getDialogStyles = () => {
    const type = options?.type || 'info';

    switch (type) {
      case 'danger':
        return {
          container:
            'max-w-md bg-gradient-to-br from-white to-red-50 border-0 shadow-2xl',
          header:
            'pb-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50',
          iconBg: 'bg-gradient-to-r from-red-500 to-rose-500',
          footer:
            'pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-red-50',
        };
      case 'warning':
        return {
          container:
            'max-w-md bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl',
          header:
            'pb-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50',
          iconBg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
          footer:
            'pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50',
        };
      case 'success':
        return {
          container:
            'max-w-md bg-gradient-to-br from-white to-green-50 border-0 shadow-2xl',
          header:
            'pb-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50',
          iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          footer:
            'pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-green-50',
        };
      default:
        return {
          container:
            'max-w-md bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl',
          header:
            'pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50',
          iconBg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          footer:
            'pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50',
        };
    }
  };

  const getDefaultIcon = () => {
    const type = options?.type || 'info';

    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-white" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-white" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-white" />;
      default:
        return <HelpCircle className="w-6 h-6 text-white" />;
    }
  };

  const getConfirmButtonStyles = () => {
    const type = options?.type || 'info';

    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl';
    }
  };

  const styles = getDialogStyles();

  return (
    <ConfirmDialogContext.Provider value={{ confirm, isOpen }}>
      {children}

      <Dialog open={isOpen} onOpenChange={() => !isLoading && handleCancel()}>
        <DialogContent className={styles.container}>
          <DialogHeader className={styles.header}>
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center shadow-lg`}
              >
                {options?.icon || getDefaultIcon()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  {options?.title}
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Confirme sua ação
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-gray-800 text-sm leading-relaxed">
                {options?.message}
              </div>

              {options?.details && options.details.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Detalhes:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {options.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {options?.danger && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium text-sm">
                        Ação irreversível!
                      </p>
                      <p className="text-red-700 text-sm">
                        Esta ação não pode ser desfeita. Tenha certeza antes de
                        continuar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className={styles.footer}>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300 px-4 py-2 border rounded-lg font-medium"
              >
                {options?.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`${getConfirmButtonStyles()} px-4 py-2 rounded-lg font-medium flex items-center gap-2 ml-auto`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  options?.confirmText || 'Confirmar'
                )}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};

// Hook global para usar os dialogs de confirmação
export const useGlobalConfirm = () => {
  const confirmDialog = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise(resolve => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('showConfirmDialog', {
            detail: { ...options, resolve },
          });
          window.dispatchEvent(event);
        }
      });
    },
    []
  );

  return {
    confirm: confirmDialog,
    // Helpers para diferentes tipos
    confirmDelete: (itemName: string, onConfirm?: () => void | Promise<void>) =>
      confirmDialog({
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir "${itemName}"?`,
        type: 'danger',
        confirmText: 'Sim, Excluir',
        cancelText: 'Cancelar',
        danger: true,
        onConfirm,
        icon: <Trash2 className="w-6 h-6 text-white" />,
      }),
    confirmAction: (
      title: string,
      message: string,
      onConfirm?: () => void | Promise<void>
    ) =>
      confirmDialog({
        title,
        message,
        type: 'warning',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        onConfirm,
      }),
    confirmDanger: (
      title: string,
      message: string,
      details?: string[],
      onConfirm?: () => void | Promise<void>
    ) =>
      confirmDialog({
        title,
        message,
        type: 'danger',
        confirmText: 'Prosseguir',
        cancelText: 'Cancelar',
        danger: true,
        details,
        onConfirm,
      }),
  };
};

// Componente para escutar eventos globais
export const GlobalConfirmListener: React.FC = () => {
  const { confirm } = useConfirmDialog();

  React.useEffect(() => {
    const handleShowConfirmDialog = (
      event: CustomEvent<
        ConfirmDialogOptions & { resolve: (value: boolean) => void }
      >
    ) => {
      const { resolve, ...options } = event.detail;
      confirm(options).then(resolve);
    };

    window.addEventListener(
      'showConfirmDialog',
      handleShowConfirmDialog as EventListener
    );
    return () =>
      window.removeEventListener(
        'showConfirmDialog',
        handleShowConfirmDialog as EventListener
      );
  }, [confirm]);

  return null;
};
