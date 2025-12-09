'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserCheck, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IndicadorRetencaoProps {
  valor?: number;
  meta: number;
  variacao?: number;
  periodoAnalisado?: string;
}

export function IndicadorRetencao({ valor = 0, meta, variacao = 0, periodoAnalisado }: IndicadorRetencaoProps) {
  const data = {
    valor: valor,
    meta: meta || 40,
    comparacao: variacao
  };

  const progresso = data.meta > 0 ? (data.valor / data.meta) * 100 : 0;
  const formatarValor = (val: number) => `${val.toFixed(1)}%`;

  const tooltipTexto = "Taxa de Retornantes: Percentual dos clientes do trimestre que JÁ VISITARAM o bar antes do início do período. Quanto maior, mais clientes fiéis você tem.";

  return (
    <TooltipProvider>
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Retornantes
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-3">
                <p>{tooltipTexto}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-3 sm:p-6 pt-0">
        {/* Seção de comparação */}
        <div className="flex items-center justify-center mb-2">
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
        
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {formatarValor(data.valor)}
            </p>
            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30">
              <span className="text-emerald-600 dark:text-emerald-400">
                {progresso.toFixed(0)}%
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Meta: {formatarValor(data.meta)}
          </p>
        </div>

        <Progress value={progresso} color="green" className="h-2" />

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
    </TooltipProvider>
  );
}