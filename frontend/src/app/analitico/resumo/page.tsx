'use client';

import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import ResumoSemanalProdutos from '@/components/ferramentas/ResumoSemanalProdutos';

export default function ResumoAnaliticoPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('📈 Resumo Semanal');
    return () => setPageTitle('');
  }, [setPageTitle]);

  return (
    <div className="min-h-[calc(100vh-8px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-1 pb-6 max-w-[98vw]">
        {/* Componente de Resumo Semanal */}
        <ResumoSemanalProdutos />
      </div>
    </div>
  );
}
