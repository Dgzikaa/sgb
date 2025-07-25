import { ReactNode } from 'react';
import { SkeletonType } from '@/hooks/usePageLoading';
import {
  DashboardSkeleton,
  ChecklistSkeleton,
  RelatorioSkeleton,
  ConfiguracoesSkeleton,
  OperacoesSkeleton,
  VisaoGeralSkeleton,
  Marketing360Skeleton,
  FuncionarioSkeleton,
  FullScreenSkeleton,
} from './page-skeletons';

interface PageLoadingWrapperProps {
  loading: boolean;
  skeletonType: SkeletonType;
  loadingMessage?: string;
  error?: string | null;
  children: ReactNode;
  fallbackSkeleton?: ReactNode;
}

export default function PageLoadingWrapper({
  children,
  loading: isLoading,
  error,
  skeletonType = 'fullscreen',
  loadingMessage,
  fallbackSkeleton,
}: PageLoadingWrapperProps) {
  // Renderizar erro se houver
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center card-dark p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ops! Algo deu errado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary-dark px-6 py-2"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderizar skeleton se estiver carregando
  if (isLoading) {
    // Se há um fallback customizado, usar ele
    if (fallbackSkeleton) {
      return <>{fallbackSkeleton}</>;
    }

    // Renderizar skeleton baseado no tipo
    switch (skeletonType) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'checklist':
        return <ChecklistSkeleton />;
      case 'relatorio':
        return <RelatorioSkeleton />;
      case 'configuracoes':
        return <ConfiguracoesSkeleton />;
      case 'operacoes':
        return <OperacoesSkeleton />;
      case 'visao-geral':
        return <VisaoGeralSkeleton />;
      case 'marketing-360':
        return <Marketing360Skeleton />;
      case 'funcionario':
        return <FuncionarioSkeleton />;
      case 'fullscreen':
      default:
        return <FullScreenSkeleton />;
    }
  }

  // Renderizar conteúdo normal
  return <>{children}</>;
}

// Componente HOC (Higher Order Component) para páginas
export function withPageLoading<T extends object>(
  Component: React.ComponentType<T>,
  skeletonType: SkeletonType = 'fullscreen'
) {
  return function WrappedComponent(
    props: T & {
      loading?: boolean;
      error?: string | null;
      loadingMessage?: string;
    }
  ) {
    const {
      loading = false,
      error = null,
      loadingMessage,
      ...componentProps
    } = props;

    return (
      <PageLoadingWrapper
        loading={loading}
        skeletonType={skeletonType}
        loadingMessage={loadingMessage}
        error={error}
      >
        <Component {...(componentProps as T)} />
      </PageLoadingWrapper>
    );
  };
}

// Hook para usar com páginas
export function usePageWrapper(skeletonType: SkeletonType = 'fullscreen') {
  return function PageWrapper({
    loading,
    error,
    loadingMessage,
    children,
    fallbackSkeleton,
  }: {
    loading: boolean;
    error?: string | null;
    loadingMessage?: string;
    children: ReactNode;
    fallbackSkeleton?: ReactNode;
  }) {
    return (
      <PageLoadingWrapper
        loading={loading}
        skeletonType={skeletonType}
        loadingMessage={loadingMessage}
        error={error}
        fallbackSkeleton={fallbackSkeleton}
      >
        {children}
      </PageLoadingWrapper>
    );
  };
}
