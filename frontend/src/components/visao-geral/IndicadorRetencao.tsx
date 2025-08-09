'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';

interface IndicadorRetencaoProps {
  meta: number;
}

export function IndicadorRetencao({ meta }: IndicadorRetencaoProps) {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const [valor, setValor] = useState<number>(0);
  const [mesSelected, setMesSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Gerar lista de meses disponíveis (últimos 12 meses)
  const gerarMesesDisponiveis = () => {
    const meses = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const ano = data.getFullYear();
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const valor = `${ano}-${mes}`;
      const nome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      meses.push({ valor, nome });
    }
    
    return meses;
  };

  const mesesDisponiveis = gerarMesesDisponiveis();

  // Definir mês atual como padrão
  useEffect(() => {
    if (!mesSelected) {
      const hoje = new Date();
      const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
      setMesSelected(mesAtual);
    }
  }, [mesSelected]);

  const buscarRetencao = async (mes: string) => {
    if (!selectedBar || !mes) return;

    setLoading(true);
    try {
      const url = `/api/visao-geral/indicadores?periodo=trimestral&trimestre=3&mes_retencao=${mes}`;
      const response = await fetch(url, {
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar retenção');
      }

      const data = await response.json();
      setValor(data.trimestral.retencao.valor);
    } catch (error) {
      console.error('Erro ao carregar retenção:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a retenção',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mesSelected) {
      buscarRetencao(mesSelected);
    }
  }, [selectedBar, mesSelected]);

  const progresso = meta > 0 ? (valor / meta) * 100 : 0;
  
  const formatarValor = (val: number) => `${val.toFixed(1)}%`;

  const getNomeMes = (mes: string) => {
    const item = mesesDisponiveis.find(m => m.valor === mes);
    return item ? item.nome : mes;
  };

  const getNomeMesAbreviado = (mes: string) => {
    const item = mesesDisponiveis.find(m => m.valor === mes);
    if (!item) return mes;
    
    const [mesNome] = item.nome.split(' de ');
    return mesNome.toUpperCase();
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const indiceAtual = mesesDisponiveis.findIndex(m => m.valor === mesSelected);
    
    if (direcao === 'anterior' && indiceAtual < mesesDisponiveis.length - 1) {
      setMesSelected(mesesDisponiveis[indiceAtual + 1].valor);
    } else if (direcao === 'proximo' && indiceAtual > 0) {
      setMesSelected(mesesDisponiveis[indiceAtual - 1].valor);
    }
  };

  const podeNavegar = (direcao: 'anterior' | 'proximo') => {
    const indiceAtual = mesesDisponiveis.findIndex(m => m.valor === mesSelected);
    
    if (direcao === 'anterior') {
      return indiceAtual < mesesDisponiveis.length - 1;
    } else {
      return indiceAtual > 0;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Retenção
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Navegador de mês estilo < AGOSTO > */}
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-600 rounded-lg p-1 border border-gray-300 dark:border-gray-500">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navegarMes('anterior')}
                disabled={!podeNavegar('anterior') || loading}
                className="p-1 h-7 w-7 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-xs font-medium text-gray-800 dark:text-gray-100 min-w-[70px] text-center px-2">
                {loading ? '...' : getNomeMesAbreviado(mesSelected)}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navegarMes('proximo')}
                disabled={!podeNavegar('proximo') || loading}
                className="p-1 h-7 w-7 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : formatarValor(valor)}
            </p>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30">
              <span className="text-purple-600 dark:text-purple-400">
                {progresso.toFixed(0)}%
              </span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meta: {formatarValor(meta)}
          </p>
        </div>

        <Progress value={progresso} color="purple" className="h-2" />

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            Período Analisado
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getNomeMes(mesSelected)} vs 2 meses anteriores
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
