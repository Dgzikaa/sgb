'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DarkHeader } from './DarkHeader';
import { ModernSidebar } from './ModernSidebar';
import { BottomNavigation } from './BottomNavigation';
import { PageTitleProvider } from '@/contexts/PageTitleContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigationGuard, safeDOMOperation } from '@/hooks/useNavigationGuard';

interface DarkSidebarLayoutProps {
  children: ReactNode;
}

// Componente wrapper que aplica estilos globais de forma segura
function GlobalPageWrapper({ children }: { children: ReactNode }) {
  const [isApplying, setIsApplying] = useState(false);
  const { isNavigating } = useNavigationGuard({
    enableDebugMode: process.env.NODE_ENV === 'development',
  });

  useEffect(() => {
    // Aplicar classes de dark mode de forma mais segura
    const applyDarkModeClasses = () => {
      // Evitar aplicar durante navegações
      if (isApplying || isNavigating()) return;
      
      setIsApplying(true);
      
      try {
        // Verificar se o documento está pronto
        if (document.readyState !== 'complete') {
          setIsApplying(false);
          return;
        }

        // Cards sem dark mode (mais específico para evitar conflitos)
        safeDOMOperation(() => {
          const cards = document.querySelectorAll(
            '.bg-white:not(.dark\\:bg-gray-800):not([data-dark-applied])'
          );
          cards.forEach(card => {
            if (card.classList.contains('bg-white')) {
              card.classList.add('dark:bg-gray-800', 'dark:border-gray-700');
              card.setAttribute('data-dark-applied', 'true');
            }
          });
        }, undefined);

        // Textos sem dark mode - usando safeDOMOperation
        safeDOMOperation(() => {
          const grayTexts = document.querySelectorAll(
            '.text-gray-900:not(.dark\\:text-white):not([data-dark-applied])'
          );
          grayTexts.forEach(text => {
            if (text.classList.contains('text-gray-900')) {
              text.classList.add('dark:text-white');
              text.setAttribute('data-dark-applied', 'true');
            }
          });
        }, undefined);

        safeDOMOperation(() => {
          const grayTexts700 = document.querySelectorAll(
            '.text-gray-700:not(.dark\\:text-gray-300):not([data-dark-applied])'
          );
          grayTexts700.forEach(text => {
            if (text.classList.contains('text-gray-700')) {
              text.classList.add('dark:text-gray-300');
              text.setAttribute('data-dark-applied', 'true');
            }
          });
        }, undefined);

        safeDOMOperation(() => {
          const grayTexts600 = document.querySelectorAll(
            '.text-gray-600:not(.dark\\:text-gray-400):not([data-dark-applied])'
          );
          grayTexts600.forEach(text => {
            if (text.classList.contains('text-gray-600')) {
              text.classList.add('dark:text-gray-400');
              text.setAttribute('data-dark-applied', 'true');
            }
          });
        }, undefined);

        // Borders sem dark mode - usando safeDOMOperation
        safeDOMOperation(() => {
          const borders = document.querySelectorAll(
            '.border-gray-200:not(.dark\\:border-gray-700):not([data-dark-applied])'
          );
          borders.forEach(border => {
            if (border.classList.contains('border-gray-200')) {
              border.classList.add('dark:border-gray-700');
              border.setAttribute('data-dark-applied', 'true');
            }
          });
        }, undefined);

      } catch (error) {
        console.warn('⚠️ Erro ao aplicar dark mode automático:', error);
      } finally {
        setIsApplying(false);
      }
    };

    // Aplicar na carga inicial com delay
    const initialTimeout = setTimeout(applyDarkModeClasses, 100);

    // Observar mudanças no DOM de forma mais conservadora
    const observer = new MutationObserver((mutations) => {
      // Filtrar apenas mutações relevantes
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          return Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE
          );
        }
        return false;
      });

      if (hasRelevantChanges && !isApplying) {
        // Debounce para evitar chamadas excessivas
        clearTimeout((window as any).__darkModeTimeout);
        (window as any).__darkModeTimeout = setTimeout(applyDarkModeClasses, 200);
      }
    });

    // Observar apenas mudanças específicas
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      // Remover observação de atributos para evitar loops
    });

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout((window as any).__darkModeTimeout);
      observer.disconnect();
    };
  }, [isApplying, isNavigating]);

  return <div className="auto-dark-mode-wrapper">{children}</div>;
}

export function DarkSidebarLayout({ children }: DarkSidebarLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex">
            <div className="w-64 h-screen bg-gray-100 dark:bg-gray-800"></div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <PageTitleProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <DarkHeader />
            <div className="flex flex-1">
              <ModernSidebar />
              <main className="flex-1 transition-all duration-300 ease-in-out overflow-y-auto">
                <ErrorBoundary>
                  <GlobalPageWrapper>{children}</GlobalPageWrapper>
                </ErrorBoundary>
              </main>
            </div>
            <BottomNavigation />
          </div>
        </PageTitleProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}
