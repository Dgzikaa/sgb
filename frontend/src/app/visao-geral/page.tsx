'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePageTitle } from '@/contexts/PageTitleContext';

export default function VisaoGeralPage() {
  const router = useRouter();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('📊 Visão Geral');
    // Redirecionar para a página correta de visão geral
    router.push('/relatorios/visao-geral');
  }, [router, setPageTitle]);

  return (
    <ProtectedRoute requiredModule="relatorios">
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecionando para Visão Geral...
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 