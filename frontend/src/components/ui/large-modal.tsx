'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'large' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  footerClassName?: string;
  hideFooter?: boolean;
}

/**
 * Modal Global Padronizado - ZYKOR
 * 
 * Modal grande com barra de rolagem automática que resolve todos os problemas de UI
 * 
 * Tamanhos disponíveis:
 * - default: max-w-2xl
 * - large: max-w-4xl (recomendado para formulários)
 * - xl: max-w-5xl
 * - 2xl: max-w-6xl
 * - 3xl: max-w-7xl
 * - full: max-w-[95vw]
 * 
 * Características:
 * - ✅ Barra de rolagem automática (max-h-[85vh])
 * - ✅ Responsivo em todas as telas
 * - ✅ Dark mode completo
 * - ✅ Padding adequado para não cortar bordas
 * - ✅ Footer fixo no bottom
 * - ✅ Animações suaves
 * 
 * Exemplo de uso:
 * ```tsx
 * <LargeModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Título do Modal"
 *   description="Descrição opcional"
 *   size="large"
 *   onSave={handleSave}
 *   loading={saving}
 * >
 *   <div className="modal-form-grid">
 *     // Seu conteúdo aqui
 *   </div>
 * </LargeModal>
 * ```
 */
export function LargeModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveText = 'Salvar',
  cancelText = 'Cancelar',
  saveDisabled = false,
  loading = false,
  size = 'large',
  className,
  footerClassName,
  hideFooter = false,
}: LargeModalProps) {
  const sizeClasses = {
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    full: 'max-w-[95vw]',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Tamanho
          sizeClasses[size],
          'w-full',
          // Layout com scroll
          'max-h-[85vh]',
          'flex flex-col',
          // Espaçamento
          'p-0',
          // Dark mode
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          // Responsividade
          'mx-4 sm:mx-auto',
          className
        )}
      >
        {/* Header - fixo no topo */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Content - com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer - fixo no bottom */}
        {!hideFooter && (
          <div className={cn(
            "flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700",
            "bg-gray-50 dark:bg-gray-900/50",
            footerClassName
          )}>
            <DialogFooter className="flex items-center gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => onOpenChange(false))}
                disabled={loading}
                className="inline-flex flex-row items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                {cancelText}
              </Button>

              {onSave && (
                <Button
                  type="button"
                  onClick={onSave}
                  disabled={saveDisabled || loading}
                  className="inline-flex flex-row items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Salvando...' : saveText}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente de campo de formulário otimizado para LargeModal
 */
interface ModalFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  fullWidth?: boolean;
}

export function ModalField({
  label,
  children,
  required = false,
  error,
  description,
  className,
  fullWidth = false,
}: ModalFieldProps) {
  return (
    <div className={cn(
      'space-y-2',
      fullWidth && 'md:col-span-2',
      className
    )}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/**
 * Grid de formulário otimizado para LargeModal
 */
interface ModalFormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ModalFormGrid({ children, columns = 2, className }: ModalFormGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[columns],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Seção dentro do modal
 */
interface ModalSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function ModalSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: ModalSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn('space-y-4', className)}>
      <div 
        className={cn(
          'border-b border-gray-200 dark:border-gray-700 pb-3',
          collapsible && 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {collapsible && (
            <span className="text-gray-400">
              {isOpen ? '−' : '+'}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {(!collapsible || isOpen) && (
        <div className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

