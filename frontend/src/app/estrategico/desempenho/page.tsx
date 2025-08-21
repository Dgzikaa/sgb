'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  Activity,
  Users,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';

interface DadosDesempenho {
  id: number;
  data_evento: string;
  nome_evento: string;
  semana: number;
  mes: number;
  ano: number;
  dia_semana: string;
  faturamento_real: number;
  meta_faturamento: number;
  clientes_real: number;
  clientes_plan: number;
  ticket_medio: number;
  percentual_artistico: number;
  tempo_bar: number;
  tempo_cozinha: number;
  performance_geral: number;
}

interface ResumoSemanal {
  semana: number;
  periodo: string;
  total_faturamento: number;
  total_clientes: number;
  ticket_medio: number;
  performance_media: number;
  eventos: DadosDesempenho[];
}

interface ResumoMensal {
  mes: number;
  ano: number;
  semanas: ResumoSemanal[];
  totais: {
    faturamento: number;
    clientes: number;
    ticket_medio: number;
    performance_geral: number;
  };
}

export default function DesempenhoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('semanal');
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dadosDesempenho, setDadosDesempenho] = useState<DadosDesempenho[]>([]);
  const [resumoSemanal, setResumoSemanal] = useState<ResumoSemanal[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal | null>(null);

  // Estados do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<DadosDesempenho | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [salvando, setSalvando] = useState(false);

  const mesesNomes = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);

  const gerarPeriodoSemana = useCallback((semana: number, mes: number, ano: number): string => {
    // Lógica simplificada - pode ser ajustada conforme necessário
    const inicioMes = new Date(ano, mes - 1, 1);
    const inicioSemana = new Date(inicioMes);
    inicioSemana.setDate(inicioSemana.getDate() + (semana - 1) * 7);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    
    return `${inicioSemana.getDate().toString().padStart(2, '0')}-${fimSemana.getDate().toString().padStart(2, '0')} ${mesesNomes[mes - 1].slice(0, 3)}`;
  }, [mesesNomes]);

  // Processar dados para resumos semanais e mensais
  const processarResumos = useCallback((eventos: DadosDesempenho[]) => {
    const semanasMap = new Map<number, DadosDesempenho[]>();
    
    eventos.forEach(evento => {
      if (!semanasMap.has(evento.semana)) {
        semanasMap.set(evento.semana, []);
      }
      semanasMap.get(evento.semana)!.push(evento);
    });

    const resumos: ResumoSemanal[] = Array.from(semanasMap.entries()).map(([semana, eventosSemanais]) => {
      const totalFaturamento = eventosSemanais.reduce((sum, e) => sum + e.faturamento_real, 0);
      const totalClientes = eventosSemanais.reduce((sum, e) => sum + e.clientes_real, 0);
      const ticketMedio = totalClientes > 0 ? totalFaturamento / totalClientes : 0;
      const performanceMedia = eventosSemanais.reduce((sum, e) => sum + e.performance_geral, 0) / eventosSemanais.length;

      return {
        semana,
        periodo: gerarPeriodoSemana(semana, mesAtual.getMonth() + 1, mesAtual.getFullYear()),
        total_faturamento: totalFaturamento,
        total_clientes: totalClientes,
        ticket_medio: ticketMedio,
        performance_media: performanceMedia,
        eventos: eventosSemanais
      };
    }).sort((a, b) => a.semana - b.semana);

    setResumoSemanal(resumos);

    // Calcular resumo mensal
    const totalMensal = resumos.reduce((acc, semana) => ({
      faturamento: acc.faturamento + semana.total_faturamento,
      clientes: acc.clientes + semana.total_clientes,
      ticket_medio: 0,
      performance_geral: acc.performance_geral + semana.performance_media
    }), { faturamento: 0, clientes: 0, ticket_medio: 0, performance_geral: 0 });

    totalMensal.ticket_medio = totalMensal.clientes > 0 ? totalMensal.faturamento / totalMensal.clientes : 0;
    totalMensal.performance_geral = resumos.length > 0 ? totalMensal.performance_geral / resumos.length : 0;

    setResumoMensal({
      mes: mesAtual.getMonth() + 1,
      ano: mesAtual.getFullYear(),
      semanas: resumos,
      totais: totalMensal
    });
  }, [mesAtual, gerarPeriodoSemana]);

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const mes = mesAtual.getMonth() + 1;
      const ano = mesAtual.getFullYear();
      
      if (!selectedBar) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/estrategico/desempenho?mes=${mes}&ano=${ano}`, {
        headers: {
          'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados de desempenho');
      }

      const data = await response.json();
      setDadosDesempenho(data.eventos || []);
      processarResumos(data.eventos || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de desempenho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [mesAtual, selectedBar, toast, processarResumos]);

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual);
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1);
    }
    setMesAtual(novoMes);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (performance >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // Funções do Modal
  const abrirModal = (evento: DadosDesempenho) => {
    setEventoSelecionado(evento);
    setEditData({
      nome_evento: evento.nome_evento,
      meta_faturamento: evento.meta_faturamento,
      clientes_plan: evento.clientes_plan,
    });
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setEventoSelecionado(null);
    setEditData({});
  };

  const salvarEdicao = async () => {
    if (!eventoSelecionado) return;
    setSalvando(true);
    try {
      const response = await fetch(`/api/eventos/${eventoSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: editData.nome_evento,
          meta_faturamento: Number(editData.meta_faturamento),
          clientes_plan: Number(editData.clientes_plan),
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Evento atualizado com sucesso",
        });
        carregarDados();
        setModalOpen(false);
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const excluirEvento = async () => {
    if (!eventoSelecionado) return;
    setSalvando(true);
    try {
      const response = await fetch(`/api/eventos/${eventoSelecionado.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Evento excluído com sucesso",
        });
        carregarDados();
        setModalOpen(false);
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    setPageTitle('📈 Desempenho');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, mesAtual, carregarDados]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando indicadores de desempenho...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header com navegação de mês */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📈 Desempenho Operacional
              </h1>
        <p className="text-gray-600 dark:text-gray-400">
                Análise detalhada dos indicadores de performance {selectedBar?.nome_bar && `- ${selectedBar.nome_bar}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navegarMes('anterior')}
                variant="outline"
                size="sm"
                className="h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium min-w-[140px] text-center">
                {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
              </div>
              
              <Button
                onClick={() => navegarMes('proximo')}
                variant="outline"
                size="sm"
                className="h-9 px-3"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={carregarDados}
                variant="outline"
                size="sm"
                className="h-9 px-3 ml-2"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="semanal" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Visão Semanal
            </TabsTrigger>
            <TabsTrigger value="mensal" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visão Mensal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="semanal" className="space-y-6">
            {/* Cards de KPI Semanais */}
            {resumoSemanal.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Faturamento Total</p>
                      <p className="text-2xl font-bold">
                        {formatarMoeda(resumoSemanal.reduce((sum, s) => sum + s.total_faturamento, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Clientes Atendidos</p>
                      <p className="text-2xl font-bold">
                        {resumoSemanal.reduce((sum, s) => sum + s.total_clientes, 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Ticket Médio</p>
                      <p className="text-2xl font-bold">
                        {formatarMoeda(resumoMensal?.totais.ticket_medio || 0)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Performance Geral</p>
                      <p className="text-2xl font-bold">
                        {(resumoMensal?.totais.performance_geral || 0).toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de Eventos Semanais */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Eventos por Semana - {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Evento</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Data</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Faturamento</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Clientes</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Ticket Médio</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Performance</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dadosDesempenho.map((evento) => (
                        <tr key={evento.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{evento.nome_evento}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Semana {evento.semana}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                            <div>{new Date(evento.data_evento).toLocaleDateString('pt-BR')}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{evento.dia_semana}</div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-gray-900 dark:text-white">
                            {formatarMoeda(evento.faturamento_real)}
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                            {evento.clientes_real}
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                            {formatarMoeda(evento.ticket_medio)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={getPerformanceBadge(evento.performance_geral)}>
                              {evento.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                onClick={() => abrirModal(evento)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mensal" className="space-y-6">
            {/* Cards de resumo mensal */}
            {resumoMensal && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Faturamento Mensal</p>
                      <p className="text-2xl font-bold">{formatarMoeda(resumoMensal.totais.faturamento)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Clientes Totais</p>
                      <p className="text-2xl font-bold">{resumoMensal.totais.clientes.toLocaleString('pt-BR')}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Ticket Médio Mensal</p>
                      <p className="text-2xl font-bold">{formatarMoeda(resumoMensal.totais.ticket_medio)}</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Performance Mensal</p>
                      <p className="text-2xl font-bold">{resumoMensal.totais.performance_geral.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de comparativo semanal */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Comparativo das Semanas - {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Semana</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Período</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Faturamento</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Clientes</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Ticket Médio</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Performance</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Eventos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {resumoSemanal.map((semana, index) => (
                        <tr key={semana.semana} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900 dark:text-white">
                              Semana {semana.semana}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">
                            {semana.periodo}
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-gray-900 dark:text-white">
                            {formatarMoeda(semana.total_faturamento)}
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                            {semana.total_clientes.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                            {formatarMoeda(semana.ticket_medio)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={getPerformanceBadge(semana.performance_media)}>
                              {semana.performance_media.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                              {semana.eventos.length} eventos
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      
                      {resumoMensal && (
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                          <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                            TOTAL DO MÊS
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-gray-600 dark:text-gray-400">
                            {resumoSemanal.length} semanas
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {formatarMoeda(resumoMensal.totais.faturamento)}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {resumoMensal.totais.clientes.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-gray-900 dark:text-white">
                            {formatarMoeda(resumoMensal.totais.ticket_medio)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={`${getPerformanceBadge(resumoMensal.totais.performance_geral)} font-bold`}>
                              {resumoMensal.totais.performance_geral.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold">
                              {dadosDesempenho.length} eventos
                            </Badge>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Edição */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit className="h-5 w-5" />
                Editar Evento - {eventoSelecionado?.nome_evento}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_evento" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Evento
                  </Label>
                  <Input
                    id="nome_evento"
                    value={editData.nome_evento || ''}
                    onChange={(e) => handleInputChange('nome_evento', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="Nome do evento"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_faturamento" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Meta Faturamento (R$)
                    </Label>
                    <Input
                      id="meta_faturamento"
                      type="number"
                      value={editData.meta_faturamento || ''}
                      onChange={(e) => handleInputChange('meta_faturamento', e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientes_plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clientes Planejados
                    </Label>
                    <Input
                      id="clientes_plan"
                      type="number"
                      value={editData.clientes_plan || ''}
                      onChange={(e) => handleInputChange('clientes_plan', e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Atuais (Read-only) */}
              {eventoSelecionado && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dados Atuais do Sistema</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500 dark:text-gray-400">Faturamento Real:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatarMoeda(eventoSelecionado.faturamento_real)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 dark:text-gray-400">Clientes Real:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {eventoSelecionado.clientes_real}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 dark:text-gray-400">Performance:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {eventoSelecionado.performance_geral.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={fecharModal}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={excluirEvento}
                disabled={salvando}
                variant="destructive"
                className="mr-2"
              >
                {salvando ? (
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </Button>
              <Button
                onClick={salvarEdicao}
                disabled={salvando}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                {salvando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}