'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DarkHeader } from './DarkHeader';
import { ModernSidebarOptimized } from './ModernSidebarOptimized';
import { BottomNavigation } from './BottomNavigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DarkSidebarLayoutProps {
  children: ReactNode;
}

/**
 * DarkSidebarLayout - Layout principal com sidebar, header e navegação
 * 
 * OTIMIZADO: Removido MutationObserver que causava problemas de performance.
 * O dark mode agora é tratado via classes CSS utilitárias no globals.css
 * 
 * Componentes devem usar classes como:
 * - card-dark
 * - btn-primary-dark
 * - input-dark
 * - text-gray-900 dark:text-white
 */
export function DarkSidebarLayout({ children }: DarkSidebarLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Loading skeleton para evitar flash de conteúdo
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
          
          <div className="flex">
            {/* Sidebar skeleton - hidden on mobile */}
            <div className="hidden lg:block w-64 h-[calc(100vh-2.5rem)] bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />
            
            {/* Content skeleton */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <DarkHeader />
          <div className="flex flex-1">
            <ModernSidebarOptimized />
            <main className="flex-1 transition-all duration-200 ease-in-out overflow-y-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
          <BottomNavigation />
        </div>
      </ErrorBoundary>
    </AuthGuard>
  );
}

export default DarkSidebarLayout;
