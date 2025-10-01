'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { usePageTitle } from '@/contexts/PageTitleContext';

export default function PlanejamentoComercialSimplePage() {
  const { user } = useUser();
  const { setPageTitle } = usePageTitle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPageTitle('🎯 Planejamento Comercial');
    return () => setPageTitle('');
  }, [setPageTitle]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Planejamento Comercial
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Página de teste simplificada para verificar se o erro persiste.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="font-medium text-gray-900 dark:text-white mb-2">Status</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuário: {user?.nome || 'Não logado'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Página carregada com sucesso!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

