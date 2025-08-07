'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { IndicadorCard } from '@/components/visao-geral/IndicadorCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Target
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface IndicadoresAnuais {
  faturamento: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  pessoas: {
    valor: number;
    meta: number;
    detalhes?: Record<string, number>;
  };
  reputacao: {
    valor: number;
    meta: number;
  };
  ebitda: {
    valor: number;
    meta: number;
  };
}

interface IndicadoresTrimestrais {
  clientesAtivos: {
    valor: number;
    meta: number;
  };
  clientesTotais: {
    valor: number;
    meta: number;
  };
  retencao: {
    valor: number;
    meta: number;
  };
  cmvLimpo: {
    valor: number;
    meta: number;
  };
  cmo: {
    valor: number;
    meta: number;
  };
  artistica: {
    valor: number;
    meta: number;
  };
}

export default function VisaoGeralPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();

  const [indicadoresAnuais, setIndicadoresAnuais] = useState<IndicadoresAnuais | null>(null);
  const [indicadoresTrimestrais, setIndicadoresTrimestrais] = useState<IndicadoresTrimestrais | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setPageTitle('📊 Visão Geral');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const carregarIndicadores = async () => {
    if (!selectedBar) return;

    setLoading(true);
    try {
      const [anualResponse, trimestralResponse] = await Promise.all([
        fetch(`/api/visao-geral/indicadores?periodo=anual`, {
          headers: {
            'x-user-data': JSON.stringify({
              bar_id: selectedBar.id,
              permissao: 'admin',
            }),
          },
        }),
        fetch(`/api/visao-geral/indicadores?periodo=trimestral`, {
          headers: {
            'x-user-data': JSON.stringify({
              bar_id: selectedBar.id,
              permissao: 'admin',
            }),
          },
        })
      ]);

      if (!anualResponse.ok || !trimestralResponse.ok) {
        throw new Error('Erro ao buscar indicadores');
      }

      const anualData = await anualResponse.json();
      const trimestralData = await trimestralResponse.json();

      setIndicadoresAnuais(anualData.anual);
      setIndicadoresTrimestrais(trimestralData.trimestral);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarIndicadores();
  }, [selectedBar]);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Header compacto */}
        <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard executivo</p>
              </div>
            </div>
            

          </div>
        </div>

        {/* Indicadores Anuais */}
        <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Anual</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance estratégica desde abertura</p>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-gray-50 dark:bg-gray-900">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : indicadoresAnuais ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <IndicadorCard
                titulo="Faturamento 2025"
                valor={indicadoresAnuais.faturamento.valor}
                meta={indicadoresAnuais.faturamento.meta}
                formato="moeda"
                cor="green"
                detalhes={indicadoresAnuais.faturamento.detalhes}
              />
              
              <IndicadorCard
                titulo="Pessoas"
                valor={indicadoresAnuais.pessoas.valor}
                meta={indicadoresAnuais.pessoas.meta}
                formato="numero"
                cor="blue"
                detalhes={indicadoresAnuais.pessoas.detalhes}
              />
              
              <IndicadorCard
                titulo="Reputação"
                valor={indicadoresAnuais.reputacao.valor}
                meta={indicadoresAnuais.reputacao.meta}
                formato="decimal"
                cor="purple"
                sufixo=" ⭐"
              />
              
              <IndicadorCard
                titulo="EBITDA 2025"
                valor={indicadoresAnuais.ebitda.valor}
                meta={indicadoresAnuais.ebitda.meta}
                formato="moeda"
                cor="yellow"
              />
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 dark:text-gray-400">Erro ao carregar indicadores anuais</p>
            </div>
          )}
        </div>

        {/* Indicadores Trimestrais */}
        <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3º Trimestre 2025 (Jul-Set)</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance operacional</p>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-50 dark:bg-gray-900">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : indicadoresTrimestrais ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <IndicadorCard
                titulo="Clientes Ativos"
                valor={indicadoresTrimestrais.clientesAtivos.valor}
                meta={indicadoresTrimestrais.clientesAtivos.meta}
                formato="numero"
                cor="green"
              />
              
              <IndicadorCard
                titulo="Clientes Totais"
                valor={indicadoresTrimestrais.clientesTotais.valor}
                meta={indicadoresTrimestrais.clientesTotais.meta}
                formato="numero"
                cor="blue"
              />
              
              <IndicadorCard
                titulo="Retenção"
                valor={indicadoresTrimestrais.retencao.valor}
                meta={indicadoresTrimestrais.retencao.meta}
                formato="percentual"
                cor="purple"
              />
              
              <IndicadorCard
                titulo="CMV Limpo"
                valor={indicadoresTrimestrais.cmvLimpo.valor}
                meta={indicadoresTrimestrais.cmvLimpo.meta}
                formato="percentual"
                cor="yellow"
              />
              
              <IndicadorCard
                titulo="CMO"
                valor={indicadoresTrimestrais.cmo.valor}
                meta={indicadoresTrimestrais.cmo.meta}
                formato="percentual"
                cor="orange"
              />
              
              <IndicadorCard
                titulo="% Artística"
                valor={indicadoresTrimestrais.artistica.valor}
                meta={indicadoresTrimestrais.artistica.meta}
                formato="percentual"
                cor="pink"
              />
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 dark:text-gray-400">Erro ao carregar indicadores trimestrais</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}