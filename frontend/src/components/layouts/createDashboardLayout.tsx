'use client';

import { ReactNode } from 'react';
import { DarkSidebarLayout } from './DarkSidebarLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface CreateDashboardLayoutOptions {
  /** Módulo requerido para acesso (opcional) */
  requiredModule?: string;
  /** Role requerida para acesso (opcional) */
  requiredRole?: 'admin' | 'manager' | 'funcionario';
}

/**
 * Factory function para criar layouts de dashboard padronizados
 * 
 * Isso elimina a necessidade de duplicar código em cada pasta.
 * 
 * @example
 * // Em qualquer layout.tsx:
 * export { createDashboardLayout as default } from '@/components/layouts/createDashboardLayout';
 * 
 * @example
 * // Com permissões específicas:
 * import { createProtectedDashboardLayout } from '@/components/layouts/createDashboardLayout';
 * export default createProtectedDashboardLayout({ requiredRole: 'admin' });
 */

// Layout padrão simples (mais comum)
export function SimpleDashboardLayout({ children }: { children: ReactNode }) {
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
}

// Função para criar layouts com proteção
export function createProtectedDashboardLayout(options: CreateDashboardLayoutOptions) {
  return function ProtectedDashboardLayout({ children }: { children: ReactNode }) {
    return (
      <ProtectedRoute 
        requiredModule={options.requiredModule}
        requiredRole={options.requiredRole}
      >
        <DarkSidebarLayout>{children}</DarkSidebarLayout>
      </ProtectedRoute>
    );
  };
}

// Export padrão para uso direto
export default SimpleDashboardLayout;

