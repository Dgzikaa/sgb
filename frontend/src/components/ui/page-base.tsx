import React from 'react';
import { cn } from '@/lib/utils';

interface PageBaseProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

// Componente base da página
export function PageBase({ children, className }: PageBaseProps) {
  return (
    <div
      className={cn(
        'p-6 max-w-7xl mx-auto',
        'text-gray-900 dark:text-white',
        className
      )}
    >
      {children}
    </div>
  );
}

// Header da página com estilos padronizados
export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {badge && (
          <span className="text-sm text-gray-700 dark:text-gray-300">{badge}</span>
        )}
      </div>
      {description && (
        <p className="text-gray-700 dark:text-gray-400">{description}</p>
      )}
      {children}
    </div>
  );
}

// Conteúdo da página
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div
      className={cn(
        'space-y-6',
        'text-gray-900 dark:text-white',
        className
      )}
    >
      {children}
    </div>
  );
}

// Card com estilos padronizados
export function PageCard({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        'card-dark',
        className
      )}
    >
      {title && (
        <div
          className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', headerClassName)}
        >
          <h3 className="card-title-dark">{title}</h3>
        </div>
      )}
      <div
        className={cn(
          'p-6',
          'text-gray-900 dark:text-white',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Grid responsivo padronizado
export function PageGrid({
  children,
  columns = 'grid-cols-1 lg:grid-cols-2',
  className,
}: {
  children: React.ReactNode;
  columns?: string;
  className?: string;
}) {
  return <div className={cn('grid gap-6', columns, className)}>{children}</div>;
}

// Texto com cores padronizadas
export function PageText({
  children,
  variant = 'body',
  className,
}: {
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'muted';
  className?: string;
}) {
  const variants = {
    title: 'text-xl font-bold text-gray-900 dark:text-white',
    subtitle: 'text-lg font-semibold text-gray-900 dark:text-white',
    body: 'text-sm text-gray-900 dark:text-white',
    caption: 'text-xs text-gray-600 dark:text-gray-400',
    muted: 'text-sm text-gray-500 dark:text-gray-500',
  };

  return <span className={cn(variants[variant], className)}>{children}</span>;
}
