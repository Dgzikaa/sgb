'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Edit, 
  Save, 
  X, 
  RefreshCcw, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  ChefHat,
  Wine,
  Target,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react';

interface PlanejamentoData {
  evento_id: number;
  data_evento: string;
  dia_semana: string;
  evento_nome: string;
  dia: number;
  mes: number;
  ano: number;
  dia_formatado: string;
  data_curta: string;
  
  // Dados financeiros
  real_receita: number;
  m1_receita: number;
  
  // Dados de público
  clientes_plan: number;
  clientes_real: number;
  lot_max: number;
  
  // Tickets
  te_plan: number;
  te_real: number;
  tb_plan: number;
  tb_real: number;
  t_medio: number;
  
  // Custos
  c_art: number;
  c_prod: number;
  percent_art_fat: number;
  
  // Percentuais
  percent_b: number;
  percent_d: number;
  percent_c: number;
  
  // Tempos e performance
  t_coz: number;
  t_bar: number;
  fat_19h: number;
  
  // Flags de performance
  real_vs_m1_green: boolean;
  ci_real_vs_plan_green: boolean;
  te_real_vs_plan_green: boolean;
  tb_real_vs_plan_green: boolean;
  t_medio_green: boolean;
  percent_art_fat_green: boolean;
  t_coz_green: boolean;
  t_bar_green: boolean;
  fat_19h_green: boolean;
}

interface EventoEdicao {
  id: number;
  nome: string;
  m1_r: number;
  cl_plan: number;
  te_plan: number;
  tb_plan: number;
  c_artistico_plan: number;
  observacoes: string;
}

export default function PlanejamentoComercialPage() {
  const { user } = useAuth();
  
  // Estados principais
  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<PlanejamentoData | null>(null);
  const [eventoEdicao, setEventoEdicao] = useState<EventoEdicao | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Buscar dados da API
  const buscarDados = async (mes?: number, ano?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const mesParam = mes || filtroMes;
      const anoParam = ano || filtroAno;
      
      console.log(`🔍 Buscando dados para ${mesParam}/${anoParam}`);
      
      const data = await apiCall(`/api/estrategico/planejamento-comercial?mes=${mesParam}&ano=${anoParam}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });
      
      console.log('📊 Nova estrutura - Dados recebidos:', {
        total: data.data?.length || 0,
        estrutura: data.meta?.estrutura,
        eventos_recalculados: data.meta?.eventos_recalculados,
        dados_reais_disponiveis: data.meta?.dados_reais_disponiveis
      });

      if (data.success && data.data) {
        setDados(data.data);
        console.log(`✅ ${data.data.length} eventos carregados para ${mesParam}/${anoParam}`);
        
        // Mostrar informações sobre dados reais disponíveis
        if (data.meta?.dados_reais_disponiveis) {
          console.log('📅 Períodos com dados reais:', data.meta.dados_reais_disponiveis);
        }
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      buscarDados();
    }
  }, [user, filtroMes, filtroAno]);

  // Alterar mês/ano
  const alterarPeriodo = (novoMes: number, novoAno: number) => {
    setFiltroMes(novoMes);
    setFiltroAno(novoAno);
    setMesAtual(new Date(novoAno, novoMes - 1, 1));
  };

  // Abrir modal de edição
  const abrirModal = (evento: PlanejamentoData) => {
    setEventoSelecionado(evento);
    setEventoEdicao({
      id: evento.evento_id,
      nome: evento.evento_nome,
      m1_r: evento.m1_receita,
      cl_plan: evento.clientes_plan,
      te_plan: evento.te_plan,
      tb_plan: evento.tb_plan,
      c_artistico_plan: evento.c_art || 0,
      observacoes: ''
    });
    setModalOpen(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalOpen(false);
    setEventoSelecionado(null);
    setEventoEdicao(null);
  };

  // Salvar edição
  const salvarEdicao = async () => {
    if (!eventoEdicao) return;

    try {
      setSalvando(true);
      
      const response = await apiCall(`/api/eventos/${eventoEdicao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          nome: eventoEdicao.nome,
          m1_r: eventoEdicao.m1_r,
          cl_plan: eventoEdicao.cl_plan,
          te_plan: eventoEdicao.te_plan,
          tb_plan: eventoEdicao.tb_plan,
          c_artistico_plan: eventoEdicao.c_artistico_plan,
          observacoes: eventoEdicao.observacoes
        })
      });

      if (response.success) {
        console.log('✅ Evento atualizado com sucesso');
        fecharModal();
        // Recarregar dados
        await buscarDados();
      } else {
        throw new Error(response.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      alert('Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  };

  // Formatação de valores
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  // Componente de Badge de Status
  const StatusBadge = ({ isGreen, value, suffix = '' }: { isGreen: boolean; value: number | string; suffix?: string }) => (
    <Badge variant={isGreen ? "default" : "destructive"} className="text-xs">
      {isGreen ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
      {value}{suffix}
    </Badge>
  );

  // Meses para o seletor
  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // Anos disponíveis
  const anos = [2024, 2025, 2026];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando planejamento comercial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="card-dark p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <h3 className="card-title-dark mb-2">Erro ao carregar dados</h3>
            <p className="card-description-dark mb-4">{error}</p>
            <Button onClick={() => buscarDados()} className="btn-primary-dark">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header com filtros */}
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="card-title-dark mb-2 flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-blue-600" />
                Planejamento Comercial
              </h1>
              <p className="card-description-dark">
                Gestão completa de metas e resultados dos eventos
              </p>
            </div>
            
            {/* Filtros de período */}
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={filtroMes.toString()} onValueChange={(value) => alterarPeriodo(parseInt(value), filtroAno)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtroAno.toString()} onValueChange={(value) => alterarPeriodo(filtroMes, parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => buscarDados()} 
                variant="outline" 
                size="sm"
                className="btn-outline-dark"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de eventos */}
        {dados.length === 0 ? (
          <Card className="card-dark p-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="card-title-dark mb-2">Nenhum evento encontrado</h3>
              <p className="card-description-dark">
                Não há eventos cadastrados para {meses.find(m => m.value === filtroMes)?.label} de {filtroAno}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="card-dark">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="card-title-dark">
                {meses.find(m => m.value === filtroMes)?.label} {filtroAno} - {dados.length} eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data/Evento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Público
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tickets
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dados.map((evento) => (
                      <tr key={evento.evento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {evento.dia_formatado}/{filtroMes} - {evento.dia_semana}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {evento.evento_nome}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <StatusBadge 
                              isGreen={evento.real_vs_m1_green} 
                              value={formatarMoeda(evento.real_receita)} 
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Meta: {formatarMoeda(evento.m1_receita)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <StatusBadge 
                              isGreen={evento.ci_real_vs_plan_green} 
                              value={evento.clientes_real} 
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Plan: {evento.clientes_plan} | Max: {evento.lot_max}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <StatusBadge 
                                isGreen={evento.te_real_vs_plan_green} 
                                value={formatarMoeda(evento.te_real)} 
                              />
                              <StatusBadge 
                                isGreen={evento.tb_real_vs_plan_green} 
                                value={formatarMoeda(evento.tb_real)} 
                              />
                            </div>
                            <StatusBadge 
                              isGreen={evento.t_medio_green} 
                              value={formatarMoeda(evento.t_medio)} 
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {evento.percent_b > 0 && (
                              <div className="text-xs">
                                B: {formatarPercentual(evento.percent_b)} | 
                                D: {formatarPercentual(evento.percent_d)} | 
                                C: {formatarPercentual(evento.percent_c)}
                              </div>
                            )}
                            {evento.c_art > 0 && (
                              <StatusBadge 
                                isGreen={evento.percent_art_fat_green} 
                                value={formatarPercentual(evento.percent_art_fat)} 
                                suffix=" Art/Fat"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            onClick={() => abrirModal(evento)}
                            size="sm"
                            variant="outline"
                            className="btn-outline-dark"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de edição */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 backdrop-blur-sm">
            <DialogHeader className="bg-gradient-to-r from-blue-700 to-purple-600 p-6 text-white shadow-lg">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <Edit className="h-7 w-7 text-blue-200" />
                Editar Planejamento - {eventoSelecionado?.dia_formatado}/{filtroMes}/{filtroAno}
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">Ajuste os dados de planejamento e orçamentação para este evento.</p>
            </DialogHeader>
            
            {eventoEdicao && eventoSelecionado && (
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Seção de Planejamento */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Dados de Planejamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Evento</label>
                        <Input
                          value={eventoEdicao.nome}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, nome: e.target.value})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Meta Receita (M1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.m1_r}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, m1_r: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Clientes Planejados</label>
                        <Input
                          type="number"
                          value={eventoEdicao.cl_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, cl_plan: parseInt(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Entrada Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.te_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, te_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Bar Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.tb_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, tb_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custo Artístico Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.c_artistico_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, c_artistico_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Observações */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-300 flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={eventoEdicao.observacoes}
                      onChange={(e) => setEventoEdicao({...eventoEdicao, observacoes: e.target.value})}
                      placeholder="Observações sobre o evento, ajustes, particularidades..."
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {/* Seção de Dados Atuais (Read-only) */}
                <Card className="bg-gray-800/30 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Dados Atuais do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">Receita Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.real_receita)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">Clientes Real</div>
                        <div className="text-white font-semibold">{eventoSelecionado.clientes_real}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">TE Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.te_real)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">TB Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.tb_real)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">T. Médio</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.t_medio)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Bebidas</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_b)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Drinks</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_d)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Comidas</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_c)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="bg-gray-900/50 p-4 border-t border-gray-700 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={fecharModal} 
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button 
                onClick={salvarEdicao} 
                disabled={salvando} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Alterações
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
