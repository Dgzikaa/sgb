'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DarkHeader } from './DarkHeader';
import { ModernSidebar } from './ModernSidebar';
import { BottomNavigation } from './BottomNavigation';
import { PageTitleProvider } from '@/contexts/PageTitleContext';
import AuthGuard from '@/components/auth/AuthGuard';

interface DarkSidebarLayoutProps {
  children: ReactNode;
}

// Componente wrapper que aplica estilos globais automaticamente
function GlobalPageWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Aplicar classes de dark mode automaticamente em elementos sem elas
    const applyDarkModeClasses = () => {
      // Cards sem dark mode
      const cards = document.querySelectorAll(
        '[class*="bg-white"]:not([class*="dark:"])'
      );
      cards.forEach(card => {
        if (card.classList.contains('bg-white')) {
          card.classList.add('dark:bg-gray-800', 'dark:border-gray-700');
        }
      });

      // Textos sem dark mode
      const grayTexts = document.querySelectorAll(
        '[class*="text-gray-900"]:not([class*="dark:"])'
      );
      grayTexts.forEach(text => {
        if (text.classList.contains('text-gray-900')) {
          text.classList.add('dark:text-white');
        }
      });

      const grayTexts700 = document.querySelectorAll(
        '[class*="text-gray-700"]:not([class*="dark:"])'
      );
      grayTexts700.forEach(text => {
        if (text.classList.contains('text-gray-700')) {
          text.classList.add('dark:text-gray-300');
        }
      });

      const grayTexts600 = document.querySelectorAll(
        '[class*="text-gray-600"]:not([class*="dark:"])'
      );
      grayTexts600.forEach(text => {
        if (text.classList.contains('text-gray-600')) {
          text.classList.add('dark:text-gray-400');
        }
      });

      // Borders sem dark mode
      const borders = document.querySelectorAll(
        '[class*="border-gray-200"]:not([class*="dark:"])'
      );
      borders.forEach(border => {
        if (border.classList.contains('border-gray-200')) {
          border.classList.add('dark:border-gray-700');
        }
      });

      // Inputs sem dark mode
      const inputs = document.querySelectorAll(
        'input:not([class*="dark:"]), textarea:not([class*="dark:"]), select:not([class*="dark:"])'
      );
      inputs.forEach(input => {
        input.classList.add(
          'dark:bg-gray-700',
          'dark:border-gray-600',
          'dark:text-white',
          'dark:placeholder-gray-400'
        );
      });

      // Tables sem dark mode
      const tables = document.querySelectorAll('table:not([class*="dark:"])');
      tables.forEach(table => {
        table.classList.add('dark:bg-gray-800');

        const ths = table.querySelectorAll('th:not([class*="dark:"])');
        ths.forEach(th => {
          th.classList.add('dark:text-white', 'dark:bg-gray-800');
        });

        const tds = table.querySelectorAll('td:not([class*="dark:"])');
        tds.forEach(td => {
          td.classList.add('dark:text-gray-100', 'dark:border-gray-700');
        });

        const trs = table.querySelectorAll('tr:not([class*="dark:"])');
        trs.forEach(tr => {
          tr.classList.add('dark:hover:bg-gray-700');
        });
      });
    };

    // Aplicar na carga inicial
    applyDarkModeClasses();

    // Observar mudanças no DOM e aplicar automaticamente
    const observer = new MutationObserver(applyDarkModeClasses);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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
      <PageTitleProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <DarkHeader />
          <div className="flex">
            <ModernSidebar />
            <main className="flex-1 transition-all duration-300 ease-in-out md:ml-16 lg:ml-64">
              {/* Aumentando para pt-28 para garantir espaço suficiente abaixo do header fixo */}
              <div className="pt-28 p-4 md:p-6 pb-24 md:pb-6">
                <GlobalPageWrapper>{children}</GlobalPageWrapper>
              </div>
            </main>
          </div>
          <BottomNavigation />
        </div>
      </PageTitleProvider>
    </AuthGuard>
  );
}
