'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';
import { useGlobalLoading } from '@/components/ui/global-loading';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function OrcamentacaoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageTitle('💰 Orçamentação');
    return () => setPageTitle('');
  }, [setPageTitle]);

  if (loading) {
    return <GlobalLoadingComponent />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <GlobalLoadingComponent />
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Orçamentação
          </h1>
          
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Página em desenvolvimento - Build temporário
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
