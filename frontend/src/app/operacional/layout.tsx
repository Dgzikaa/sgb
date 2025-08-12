'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DarkSidebarLayout } from '@/components/layouts';

export default function OperacionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredModule="operacoes">
      <DarkSidebarLayout>{children}</DarkSidebarLayout>
    </ProtectedRoute>
  );
}
