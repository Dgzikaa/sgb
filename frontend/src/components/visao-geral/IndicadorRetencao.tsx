'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Target } from 'lucide-react';

interface IndicadorRetencaoProps {
  valor?: number;
  meta: number;
  mesSelected?: string;
}

export function IndicadorRetencao({ valor = 0, meta, mesSelected: initialMesSelected }: IndicadorRetencaoProps) {
  const [mesSelected, setMesSelected] = useState<string>(initialMesSelected || '');

  // Usar dados recebidos via props
  const data = {
    valor: valor,
    meta: meta || 85,
    comparacao: 0, // TODO: Implementar comparação com mês anterior
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

  // Função para navegar entre meses
  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    if (!mesSelected) return;
    
    const [ano, mes] = mesSelected.split('-').map(Number);
    const dataAtual = new Date(ano, mes - 1, 1);
    
    if (direcao === 'anterior') {
      dataAtual.setMonth(dataAtual.getMonth() - 1);
    } else {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    }
    
    const novoMes = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}`;
    setMesSelected(novoMes);
  };

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
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fidelização de clientes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Navegador de mês */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navegarMes('anterior')}
                className="p-1 h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 min-w-[60px] text-center">
                {getNomeMesAbreviado()}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navegarMes('proximo')}
                className="p-1 h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Valor principal compacto */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatarValor(data.valor)}
            </span>
            <Badge 
              variant="secondary" 
              className="bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-xs"
            >
              <Target className="w-3 h-3 mr-1" />
              Meta: {formatarValor(data.meta)}
            </Badge>
          </div>
          
          {/* Progress bar compacto */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progresso</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progresso.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={progresso} 
              className="h-2 bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Informações em linha única */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              vs mês anterior
            </p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {formatarValor(data.comparacao)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Clientes Ativos
            </p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatarNumero(data.clientesAtivos)} / {formatarNumero(data.clientesTotais)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}