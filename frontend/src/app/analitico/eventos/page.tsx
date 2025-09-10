'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HorarioPicoChart } from '@/components/ferramentas/HorarioPicoChart';
import ProdutosDoDiaDataTable from '@/components/ferramentas/ProdutosDoDiaDataTable';

export default function EventosAnaliticoPage() {
  const { setPageTitle } = usePageTitle();
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    setPageTitle('📊 Análise de Eventos');
    return () => setPageTitle('');
  }, [setPageTitle]);

  // Função para lidar com mudança de data - só atualiza se for uma data válida e completa
  const handleDataChange = (novaData: string) => {
    // Verifica se é uma data válida e completa (formato YYYY-MM-DD)
    if (novaData && novaData.length === 10 && novaData !== dataSelecionada) {
      const dataObj = new Date(novaData + 'T00:00:00');
      // Verifica se a data é válida
      if (!isNaN(dataObj.getTime())) {
        setDataSelecionada(novaData);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-1 pb-6 max-w-[98vw]">
        <div className="space-y-6">
          {/* Gráfico de Horário de Pico - Primeiro */}
          <HorarioPicoChart 
            dataSelecionada={dataSelecionada} 
            onDataChange={handleDataChange}
          />
          
          {/* Resumo do Dia e DataTable */}
          <ProdutosDoDiaDataTable dataSelecionada={dataSelecionada} />
        </div>
      </div>
    </div>
  );
}
