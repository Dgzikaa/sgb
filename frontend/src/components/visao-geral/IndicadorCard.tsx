'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Construction } from 'lucide-react';

interface IndicadorCardProps {
  titulo: string;
  valor: number;
  meta: number;
  prefixo?: string;
  sufixo?: string;
  formato?: 'numero' | 'moeda' | 'percentual' | 'decimal';
  tendencia?: number;
  detalhes?: Record<string, number>;
  cor?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange' | 'pink';
  inverterProgresso?: boolean; // Para indicadores onde "menos é melhor"
  inverterComparacao?: boolean; // Para indicadores onde variação negativa é boa (CMO, % Artística)
  periodoAnalisado?: string; // Período que está sendo analisado
  emDesenvolvimento?: boolean; // Para indicadores em desenvolvimento
  comparacao?: {
    valor: number;
    label: string; // "vs mês anterior" ou "vs trimestre anterior"
  };
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
  cor = 'blue',
  inverterProgresso = false,
  inverterComparacao = false,
  periodoAnalisado,
  emDesenvolvimento = false,
  comparacao
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

  const progresso = meta > 0 ? (inverterProgresso ? Math.max(0, (2 * meta - valor) / meta * 100) : (valor / meta) * 100) : 0;
  
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
      case 'orange':
        return {
          bg: 'bg-orange-500',
          bgLight: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-600 dark:text-orange-400'
        };
      case 'pink':
        return {
          bg: 'bg-pink-500',
          bgLight: 'bg-pink-100 dark:bg-pink-900/30',
          text: 'text-pink-600 dark:text-pink-400'
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
    <Card className={`card-dark shadow-sm hover:shadow-lg transition-shadow ${emDesenvolvimento ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
              {titulo}
            </CardTitle>
            {emDesenvolvimento && (
              <Badge variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs">
                <Construction className="h-3 w-3 mr-1" />
                Em Desenvolvimento
              </Badge>
            )}
          </div>
          {!emDesenvolvimento && tendencia !== undefined && (
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
        {/* Seção de comparação - ACIMA do valor principal */}
        {!emDesenvolvimento && comparacao && (
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center gap-1">
              {(() => {
                // Lógica de cores baseada em inverterComparacao
                const isPositive = inverterComparacao ? comparacao.valor < 0 : comparacao.valor > 0;
                const isNegative = inverterComparacao ? comparacao.valor > 0 : comparacao.valor < 0;
                
                if (isPositive) {
                  return <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />;
                } else if (isNegative) {
                  return <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />;
                } else {
                  return <Minus className="w-3 h-3 text-gray-500 dark:text-gray-500" />;
                }
              })()}
              <span className={`text-xs font-medium ${(() => {
                const isPositive = inverterComparacao ? comparacao.valor < 0 : comparacao.valor > 0;
                const isNegative = inverterComparacao ? comparacao.valor > 0 : comparacao.valor < 0;
                
                if (isPositive) {
                  return 'text-green-600 dark:text-green-400';
                } else if (isNegative) {
                  return 'text-red-600 dark:text-red-400';
                } else {
                  return 'text-gray-500 dark:text-gray-500';
                }
              })()}`}>
                {comparacao.label} {comparacao.valor > 0 ? '+' : ''}{comparacao.valor.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
        
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className={`text-2xl font-bold ${emDesenvolvimento ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              {emDesenvolvimento ? 'Disponível em breve' : `${prefixo}${formatarValor(valor)}${sufixo}`}
            </p>
            {!emDesenvolvimento && (
              <Badge variant="secondary" className={cores.bgLight}>
                <span className={cores.text}>
                  {progresso.toFixed(0)}%
                </span>
              </Badge>
            )}
          </div>
          <p className={`text-sm ${emDesenvolvimento ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {emDesenvolvimento ? 'Indicador sendo desenvolvido' : `Meta: ${prefixo}${formatarValor(meta)}${sufixo}`}
          </p>
        </div>

        {!emDesenvolvimento && <Progress value={progresso} color={cor} className="h-2" />}

        {!emDesenvolvimento && (detalhes || periodoAnalisado) && (
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            {detalhes && (
              <>
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
              </>
            )}
            
            {periodoAnalisado && (
              <div className={detalhes ? "mt-3" : ""}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                  Período Analisado
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {periodoAnalisado}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
