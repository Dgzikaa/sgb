'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCcw, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api-client';

interface PlanejamentoData {
  evento_id: number;
  data_evento: string;
  dia_semana: string;
  evento_nome: string;
  bar_id: number;
  bar_nome: string;
  dia: number;
  mes: number;
  ano: number;
  dia_formatado: string;
  data_curta: string;
  real_receita: number;
  m1_receita: number;
  clientes_plan: number;
  clientes_real: number;
  res_total: number;
  res_presente: number;
  lot_max: number;
  te_plan: number;
  te_real: number;
  tb_plan: number;
  tb_real: number;
  t_medio: number;
  c_art: number;
  c_prod: number;
  percent_art_fat: number;
  percent_b: number;
  percent_d: number;
  percent_c: number;
  t_coz: number;
  t_bar: number;
  fat_19h: number;
  pagamentos_liquido: number;
  total_vendas: number;
  vendas_bebida: number;
  vendas_drink: number;
  vendas_comida: number;
  percentual_atingimento_receita: number;
  percentual_atingimento_clientes: number;
  performance_geral: number;
  
  // Flags para coloração verde/vermelho
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

export default function PlanejamentoComercialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pega mes/ano da URL ou do sistema
  const now = new Date();
  const mesUrl = Number(searchParams.get('mes'));
  const anoUrl = Number(searchParams.get('ano'));
  const mesInicial = mesUrl && mesUrl >= 1 && mesUrl <= 12 ? mesUrl - 1 : now.getMonth();
  const anoInicial = anoUrl || now.getFullYear();

  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date(anoInicial, mesInicial));
  const [totalEventos, setTotalEventos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Buscar dados da API
  const buscarDados = useCallback(async () => {
    try {
      setLoading(true);
      const mes = mesAtual.getMonth() + 1;
      const ano = mesAtual.getFullYear();
      
      // Buscar dados do usuário do localStorage
      const userData = localStorage.getItem('sgb_user');
      if (!userData) {
        setError('Usuário não autenticado');
        return;
      }

      const user = JSON.parse(userData);
      
      const data = await apiCall(`/api/gestao/planejamento-comercial?mes=${mes}&ano=${ano}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (data.data) {
        console.log('📊 Dados recebidos na página:', data.data);
        console.log('📊 Quantidade de registros:', data.data.length);
        console.log('📊 Primeiro registro (dia):', data.data[0]?.dia);
        console.log('📊 Todos os dias:', data.data.map(item => item.dia));
        setDados(data.data);
        setTotalEventos(data.data.length || 0);
        setError(null);
      } else {
        console.log('❌ Erro ou dados vazios:', data);
        setError(data.error || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [mesAtual]);

  // Atualiza a URL ao mudar de mês
  useEffect(() => {
    const mes = mesAtual.getMonth() + 1;
    const ano = mesAtual.getFullYear();
    router.replace(`/gestao/planejamento-comercial?mes=${mes}&ano=${ano}`);
  }, [mesAtual, router]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

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

  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  // Função para aplicar cor verde/vermelho baseado na condição
  const getColorClass = (isGreen: boolean): string => {
    return isGreen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCcw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-700 dark:text-gray-300">Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Layout Lateral */}
      <div className="h-full flex pt-0 overflow-hidden">
        {/* Sidebar Analytics */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 p-2 hidden lg:block overflow-hidden">
          <div className="space-y-1 pt-6">
            {/* Navegação de Mês */}
            <div>
              <label className="text-xs font-medium text-gray-300 mb-1 block">
                📅 Período
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navegarMes('anterior')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 px-3 py-2 bg-blue-600 rounded-lg text-center">
                  <span className="text-sm font-bold text-white">
                    {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                  </span>
                </div>
                
                <Button
                  onClick={() => navegarMes('proximo')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Analytics Totais */}
              <div>
              <label className="text-xs font-medium text-gray-300 mb-1 block">
                📊 Analytics do Mês
              </label>
              <div className="space-y-1 overflow-hidden">
                {/* Total M1 vs Real */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Total M1 vs Real</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const totalM1 = dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0);
                        const totalReal = dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0);
                        const performance = totalM1 > 0 ? (totalReal / totalM1) * 100 : 0;
                        
                        if (performance >= 100) {
                          return <span className="text-green-400">🚀</span>;
                        } else if (performance >= 80) {
                          return <span className="text-yellow-400">⚡</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">
                        R$ {dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        R$ {dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-700">
                      <span className="text-gray-400">Resultado:</span>
                      <span className={`font-bold ${(() => {
                        const totalM1 = dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0);
                        const totalReal = dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0);
                        const resultado = totalReal - totalM1;
                        return resultado >= 0 ? 'text-green-400' : 'text-red-400';
                      })()}`}>
                        {(() => {
                          const totalM1 = dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0);
                          const totalReal = dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0);
                          const resultado = totalReal - totalM1;
                          return resultado >= 0 ? `+R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Performance:</span>
                      <span className={`font-bold ${(() => {
                        const totalM1 = dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0);
                        const totalReal = dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0);
                        const perf = totalM1 > 0 ? ((totalReal - totalM1) / totalM1) * 100 : 0;
                        return perf >= 0 ? 'text-green-400' : 'text-red-400';
                      })()}`}>
                        {(() => {
                          const totalM1 = dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0);
                          const totalReal = dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0);
                          const perf = totalM1 > 0 ? ((totalReal - totalM1) / totalM1) * 100 : 0;
                          return perf >= 0 ? `+${perf.toFixed(1)}%` : `${perf.toFixed(1)}%`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clientes Plan vs Real */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Clientes Plan vs Real</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const totalPlan = dados.reduce((sum, item) => sum + (Number(item.clientes_plan) || 0), 0);
                        const totalReal = dados.reduce((sum, item) => sum + (Number(item.clientes_real) || 0), 0);
                        const performance = totalPlan > 0 ? (totalReal / totalPlan) * 100 : 0;
                        
                        if (performance >= 100) {
                          return <span className="text-green-400">🚀</span>;
                        } else if (performance >= 80) {
                          return <span className="text-yellow-400">⚡</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">
                        {dados.reduce((sum, item) => sum + (Number(item.clientes_plan) || 0), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        {dados.reduce((sum, item) => sum + (Number(item.clientes_real) || 0), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Médio */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Ticket Médio</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const mediaTicket = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_medio) || 0), 0) / dados.filter(item => Number(item.t_medio) > 0).length : 0;
                        const meta = 93.00;
                        
                        if (mediaTicket >= meta) {
                          return <span className="text-green-400">🚀</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">R$ 93,00</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        R$ {(() => {
                          const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_medio) || 0), 0) / dados.filter(item => Number(item.t_medio) > 0).length : 0;
                          return media.toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tempo Médio de Bar */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Tempo Médio de Bar</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const mediaBar = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_bar) || 0), 0) / dados.filter(item => Number(item.t_bar) > 0).length : 0;
                        
                        if (mediaBar <= 4) {
                          return <span className="text-green-400">🚀</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">≤ 4min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        {(() => {
                          const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_bar) || 0), 0) / dados.filter(item => Number(item.t_bar) > 0).length : 0;
                          return media.toFixed(1);
                        })()}min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tempo Médio de Cozinha */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Tempo Médio de Cozinha</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const mediaCoz = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_coz) || 0), 0) / dados.filter(item => Number(item.t_coz) > 0).length : 0;
                        
                        if (mediaCoz <= 12) {
                          return <span className="text-green-400">🚀</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">≤ 12min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        {(() => {
                          const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_coz) || 0), 0) / dados.filter(item => Number(item.t_coz) > 0).length : 0;
                          return media.toFixed(1);
                        })()}min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fat até 19h */}
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Fat até 19h</span>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const mediaFat = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.fat_19h) || 0), 0) / dados.filter(item => Number(item.fat_19h) > 0).length : 0;
                        const meta = 15;
                        
                        if (mediaFat >= meta) {
                          return <span className="text-green-400">🚀</span>;
                        } else {
                          return <span className="text-red-400">⬇️</span>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Planejado:</span>
                      <span className="font-medium text-white">≥ 15%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Realizado:</span>
                      <span className="font-bold text-white">
                        {(() => {
                          const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.fat_19h) || 0), 0) / dados.filter(item => Number(item.fat_19h) > 0).length : 0;
                          return media.toFixed(1);
                        })()}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>

        {/* Mobile Header - só no mobile */}
        <div className="lg:hidden bg-gray-900 p-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navegarMes('anterior')}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-bold text-white">
                  {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </span>
              
              <Button
                onClick={() => navegarMes('proximo')}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-gray-800 border-gray-600 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={buscarDados} variant="outline" size="sm" className="h-8 px-3 bg-gray-800 border-gray-600 text-white">
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Área Principal da Tabela */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 pt-0">
          {/* Container da tabela - empurrada para baixo */}
          <div className="h-full overflow-auto pt-0">
            <div className="mt-8">
              <table className="w-full text-xs border-collapse border-spacing-0">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  {/* Colunas fixas - largura reduzida */}
                  <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-center font-medium text-gray-700 dark:text-gray-300 w-16 border-r border-gray-200 dark:border-gray-700">
                    Data
                  </th>
                  <th className="sticky left-16 z-20 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-center font-medium text-gray-700 dark:text-gray-300 w-16 border-r border-gray-200 dark:border-gray-700">
                    Dia
                  </th>
                  
                  {/* Faturamento */}
                  <th className="px-1 py-1 text-center font-medium text-white bg-blue-600 border-r border-blue-500 w-20">
                    Real (R$)
                  </th>
                  <th className="px-1 py-1 text-center font-medium text-white bg-blue-600 border-r border-blue-500 w-20">
                    M1 (R$)
                  </th>
                  
                  {/* Clientes */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Cl.Plan
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Cl.Real
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Res.Tot
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Res.P
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Lot.Max
                  </th>
                  
                  {/* Tickets */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.E.Plan
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.E.Real
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.B.Plan
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.B.Real
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.Médio
                  </th>
                  
                  {/* Rentabilidade */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-18">
                    C.Art
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-18">
                    C.Prod
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-16">
                    %Art/Fat
                  </th>
                  
                  {/* Cesta */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %B
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %D
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %C
                  </th>
                  
                  {/* Tempo */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-red-600 border-r border-red-500 w-16">
                    T.Coz
                  </th>
                  <th className="px-2 py-1 text-center font-medium text-white bg-red-600 border-r border-red-500 w-16">
                    T.Bar
                  </th>
                  
                  {/* Faturamento até 19h */}
                  <th className="px-2 py-1 text-center font-medium text-white bg-yellow-600 w-16">
                    Fat.19h
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dados.map((item, index) => {
                  return (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      item.real_receita > 0 ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                    }`}
                    title={item.evento_nome ? `Evento: ${item.evento_nome}` : 'Sem evento'}
                  >
                    {/* Colunas fixas */}
                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-xs text-center font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.dia_semana}
                    </td>
                    <td className="sticky left-16 z-10 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-xs text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      {item.dia_formatado}
                    </td>
                    
                                               {/* Faturamento */}
                           <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.real_vs_m1_green)}`}>
                             {(item.real_receita && Number(item.real_receita) > 0) ? formatarMoeda(Number(item.real_receita)) : '-'}
                           </td>
                           <td className="px-1 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {(item.m1_receita && Number(item.m1_receita) > 0) ? formatarMoeda(Number(item.m1_receita)) : '-'}
                           </td>
                    
                    {/* Clientes */}
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes_plan || '-'}
                    </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.ci_real_vs_plan_green)}`}>
                      {item.clientes_real || '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.res_total || '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.res_presente || '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.lot_max || '-'}
                    </td>
                    
                    {/* Tickets */}
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.te_plan > 0 ? formatarMoeda(item.te_plan) : '-'}
                    </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.te_real_vs_plan_green)}`}>
                      {item.te_real > 0 ? formatarMoeda(item.te_real) : '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.tb_plan > 0 ? formatarMoeda(item.tb_plan) : '-'}
                    </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.tb_real_vs_plan_green)}`}>
                      {item.tb_real > 0 ? formatarMoeda(item.tb_real) : '-'}
                    </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.t_medio_green)}`}>
                      {item.t_medio > 0 ? formatarMoeda(item.t_medio) : '-'}
                    </td>
                    
                                               {/* Rentabilidade */}
                           <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.c_art > 0 ? formatarMoeda(item.c_art) : '-'}
                           </td>
                           <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.c_prod > 0 ? formatarMoeda(item.c_prod) : '-'}
                           </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${
                      item.percent_art_fat > 0 
                        ? (item.percent_art_fat < 15 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.percent_art_fat > 0 ? `${item.percent_art_fat.toFixed(1)}%` : '-'}
                    </td>
                    
                    {/* Cesta */}
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {(item.percent_b && Number(item.percent_b) > 0) ? `${Number(item.percent_b).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {(item.percent_d && Number(item.percent_d) > 0) ? `${Number(item.percent_d).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-1 py-1 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {(item.percent_c && Number(item.percent_c) > 0) ? `${Number(item.percent_c).toFixed(1)}%` : '-'}
                    </td>
                    
                    {/* Tempo */}
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.t_coz_green)}`}>
                      {item.t_coz > 0 ? item.t_coz.toFixed(1) : '-'}
                    </td>
                    <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.t_bar_green)}`}>
                      {item.t_bar > 0 ? item.t_bar.toFixed(1) : '-'}
                    </td>
                    
                    {/* Faturamento até 19h */}
                    <td className={`px-1 py-1 text-xs text-center ${getColorClass(item.fat_19h_green)}`}>
                      {item.fat_19h > 0 ? `${item.fat_19h.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 