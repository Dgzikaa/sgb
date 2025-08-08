'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function OperacionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredModule="operacoes">
      {children}
    </ProtectedRoute>
  );
}
