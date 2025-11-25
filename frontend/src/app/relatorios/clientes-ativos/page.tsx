'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Star,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientesAtivosData {
  periodo: string;
  label: string;
  periodoAtual: {
    inicio: string;
    fim: string;
  };
  periodoAnterior: {
    inicio: string;
    fim: string;
  };
  atual: {
    totalClientes: number;
    novosClientes: number;
    clientesRetornantes: number;
    percentualNovos: number;
    percentualRetornantes: number;
    clientesAtivos: number;
  };
  anterior: {
    totalClientes: number;
    novosClientes: number;
    clientesRetornantes: number;
    clientesAtivos: number;
  };
  variacoes: {
    total: number;
    novos: number;
    retornantes: number;
    ativos: number;
  };
  insights: Array<{
    tipo: 'positivo' | 'atencao' | 'info';
    titulo: string;
    descricao: string;
  }>;
}

export default function ClientesAtivosPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ClientesAtivosData | null>(null);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [dataCustom, setDataCustom] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setPageTitle('👥 Clientes Ativos');
  }, [setPageTitle]);

  useEffect(() => {
    buscarDados();
  }, [periodo, selectedBar]);

  const buscarDados = async (dataEspecifica?: string) => {
    setLoading(true);
    try {
      const barId = selectedBar?.id || 3;
      const params = new URLSearchParams({
        periodo,
        bar_id: barId.toString()
      });

      if (dataEspecifica || (periodo !== 'semana')) {
        params.append('data_inicio', dataEspecifica || dataCustom);
      }

      const response = await fetch(`/api/clientes-ativos?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || 'Erro ao buscar dados de clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao buscar dados de clientes');
    } finally {
      setLoading(false);
    }
  };

  const navegarPeriodo = (direcao: 'anterior' | 'proximo') => {
    const dataAtual = new Date(dataCustom);
    
    if (periodo === 'dia') {
      dataAtual.setDate(dataAtual.getDate() + (direcao === 'proximo' ? 1 : -1));
    } else if (periodo === 'semana') {
      dataAtual.setDate(dataAtual.getDate() + (direcao === 'proximo' ? 7 : -7));
    } else if (periodo === 'mes') {
      dataAtual.setMonth(dataAtual.getMonth() + (direcao === 'proximo' ? 1 : -1));
    }
    
    const novaData = dataAtual.toISOString().split('T')[0];
    setDataCustom(novaData);
    buscarDados(novaData);
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'positivo':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'atencao':
        return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getInsightBorderColor = (tipo: string) => {
    switch (tipo) {
      case 'positivo':
        return 'border-l-4 border-l-green-500';
      case 'atencao':
        return 'border-l-4 border-l-orange-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            {/* Seletor de Período */}
            <div className="mb-6">
              <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as any)} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-gray-700 w-full sm:w-auto">
                  <TabsTrigger 
                    value="dia"
                    disabled={loading}
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Dia
                  </TabsTrigger>
                  <TabsTrigger 
                    value="semana"
                    disabled={loading}
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Semana
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mes"
                    disabled={loading}
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Mês
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Navegação e Data */}
            {data && !loading && (
              <div className="mb-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {data.label}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => navegarPeriodo('anterior')}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                  >
                    {periodo === 'dia' ? 'Dia' : periodo === 'semana' ? 'Semana' : 'Mês'} Anterior
                  </Button>

                  {periodo !== 'semana' && (
                    <Input
                      type="date"
                      value={dataCustom}
                      onChange={(e) => {
                        setDataCustom(e.target.value);
                        buscarDados(e.target.value);
                      }}
                      disabled={loading}
                      className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  )}

                  <Button
                    onClick={() => navegarPeriodo('proximo')}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                  >
                    Próxim{periodo === 'dia' ? 'o Dia' : periodo === 'semana' ? 'a Semana' : 'o Mês'}
                  </Button>
                </div>
              </div>
            )}

            {/* Loading ou Dados */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando dados...</span>
              </div>
            ) : data ? (
              <>
                {/* Cards de Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Total de Clientes */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total de Clientes
                      </span>
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {data.atual.totalClientes}
                    </div>
                    <div className="flex items-center gap-2">
                      {data.variacoes.total >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${data.variacoes.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.variacoes.total > 0 ? '+' : ''}{data.variacoes.total}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Anterior: {data.anterior.totalClientes}
                      </span>
                    </div>
                  </div>

                  {/* Novos Clientes */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Novos Clientes
                      </span>
                      <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {data.atual.novosClientes}
                    </div>
                    <div className="flex items-center gap-2">
                      {data.variacoes.novos >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {data.atual.percentualNovos}%
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Anterior: {data.anterior.novosClientes}
                      </span>
                    </div>
                  </div>

                  {/* Clientes Retornantes */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Clientes Retornantes
                      </span>
                      <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {data.atual.clientesRetornantes}
                    </div>
                    <div className="flex items-center gap-2">
                      {data.variacoes.retornantes >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {data.atual.percentualRetornantes}%
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Anterior: {data.anterior.clientesRetornantes}
                      </span>
                    </div>
                  </div>

                  {/* Base Ativa (90d) */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Base Ativa (90d)
                      </span>
                      <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {data.atual.clientesAtivos}
                    </div>
                    <div className="flex items-center gap-2">
                      {data.variacoes.ativos >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${data.variacoes.ativos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.variacoes.ativos > 0 ? '+' : ''}{data.variacoes.ativos}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Anterior: {data.anterior.clientesAtivos}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insights Estratégicos */}
                {data.insights.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      ✨ Insights Estratégicos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Análises automáticas para tomada de decisão
                    </p>
                    <div className="space-y-4">
                      {data.insights.map((insight, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 ${getInsightBorderColor(insight.tipo)}`}
                        >
                          {getInsightIcon(insight.tipo)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {insight.titulo}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {insight.descricao}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Selecione um período para visualizar os dados
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
