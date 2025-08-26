'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from 'lucide-react';

interface IndicadorRetencaoProps {
  valor?: number;
  meta: number;
  variacao?: number;
  mesSelected?: string;
  periodoAnalisado?: string;
}

export function IndicadorRetencao({ valor = 0, meta, variacao = 0, mesSelected: initialMesSelected, periodoAnalisado }: IndicadorRetencaoProps) {
  const [mesSelected, setMesSelected] = useState<string>(initialMesSelected || '');

  // Usar dados recebidos via props
  const data = {
    valor: valor,
    meta: meta || 85,
    comparacao: variacao,
    tendencia: 'stable' as const,
    clientesAtivos: 0, // TODO: Receber via props se necessário
    clientesTotais: 0  // TODO: Receber via props se necessário
  };

  // Definir mês atual como padrão
  if (!mesSelected) {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    setMesSelected(mesAtual);
  }



  const progresso = data.meta > 0 ? (data.valor / data.meta) * 100 : 0;
  const progressoCliente = data.clientesTotais > 0 ? (data.clientesAtivos / data.clientesTotais) * 100 : 0;
  
  const formatarValor = (val: number) => `${val.toFixed(1)}%`;
  const formatarNumero = (val: number) => val.toLocaleString('pt-BR');

  const getNomeMesAbreviado = () => {
    const hoje = new Date();
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    return mesNome.toUpperCase();
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Taxa de Retenção
              </CardTitle>
            </div>
          </div>
          

        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seção de comparação - ACIMA do valor principal */}
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${
              data.comparacao > 0 
                ? 'text-green-600 dark:text-green-400' 
                : data.comparacao < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-500'
            }`}>
              vs trimestre anterior {data.comparacao > 0 ? '+' : ''}{formatarValor(data.comparacao)}
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarValor(data.valor)}
            </p>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30">
              <span className="text-purple-600 dark:text-purple-400">
                {progresso.toFixed(0)}%
              </span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meta: {formatarValor(data.meta)}
          </p>
        </div>

        <Progress value={progresso} className="h-2" />

        {periodoAnalisado && (
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
              Período Analisado
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {periodoAnalisado}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}