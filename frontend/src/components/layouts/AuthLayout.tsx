'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout - Layout para páginas de autenticação (login, etc.)
 * 
 * Layout simples sem sidebar, header ou navegação
 * Usado para rotas públicas como login
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {children}
    </div>
  );
}

export default AuthLayout;

