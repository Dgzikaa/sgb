'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BarChart3 } from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';

// Componentes otimizados serão criados separadamente
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProdutoData {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  [key: string]: unknown;
}

export default function RelatorioProdutos() {
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();

  // Estados principais
  const [dataEspecifica, setDataEspecifica] = useState(() => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return ontem.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [analisado, setAnalisado] = useState(false);
  const [dados, setDados] = useState({
    produtos: [],
    historico: [],
    estatisticas: null,
    metaInfo: null,
    metricas: null,
  });

  useEffect(() => {
    setPageTitle('Relatório de Tempo de Produção');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const analisarTempos = async (filtros: unknown) => {
    if (!dataEspecifica) {
      alert('Por favor, selecione uma data para análise');
      return;
    }

    setLoading(true);
    setAnalisado(false);

    try {
      const params = new URLSearchParams({
        data_especifica: dataEspecifica,
        ...(typeof filtros === 'object' && filtros !== null ? filtros : {}),
        bar_id: (selectedBar?.id || 3).toString(),
      });

      const [produtosRes, historicoRes, estatisticasRes] = await Promise.all([
        fetch(`/api/relatorios/produtos/tempos?${params}`),
        fetch(`/api/relatorios/produtos/historico?${params}`),
        fetch(`/api/relatorios/produtos/estatisticas?${params}`),
      ]);

      const [produtosData, historicoData, estatisticasData] = await Promise.all(
        [produtosRes.json(), historicoRes.json(), estatisticasRes.json()]
      );

      setDados({
        produtos: produtosData.produtos || [],
        historico: historicoData.historico || [],
        estatisticas: estatisticasData.estatisticas || null,
        metaInfo: produtosData.meta || null,
        metricas: produtosData.metricas_qualidade || null,
      });

      setAnalisado(true);
    } catch (error) {
      console.error('Erro ao analisar tempos:', error);
      alert('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosRapidos = (tipo: 'hoje' | 'ontem') => {
    const data = new Date();
    if (tipo === 'ontem') data.setDate(data.getDate() - 1);

    setDataEspecifica(data.toISOString().split('T')[0]);
    setTimeout(() => analisarTempos({}), 100);
  };

  const processarDados = (dados: ProdutoData[]) => {
    // Processamento dos dados
    return dados.map(item => ({
      ...item,
      precoFormatado: `R$ ${item.preco.toFixed(2)}`,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Relatório de Produção
            </h1>
          </div>

          <p className="text-gray-600">
            Análise detalhada dos tempos de produção por produto
          </p>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => carregarDadosRapidos('hoje')}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Hoje
            </Button>
            <Button
              onClick={() => carregarDadosRapidos('ontem')}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600"
            >
              <Clock className="h-4 w-4 mr-1" />
              Ontem
            </Button>
          </div>
        </div>

        {/* Filtros Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data">Data para Análise</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataEspecifica}
                  onChange={e => setDataEspecifica(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => analisarTempos({})}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Analisando...' : 'Analisar Tempos'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados Básicos */}
        {analisado && dados.produtos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {dados.produtos.length} produtos analisados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Dados carregados com sucesso. Componentes detalhados serão
                implementados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
