'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';

interface StandardPageLayoutProps {
  children: ReactNode;
  className?: string;
  spacing?: 'normal' | 'tight' | 'loose';
  /** Se deve aplicar AuthGuard (default: true) */
  withAuth?: boolean;
}

const spacingClasses = {
  tight: 'space-y-4',
  normal: 'space-y-6',
  loose: 'space-y-8',
};

/**
 * StandardPageLayout - Layout padrão para conteúdo de páginas
 * 
 * OTIMIZADO: Removido MutationObserver que causava problemas de performance.
 * O dark mode agora é tratado via classes CSS utilitárias no globals.css
 * 
 * Para dark mode, use as classes utilitárias:
 * - card-dark (background, border, shadow)
 * - card-title-dark (títulos)
 * - card-description-dark (descrições)
 * - btn-primary-dark, btn-secondary-dark (botões)
 * - input-dark, select-dark (formulários)
 * - text-gray-900 dark:text-white (textos)
 * 
 * @example
 * <StandardPageLayout>
 *   <div className="card-dark p-6">
 *     <h1 className="card-title-dark">Título</h1>
 *   </div>
 * </StandardPageLayout>
 */
export function StandardPageLayout({
  children,
  className,
  spacing = 'normal',
  withAuth = true,
}: StandardPageLayoutProps) {
  const content = (
    <div
      className={cn(
        'transition-colors duration-200',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );

  if (withAuth) {
    return <AuthGuard>{content}</AuthGuard>;
  }

  return content;
}

export default StandardPageLayout;
