'use client';

import { useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { ComparativoMensalNovo } from '@/components/visao-geral/ComparativoMensalNovo';
import { Calendar, BarChart3 } from 'lucide-react';

export default function VisaoMensalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('📅 Visão Mensal');
    return () => setPageTitle('');
  }, [setPageTitle]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-1 py-2 space-y-2">

        {/* Componente Principal */}
        <ComparativoMensalNovo />

        {/* Seção de Dicas */}
        <div className="card-dark p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Como Interpretar os Dados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Tendência Positiva:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Setas verdes indicam crescimento vs mês anterior
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Tendência Negativa:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Setas vermelhas indicam queda vs mês anterior
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Mês Atual:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Destacado com borda azul
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Navegação:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Use as setas para ver outros períodos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}