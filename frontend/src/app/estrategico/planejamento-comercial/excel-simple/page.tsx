'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/api-client';
import { 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Users,
  DollarSign,
  Target,
  Clock
} from 'lucide-react';

export default function PlanejamentoComercialExcelSimplePage() {
  const { user } = useUser();
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mesAtual, setMesAtual] = useState(10); // Outubro
  const [anoAtual, setAnoAtual] = useState(2025);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const mesesNomes = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];

  useEffect(() => {
    setPageTitle('📊 Planejamento Comercial');
  }, [setPageTitle]);

  const carregarDados = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const data = await apiCall(`/api/estrategico/planejamento-comercial?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify({ ...user, bar_id: selectedBar?.id }))
        }
      });

      if (data.success && data.data) {
        // Filtrar apenas eventos válidos (não incluir terças que não abrimos)
        const eventosValidos = data.data.filter((evento: any) => {
          const dataEvento = new Date(evento.data_evento);
          const diaSemana = dataEvento.getDay(); // 0=domingo, 1=segunda, 2=terça, etc.
          
          // Não incluir terças (2) que não têm eventos programados
          if (diaSemana === 2 && (!evento.evento_nome || evento.evento_nome === '-')) {
            return false;
          }
          
          return true;
        });

        // Ordenar por data (01/10 até 31/10)
        const eventosOrdenados = eventosValidos.sort((a: any, b: any) => {
          return new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime();
        });

        setDados(eventosOrdenados);
      }
    } catch (error) {
      console.error('Erro ao carregar planejamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o planejamento comercial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando usuário ou filtros mudarem
  useEffect(() => {
    if (user && selectedBar) {
      carregarDados();
    }
  }, [user?.id, selectedBar?.id, mesAtual, anoAtual]);

  const formatCurrency = (value: number, isRealizado = false) => {
    if (value === 0) return '-';
    
    // Para valores realizados, mostrar valor completo
    if (isRealizado) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    
    // Para outros valores, formato compacto
    if (value > 1000) return `R$ ${(value/1000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  if (loading && dados.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full px-2 py-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-3">
        {/* Header com seletores */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Seletor de Mês */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <Select value={mesAtual.toString()} onValueChange={(value) => setMesAtual(parseInt(value))}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesNomes.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Ano */}
            <Select value={anoAtual.toString()} onValueChange={(value) => setAnoAtual(parseInt(value))}>
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="border-gray-300 text-sm px-3 py-1 h-8"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showSidebar ? 'Ocultar Análises' : 'Mostrar Análises'}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Carregando...
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {/* TABELA PRINCIPAL - FORMATO EXCEL OTIMIZADO */}
          <div className={`${showSidebar ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" style={{fontSize: '11px'}}>
                  <thead className="bg-gray-50 border-b border-gray-300">
                    <tr>
                      {/* Colunas fixas - melhor legibilidade */}
                      <th className="text-left py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Data</th>
                      <th className="text-left py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Dia</th>
                      <th className="text-left py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-64" style={{fontSize: '11px'}}>Obs Data</th>
                      
                      {/* Realizado */}
                      <th className="text-right py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-28" style={{fontSize: '11px'}}>Realizado</th>
                      
                      {/* Nº Clientes */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Plan</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Real</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-20" style={{fontSize: '11px'}}>Res Total</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-20" style={{fontSize: '11px'}}>Res Pres</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-20" style={{fontSize: '11px'}}>Lot Max</th>
                      
                      {/* Ticket Entrada */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Plan</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-16" style={{fontSize: '11px'}}>Real</th>
                      
                      {/* Ticket Bar */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Plan</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-16" style={{fontSize: '11px'}}>Real</th>
                      
                      {/* TM */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-20" style={{fontSize: '11px'}}>TM</th>
                      
                      {/* Rentabilidade Atrações */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-20" style={{fontSize: '11px'}}>C. Art</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-20" style={{fontSize: '11px'}}>C. Prod</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-16" style={{fontSize: '11px'}}>%A</th>
                      
                      {/* Cesta */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-12" style={{fontSize: '11px'}}>%B</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-12" style={{fontSize: '11px'}}>%D</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-12" style={{fontSize: '11px'}}>%C</th>
                      
                      {/* Tempo */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r border-gray-300 w-16" style={{fontSize: '11px'}}>Coz</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-900 border-r-2 border-gray-400 w-16" style={{fontSize: '11px'}}>Bar</th>
                      
                      {/* NPS */}
                      <th className="text-center py-2 px-2 font-bold text-gray-900 w-16" style={{fontSize: '11px'}}>NPS</th>
                    </tr>
                    
                    {/* Segunda linha de cabeçalho com grupos */}
                    <tr className="bg-blue-50">
                      <th className="border-r border-gray-300"></th>
                      <th className="border-r border-gray-300"></th>
                      <th className="border-r-2 border-gray-400"></th>
                      <th className="border-r-2 border-gray-400"></th>
                      <th className="text-center py-1 px-1 font-semibold text-blue-900 border-r-2 border-gray-400" colSpan={5} style={{fontSize: '8px'}}>Nº Clientes</th>
                      <th className="text-center py-1 px-1 font-semibold text-green-900 border-r-2 border-gray-400" colSpan={2} style={{fontSize: '8px'}}>Ticket Entrada</th>
                      <th className="text-center py-1 px-1 font-semibold text-purple-900 border-r-2 border-gray-400" colSpan={2} style={{fontSize: '8px'}}>Ticket Bar</th>
                      <th className="border-r-2 border-gray-400"></th>
                      <th className="text-center py-1 px-1 font-semibold text-orange-900 border-r-2 border-gray-400" colSpan={3} style={{fontSize: '8px'}}>Rentabilidade Atrações</th>
                      <th className="text-center py-1 px-1 font-semibold text-red-900 border-r-2 border-gray-400" colSpan={3} style={{fontSize: '8px'}}>Cesta</th>
                      <th className="text-center py-1 px-1 font-semibold text-gray-900 border-r-2 border-gray-400" colSpan={2} style={{fontSize: '8px'}}>Tempo</th>
                      <th className="text-center py-1 px-1 font-semibold text-indigo-900" style={{fontSize: '8px'}}>NPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map((evento, index) => {
                      const isRealizado = evento.real_receita > 0;
                      const hoje = new Date();
                      const dataEvento = new Date(evento.data_evento);
                      const jaPassou = dataEvento < hoje;
                      
                      // Cores baseadas em performance vs planejado
                      const getCorPerformance = (real: number, plan: number) => {
                        if (real === 0) return '#6b7280'; // Cinza para não realizado
                        return real >= plan ? '#16a34a' : '#dc2626'; // Verde se atingiu, vermelho se não
                      };
                      
                      const rowBg = !isRealizado && evento.evento_nome !== '-' ? 'bg-yellow-25' : '';
                      
                      return (
                        <tr 
                          key={index} 
                          className={`${rowBg} border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors`} 
                          style={{height: '26px'}}
                          onClick={() => {
                            setEventoSelecionado(evento);
                            setModalOpen(true);
                          }}
                          title="Clique para editar dados do evento"
                        >
                          {/* Colunas fixas */}
                          <td className="py-1 px-2 font-medium text-gray-900 border-r border-gray-300" style={{fontSize: '11px'}}>
                            {String(evento.dia).padStart(2, '0')}/{String(evento.mes).padStart(2, '0')}
                          </td>
                          <td className="py-1 px-2 text-gray-700 border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.dia_semana.substring(0, 3).toUpperCase()}
                          </td>
                          <td className="py-1 px-2 text-gray-700 font-medium border-r-2 border-gray-400" style={{fontSize: '11px'}}>
                            {evento.evento_nome || '-'}
                          </td>
                          
                          {/* Realizado - Valor completo */}
                          <td className="py-1 px-2 text-right font-semibold border-r-2 border-gray-400" 
                              style={{color: getCorPerformance(evento.real_receita, evento.m1_receita), fontSize: '11px'}}>
                            {formatCurrency(evento.real_receita, true)}
                          </td>
                          
                          {/* Nº Clientes */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.clientes_plan > 0 ? evento.clientes_plan : '-'}
                          </td>
                          <td className="py-1 px-2 text-center font-semibold border-r border-gray-300" 
                              style={{color: getCorPerformance(evento.clientes_real, evento.clientes_plan), fontSize: '11px'}}>
                            {evento.clientes_real > 0 ? evento.clientes_real : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.res_tot > 0 ? evento.res_tot : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {(jaPassou && evento.res_p > 0) ? evento.res_p : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r-2 border-gray-400" style={{fontSize: '11px'}}>
                            {evento.res_tot > 0 ? evento.res_tot : '-'}
                          </td>
                          
                          {/* Ticket Entrada */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {formatCurrency(evento.te_plan)}
                          </td>
                          <td className="py-1 px-2 text-center font-semibold border-r-2 border-gray-400"
                              style={{color: getCorPerformance(evento.te_real, evento.te_plan), fontSize: '11px'}}>
                            {formatCurrency(evento.te_real)}
                          </td>
                          
                          {/* Ticket Bar */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {formatCurrency(evento.tb_plan)}
                          </td>
                          <td className="py-1 px-2 text-center font-semibold border-r-2 border-gray-400"
                              style={{color: getCorPerformance(evento.tb_real, evento.tb_plan), fontSize: '11px'}}>
                            {formatCurrency(evento.tb_real)}
                          </td>
                          
                          {/* TM */}
                          <td className="py-1 px-2 text-center font-semibold border-r-2 border-gray-400"
                              style={{color: getCorPerformance(evento.t_medio, (evento.te_plan + evento.tb_plan)), fontSize: '11px'}}>
                            {formatCurrency(evento.t_medio)}
                          </td>
                          
                          {/* Rentabilidade Atrações */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {formatCurrency(evento.c_art)}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {formatCurrency(evento.c_prod)}
                          </td>
                          <td className="py-1 px-2 text-center border-r-2 border-gray-400" style={{fontSize: '11px'}}>
                            {evento.percent_art_fat > 0 ? evento.percent_art_fat.toFixed(0) + '%' : '-'}
                          </td>
                          
                          {/* Cesta */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.percent_b > 0 ? evento.percent_b.toFixed(0) + '%' : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.percent_d > 0 ? evento.percent_d.toFixed(0) + '%' : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r-2 border-gray-400" style={{fontSize: '11px'}}>
                            {evento.percent_c > 0 ? evento.percent_c.toFixed(0) + '%' : '-'}
                          </td>
                          
                          {/* Tempo */}
                          <td className="py-1 px-2 text-center border-r border-gray-300" style={{fontSize: '11px'}}>
                            {evento.t_coz > 0 ? evento.t_coz.toFixed(0) : '-'}
                          </td>
                          <td className="py-1 px-2 text-center border-r-2 border-gray-400" style={{fontSize: '11px'}}>
                            {evento.t_bar > 0 ? evento.t_bar.toFixed(0) : '-'}
                          </td>
                          
                          {/* NPS - Editável */}
                          <td className="py-1 px-2 text-center font-semibold" style={{fontSize: '11px'}}>
                            {evento.nps_score || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDEBAR COMPLETO - IGUAL PÁGINA ORIGINAL */}
          {showSidebar && (
            <div className="w-1/4">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sticky top-4">
                <div className="space-y-4">
                  {/* Título do painel */}
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-600" />
                      Controles
                    </h3>
                  </div>
                  
                  {/* Período */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Período
                    </label>
                    <div className="text-sm text-blue-600 font-medium">
                      {mesesNomes.find(m => m.value === mesAtual)?.label} {anoAtual}
                    </div>
                  </div>

                  {/* Eventos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      📅 Eventos:
                    </label>
                    <div className="text-2xl font-bold text-gray-900">
                      {dados.filter(e => e.evento_nome && e.evento_nome !== '-').length}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Estatísticas
                    </label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Meta M1:</span>
                        <span className="font-semibold text-blue-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Realizado:</span>
                        <span className="font-semibold text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(dados.reduce((acc, e) => acc + (e.real_receita || 0), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Atingido:</span>
                        <span className="font-semibold text-orange-600">
                          {dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0) > 0 
                            ? ((dados.reduce((acc, e) => acc + (e.real_receita || 0), 0) / dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0)) * 100).toFixed(1) + '%'
                            : '0%'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Falta faturar:</span>
                        <span className="font-semibold text-red-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(Math.max(0, dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0) - dados.reduce((acc, e) => acc + (e.real_receita || 0), 0)))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Empilhamento M1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Empilhamento M1:
                    </label>
                    <div className="text-xl font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0))}
                    </div>
                  </div>

                  {/* GAP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      GAP:
                    </label>
                    <div className="text-lg font-bold text-red-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0) - dados.reduce((acc, e) => acc + (e.real_receita || 0), 0))} (-{dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0) > 0 
                        ? (((dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0) - dados.reduce((acc, e) => acc + (e.real_receita || 0), 0)) / dados.reduce((acc, e) => acc + (e.m1_receita || 0), 0)) * 100).toFixed(1)
                        : '0'
                      }%)
                    </div>
                  </div>

                  {/* Ticket Médio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      T.M Entrada:
                    </label>
                    <div className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(dados.filter(e => e.te_real > 0).length > 0 
                        ? dados.reduce((acc, e) => acc + (e.te_real || 0), 0) / dados.filter(e => e.te_real > 0).length
                        : 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      T.M Entrada Real: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(dados.filter(e => e.te_real > 0).length > 0 
                        ? dados.reduce((acc, e) => acc + (e.te_real || 0), 0) / dados.filter(e => e.te_real > 0).length
                        : 0
                      )}
                    </div>
                  </div>

                  {/* Meta Clientes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Meta Clientes:
                    </label>
                    <div className="text-lg font-bold text-purple-600">
                      {dados.reduce((acc, e) => acc + (e.clientes_plan || 0), 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Clientes Real: {dados.reduce((acc, e) => acc + (e.clientes_real || 0), 0).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Meta Reservas Presentes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Meta Reservas Presentes:
                    </label>
                    <div className="text-lg font-bold text-indigo-600">
                      {dados.reduce((acc, e) => acc + (e.res_tot || 0), 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Reservas Presentes Real: {dados.filter(e => e.res_p > 0).reduce((acc, e) => acc + (e.res_p || 0), 0).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
