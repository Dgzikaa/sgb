'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndicadorCardProps {
  titulo: string;
  valor: number;
  meta: number;
  prefixo?: string;
  sufixo?: string;
  formato?: 'numero' | 'moeda' | 'percentual' | 'decimal';
  tendencia?: number;
  detalhes?: Record<string, number>;
  cor?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

export function IndicadorCard({
  titulo,
  valor,
  meta,
  prefixo = '',
  sufixo = '',
  formato = 'numero',
  tendencia,
  detalhes,
  cor = 'blue'
}: IndicadorCardProps) {
  const formatarValor = (val: number) => {
    switch (formato) {
      case 'moeda':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentual':
        return `${val.toFixed(1)}%`;
      case 'decimal':
        return val.toFixed(1);
      case 'numero':
      default:
        return new Intl.NumberFormat('pt-BR').format(Math.round(val));
    }
  };

  const progresso = meta > 0 ? (valor / meta) * 100 : 0;
  
  const getCorClasse = () => {
    switch (cor) {
      case 'green':
        return {
          bg: 'bg-green-500',
          bgLight: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-600 dark:text-green-400'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          bgLight: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-600 dark:text-purple-400'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          bgLight: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-600 dark:text-red-400'
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const cores = getCorClasse();

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
            {titulo}
          </CardTitle>
          {tendencia !== undefined && (
            <div className={`flex items-center gap-1 ${tendencia > 0 ? 'text-green-600 dark:text-green-400' : tendencia < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
              {tendencia > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+{tendencia.toFixed(1)}%</span>
                </>
              ) : tendencia < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">{tendencia.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4" />
                  <span className="text-sm font-medium">0%</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {prefixo}{formatarValor(valor)}{sufixo}
            </p>
            <Badge variant="secondary" className={cores.bgLight}>
              <span className={cores.text}>
                {progresso.toFixed(0)}%
              </span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meta: {prefixo}{formatarValor(meta)}{sufixo}
          </p>
        </div>

        <Progress value={progresso} className="h-2" />

        {detalhes && (
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-2">
              Detalhamento
            </p>
            {Object.entries(detalhes).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {key}:
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatarValor(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
