'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Phone,
  User,
  Clock,
  Search,
  RefreshCw,
  UserCheck,
  CheckCircle,
  Calendar,
  TrendingUp,
  MessageSquare,
  Users,
  Target,
  XCircle,
  CalendarCheck,
  UserX,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface Metricas {
  total_conversas: number;
  total_mensagens: number;
  contatos_unicos: number;
  conversa_mais_antiga: string;
  conversa_mais_recente: string;
  status_conversas: { status: string; quantidade: number }[];
}

interface CruzamentoDados {
  contatos_conversaram_e_reservaram: number;
  total_reservas: number;
  compareceram_seated: number;
  no_shows: number;
  confirmadas_aguardando: number;
  canceladas_usuario: number;
  canceladas_agente: number;
  pendentes: number;
}

interface TopContato {
  contato_nome: string;
  contato_telefone: string;
  total_conversas: number;
  primeira_conversa: string;
  ultima_conversa: string;
}

export default function UmblerPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [cruzamento, setCruzamento] = useState<CruzamentoDados | null>(null);
  const [topContatos, setTopContatos] = useState<TopContato[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCruzamento, setLoadingCruzamento] = useState(true);
  const [ultimoSync, setUltimoSync] = useState<string | null>(null);

  const fetchMetricas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/umbler/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setMetricas(data.metricas);
        setTopContatos(data.top_contatos || []);
        setUltimoSync(data.ultimo_sync);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCruzamento = useCallback(async () => {
    setLoadingCruzamento(true);
    try {
      const response = await fetch('/api/umbler/cruzamento-reservas');
      const data = await response.json();
      
      if (data.success) {
        setCruzamento(data.dados);
      }
    } catch (error) {
      console.error('Erro ao buscar cruzamento:', error);
    } finally {
      setLoadingCruzamento(false);
    }
  }, []);

  useEffect(() => {
    fetchMetricas();
    fetchCruzamento();
  }, [fetchMetricas, fetchCruzamento]);

  const formatarData = (data: string | null): string => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularTaxaConversao = (): number => {
    if (!metricas || !cruzamento) return 0;
    return metricas.contatos_unicos > 0
      ? Math.round((cruzamento.contatos_conversaram_e_reservaram / metricas.contatos_unicos) * 100 * 10) / 10
      : 0;
  };

  const calcularTaxaComparecimento = (): number => {
    if (!cruzamento || cruzamento.total_reservas === 0) return 0;
    return Math.round((cruzamento.compareceram_seated / cruzamento.total_reservas) * 100 * 10) / 10;
  };

  const calcularTaxaNoShow = (): number => {
    if (!cruzamento || cruzamento.total_reservas === 0) return 0;
    return Math.round((cruzamento.no_shows / cruzamento.total_reservas) * 100 * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Umbler Talk - Central de Dados
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Histórico completo de conversas e cruzamento com reservas
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {ultimoSync && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Último sync: {formatarData(ultimoSync)}
                </span>
              )}
              <Button 
                onClick={() => { fetchMetricas(); fetchCruzamento(); }} 
                variant="outline" 
                className="border-gray-300 dark:border-gray-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : metricas ? (
            <>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Total Conversas</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {metricas.total_conversas.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">Contatos Únicos</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {metricas.contatos_unicos.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-300">Total Mensagens</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {metricas.total_mensagens.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">Período</span>
                  </div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {formatarData(metricas.conversa_mais_antiga)}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    até {formatarData(metricas.conversa_mais_recente)}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Tabs defaultValue="cruzamento" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="cruzamento" className="data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900/30">
              <Target className="w-4 h-4 mr-2" />
              Cruzamento com Reservas
            </TabsTrigger>
            <TabsTrigger value="contatos" className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30">
              <Users className="w-4 h-4 mr-2" />
              Top Contatos
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <PieChart className="w-4 h-4 mr-2" />
              Status das Conversas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cruzamento com Reservas */}
          <TabsContent value="cruzamento">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funil de Conversão */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Funil: WhatsApp → Reserva → Presença
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Jornada do cliente do primeiro contato até comparecer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCruzamento ? (
                    <div className="space-y-4">
                      {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : cruzamento && metricas ? (
                    <div className="space-y-4">
                      {/* Nível 1: Contatos */}
                      <div className="relative">
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="w-6 h-6 text-blue-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Conversaram no WhatsApp</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Todos os contatos</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {metricas.contatos_unicos.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-sm text-gray-500">100%</p>
                          </div>
                        </div>
                        <div className="ml-6 h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-600" />
                      </div>

                      {/* Nível 2: Fizeram Reserva */}
                      <div className="relative">
                        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                          <div className="flex items-center gap-3">
                            <CalendarCheck className="w-6 h-6 text-purple-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Fizeram Reserva</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Reservaram pelo Getin</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {cruzamento.contatos_conversaram_e_reservaram}
                            </p>
                            <p className="text-sm text-gray-500">{calcularTaxaConversao()}%</p>
                          </div>
                        </div>
                        <div className="ml-6 h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-600" />
                      </div>

                      {/* Nível 3: Compareceram */}
                      <div className="relative">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Compareceram</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Status: Seated</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {cruzamento.compareceram_seated}
                            </p>
                            <p className="text-sm text-gray-500">{calcularTaxaComparecimento()}% das reservas</p>
                          </div>
                        </div>
                      </div>

                      {/* Nível 3: No-Show */}
                      <div className="relative">
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                          <div className="flex items-center gap-3">
                            <UserX className="w-6 h-6 text-red-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">No-Show</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Não compareceram</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {cruzamento.no_shows}
                            </p>
                            <p className="text-sm text-gray-500">{calcularTaxaNoShow()}% das reservas</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Detalhes das Reservas */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Detalhes das Reservas
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Breakdown de status das reservas dos contatos Umbler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCruzamento ? (
                    <div className="space-y-3">
                      {Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : cruzamento ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Total de Reservas</span>
                        <span className="font-bold text-gray-900 dark:text-white">{cruzamento.total_reservas}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 dark:text-green-300">Compareceram (Seated)</span>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400">{cruzamento.compareceram_seated}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700 dark:text-red-300">No-Show</span>
                        </div>
                        <span className="font-bold text-red-600 dark:text-red-400">{cruzamento.no_shows}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-700 dark:text-blue-300">Confirmadas (Aguardando)</span>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{cruzamento.confirmadas_aguardando}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-700 dark:text-yellow-300">Canceladas (Usuário)</span>
                        </div>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{cruzamento.canceladas_usuario}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-700 dark:text-orange-300">Canceladas (Atendente)</span>
                        </div>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{cruzamento.canceladas_agente}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">Pendentes</span>
                        </div>
                        <span className="font-bold text-gray-600 dark:text-gray-400">{cruzamento.pendentes}</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Insight Box */}
            <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Insight: Oportunidade de Conversão
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {metricas && cruzamento ? (
                        <>
                          Dos <strong>{metricas.contatos_unicos.toLocaleString('pt-BR')}</strong> contatos que conversaram no WhatsApp, 
                          apenas <strong>{cruzamento.contatos_conversaram_e_reservaram}</strong> ({calcularTaxaConversao()}%) 
                          fizeram reserva. Isso significa que <strong>{(metricas.contatos_unicos - cruzamento.contatos_conversaram_e_reservaram).toLocaleString('pt-BR')}</strong> contatos 
                          são potenciais clientes que ainda não converteram. Considere campanhas de remarketing para esse público.
                        </>
                      ) : 'Carregando dados...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Top Contatos */}
          <TabsContent value="contatos">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Contatos Mais Frequentes</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Clientes que mais conversaram pelo WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(10).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : topContatos.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhum contato encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topContatos.map((contato, index) => (
                      <div
                        key={contato.contato_telefone}
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {contato.contato_nome || 'Cliente'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contato.contato_telefone}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {contato.total_conversas}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">conversas</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                          <p>Primeira: {formatarData(contato.primeira_conversa)}</p>
                          <p>Última: {formatarData(contato.ultima_conversa)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Status das Conversas */}
          <TabsContent value="status">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Status das Conversas</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Distribuição por status de atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : metricas?.status_conversas ? (
                  <div className="space-y-4">
                    {metricas.status_conversas.map((item) => {
                      const total = metricas.total_conversas;
                      const percent = total > 0 ? Math.round((item.quantidade / total) * 100) : 0;
                      
                      const statusConfig: Record<string, { cor: string; bg: string }> = {
                        aberta: { cor: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
                        em_atendimento: { cor: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
                        finalizada: { cor: 'bg-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' }
                      };
                      const config = statusConfig[item.status] || statusConfig.aberta;
                      
                      return (
                        <div key={item.status} className={`p-4 rounded-lg ${config.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {item.status === 'em_atendimento' ? 'Em Atendimento' : item.status}
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.quantidade.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`${config.cor} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percent}%</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
