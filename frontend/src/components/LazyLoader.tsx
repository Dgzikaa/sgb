'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
}

/**
 * ✅ Sistema de Lazy Loading profissional para componentes pesados
 * Reduz bundle size inicial e melhora performance
 */

// ✅ Fallback padrão otimizado
const DefaultFallback = () => (
  <div className="animate-pulse space-y-4 p-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

// ✅ Error Boundary para lazy loading
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-red-600 dark:text-red-400">
          <p>Erro ao carregar componente</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ HOC para criar componentes lazy
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <LazyErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback || <DefaultFallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

// ✅ Componente wrapper genérico
export function LazyLoader({ 
  children, 
  fallback, 
  errorFallback, 
  className 
}: LazyLoaderProps & { children: React.ReactNode }) {
  return (
    <div className={className}>
      <LazyErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback || <DefaultFallback />}>
          {children}
        </Suspense>
      </LazyErrorBoundary>
    </div>
  );
}

// ✅ Componentes lazy pré-configurados para páginas pesadas - TEMPORARIAMENTE DESABILITADOS
// export const LazyDashboard = createLazyComponent(
//   () => import('@/app/visao-geral/page-modern'),
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
//     {Array.from({ length: 6 }).map((_, i) => (
//       <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
//         <Skeleton className="h-6 w-3/4" />
//         <Skeleton className="h-4 w-1/2" />
//         <Skeleton className="h-20 w-full" />
//       </div>
//     ))}
//   </div>
// );

// export const LazyTerminal = createLazyComponent(
//   () => import('@/app/operacoes/terminal/page'),
//   <div className="p-6 space-y-4">
//     <Skeleton className="h-8 w-1/3" />
//     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//       {Array.from({ length: 8 }).map((_, i) => (
//         <Skeleton key={i} className="h-32" />
//       ))}
//     </div>
//   </div>
// );

// export const LazyReports = createLazyComponent(
//   () => import('@/app/estrategico/desempenho/page'),
//   <div className="p-6 space-y-6">
//     <Skeleton className="h-8 w-1/4" />
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       <Skeleton className="h-64" />
//       <Skeleton className="h-64" />
//     </div>
//     <Skeleton className="h-96 w-full" />
//   </div>
// );

// export const LazyChecklists = createLazyComponent(
//   () => import('@/app/configuracoes/checklists/page'),
//   <div className="p-6 space-y-4">
//     <Skeleton className="h-8 w-1/3" />
//     {Array.from({ length: 5 }).map((_, i) => (
//       <div key={i} className="border rounded-lg p-4 space-y-2">
//         <Skeleton className="h-6 w-2/3" />
//         <Skeleton className="h-4 w-1/2" />
//         <Skeleton className="h-4 w-3/4" />
//       </div>
//     ))}
//   </div>
// );

// ✅ Hook para lazy loading condicional
export function useLazyLoad(condition: boolean, delay: number = 100) {
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    if (condition) {
      const timer = setTimeout(() => setShouldLoad(true), delay);
      return () => clearTimeout(timer);
    }
  }, [condition, delay]);

  return shouldLoad;
}

export default LazyLoader;
