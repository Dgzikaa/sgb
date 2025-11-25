'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  UserPlus, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Star,
  Target,
  AlertCircle,
  Info,
  CheckCircle,
  Sparkles
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
      const barId = selectedBar?.id || 1;
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
        toast.error('Erro ao buscar dados de clientes');
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

  const voltarHoje = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataCustom(hoje);
    buscarDados(hoje);
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderVariacao = (valor: number) => {
    if (valor > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">+{valor.toFixed(1)}%</span>
        </div>
      );
    } else if (valor < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" />
          <span className="font-medium">{valor.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <span className="text-sm">Sem variação</span>
        </div>
      );
    }
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'positivo':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'atencao':
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getInsightColor = (tipo: string) => {
    switch (tipo) {
      case 'positivo':
        return 'bg-green-50 dark:bg-green-900/20 border-green-500';
      case 'atencao':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header com Título e Controles */}
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="card-title-dark mb-2">Clientes Ativos - Análise Completa</h1>
              <p className="card-description-dark">
                Acompanhe clientes novos, retornantes e base ativa por dia, semana ou mês
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={voltarHoje}
                variant="outline"
                className="btn-outline-dark"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Hoje
              </Button>
              <Button
                onClick={() => buscarDados()}
                disabled={loading}
                className="btn-primary-dark"
                size="sm"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Seletores de Período */}
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as any)} className="w-full">
            <TabsList className="tabs-list-dark w-full sm:w-auto">
              <TabsTrigger value="dia" className="tabs-trigger-dark">
                <Calendar className="h-4 w-4 mr-2" />
                Dia
              </TabsTrigger>
              <TabsTrigger value="semana" className="tabs-trigger-dark">
                <Calendar className="h-4 w-4 mr-2" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="mes" className="tabs-trigger-dark">
                <Calendar className="h-4 w-4 mr-2" />
                Mês
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navegação e Seletor de Data */}
          {data && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  onClick={() => navegarPeriodo('anterior')}
                  variant="outline"
                  className="btn-outline-dark w-full sm:w-auto"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {periodo === 'dia' ? 'Dia' : periodo === 'semana' ? 'Semana' : 'Mês'} Anterior
                </Button>

                <div className="text-center flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {data.label}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatarData(data.periodoAtual.inicio)} 
                    {data.periodoAtual.inicio !== data.periodoAtual.fim && 
                      ` - ${formatarData(data.periodoAtual.fim)}`}
                  </div>
                  
                  {/* Seletor de Data Custom */}
                  <div className="mt-3 flex justify-center">
                    <div className="w-64">
                      <Input
                        type="date"
                        value={dataCustom}
                        onChange={(e) => {
                          setDataCustom(e.target.value);
                          buscarDados(e.target.value);
                        }}
                        className="input-dark text-center"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navegarPeriodo('proximo')}
                  variant="outline"
                  className="btn-outline-dark w-full sm:w-auto"
                  size="sm"
                  disabled={dataCustom >= new Date().toISOString().split('T')[0]}
                >
                  Próxim{periodo === 'dia' ? 'o Dia' : periodo === 'semana' ? 'a Semana' : 'o Mês'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {loading && !data ? (
          <Card className="card-dark">
            <CardContent className="py-12">
              <div className="text-center">
                <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* Cards de Métricas Principais com Comparação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total de Clientes */}
              <Card className="card-dark">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total de Clientes
                    </CardTitle>
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {data.atual.totalClientes}
                  </div>
                  {renderVariacao(data.variacoes.total)}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Anterior: {data.anterior.totalClientes}
                  </p>
                </CardContent>
              </Card>

              {/* Novos Clientes */}
              <Card className="card-dark">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Novos Clientes
                    </CardTitle>
                    <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {data.atual.novosClientes}
                  </div>
                  {renderVariacao(data.variacoes.novos)}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="badge-success text-xs">
                      {data.atual.percentualNovos.toFixed(1)}%
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Anterior: {data.anterior.novosClientes}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Clientes Retornantes */}
              <Card className="card-dark">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Clientes Retornantes
                    </CardTitle>
                    <RefreshCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {data.atual.clientesRetornantes}
                  </div>
                  {renderVariacao(data.variacoes.retornantes)}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="badge-primary text-xs">
                      {data.atual.percentualRetornantes.toFixed(1)}%
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Anterior: {data.anterior.clientesRetornantes}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Clientes Ativos */}
              <Card className="card-dark">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Base Ativa (90d)
                    </CardTitle>
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    {data.atual.clientesAtivos}
                  </div>
                  {renderVariacao(data.variacoes.ativos)}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Anterior: {data.anterior.clientesAtivos}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights Estratégicos */}
            {data.insights && data.insights.length > 0 && (
              <Card className="card-dark mb-6">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    Insights Estratégicos
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Análises automáticas para tomada de decisão
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.tipo)}`}
                    >
                      <div className="flex items-start gap-3">
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Detalhamento e Sugestões para Marketing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparação Detalhada */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark">Comparação com Período Anterior</CardTitle>
                  <CardDescription className="card-description-dark">
                    Evolução dos indicadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Total de Clientes
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {data.anterior.totalClientes} → {data.atual.totalClientes}
                        </p>
                      </div>
                      {renderVariacao(data.variacoes.total)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Novos Clientes
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {data.anterior.novosClientes} → {data.atual.novosClientes}
                        </p>
                      </div>
                      {renderVariacao(data.variacoes.novos)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Clientes Retornantes
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {data.anterior.clientesRetornantes} → {data.atual.clientesRetornantes}
                        </p>
                      </div>
                      {renderVariacao(data.variacoes.retornantes)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Base Ativa (90 dias)
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {data.anterior.clientesAtivos} → {data.atual.clientesAtivos}
                        </p>
                      </div>
                      {renderVariacao(data.variacoes.ativos)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sugestões para Marketing */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Estratégias de Marketing
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Como usar esses dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Alto % de Novos */}
                  {data.atual.percentualNovos > 50 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        🎯 Foco em Fidelização
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Com {data.atual.percentualNovos.toFixed(1)}% de novos clientes, invista em:
                        programa de fidelidade, follow-up pós-visita, e ofertas de retorno.
                      </p>
                    </div>
                  )}

                  {/* Alto % de Retornantes */}
                  {data.atual.percentualRetornantes > 50 && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        🔄 Base Fiel Consolidada
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Com {data.atual.percentualRetornantes.toFixed(1)}% de retornantes, 
                        explore upsell, eventos exclusivos e programas VIP.
                      </p>
                    </div>
                  )}

                  {/* Crescimento da Base Ativa */}
                  {data.variacoes.ativos > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        ⭐ Base Ativa Crescendo
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Continue as estratégias atuais! A base de clientes engajados está aumentando.
                      </p>
                    </div>
                  )}

                  {/* Análise por Período */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      📊 Análise por {periodo === 'dia' ? 'Dia' : periodo === 'semana' ? 'Semana' : 'Mês'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {periodo === 'dia' && 
                        'Use dados diários para campanhas específicas de cada dia da semana.'
                      }
                      {periodo === 'semana' && 
                        'Dados semanais são ideais para avaliar impacto de eventos e promoções.'
                      }
                      {periodo === 'mes' && 
                        'Análise mensal mostra tendências de longo prazo e sazonalidade.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="card-dark">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum dado disponível
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
