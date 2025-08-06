'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';

export default function HomePage() {
  const router = useRouter();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('🏠 Redirecionando...');
    // Redirecionar imediatamente para Visão Geral
    router.replace('/visao-geral');
  }, [router, setPageTitle]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecionando para Visão Geral...
        </p>
      </div>
    </div>
  );
}