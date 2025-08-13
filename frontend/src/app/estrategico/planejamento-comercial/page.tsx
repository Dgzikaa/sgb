'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ChevronRight,
  Edit,
  Save,
  X
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
  
  // Campos de orçamentação
  c_artistico_plan?: number;
  c_artistico_real?: number;
  
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
  
  // Estados do Modal de Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<PlanejamentoData | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [salvando, setSalvando] = useState(false);

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
      
      const data = await apiCall(`/api/estrategico/planejamento-comercial?mes=${mes}&ano=${ano}`, {
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
    router.replace(`/estrategico/planejamento-comercial?mes=${mes}&ano=${ano}`);
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

  // Funções do Modal de Edição
  const abrirModal = (evento: PlanejamentoData) => {
    setEventoSelecionado(evento);
    setEditData({
      nome_evento: evento.evento_nome || '',
      m1_receita: evento.m1_receita || 0,
      real_receita: evento.real_receita || 0,
      clientes_plan: evento.clientes_plan || 0,
      te_plan: evento.te_plan || 0,
      tb_plan: evento.tb_plan || 0,
      c_artistico_plan: evento.c_artistico_plan || 0,
      observacoes: ''
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
      const resp = await apiCall(
        `/api/eventos/${eventoSelecionado.evento_id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            nome: editData.nome_evento,
            m1_r: Number(editData.m1_receita),
            cl_plan: Number(editData.clientes_plan),
            te_plan: Number(editData.te_plan),
            tb_plan: Number(editData.tb_plan),
            c_artistico_plan: Number(editData.c_artistico_plan),
            observacoes: editData.observacoes
          })
        }
      );
      if (resp.ok) { buscarDados(); setModalOpen(false); }
    } catch (err) {
      console.error(err);
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <RefreshCcw className="h-6 w-6 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-700 dark:text-gray-300">Carregando...</span>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 ">
      {/* Layout Lateral */}
      <aside className={`flex flex-col w-80 bg-gray-50 dark:bg-gray-900 p-4 ${modalOpen ? 'hidden' : 'block'}`}>
        <div className="space-y-6 w-full">
          {/* Navegação de Mês */}
          <div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navegarMes('anterior')}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-l-full"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4 dark:text-white" />
              </Button>
              
              <div className="flex-1 px-3 py-1.5 bg-blue-600 rounded-[4px] text-center text-sm font-bold text-white">
                {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
              </div>
              
              <Button
                onClick={() => navegarMes('proximo')}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-r-full"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4 dark:text-white" />
              </Button>
            </div>
          </div>

          {/* Analytics Totais */}
          <div>
            <label className="text-xs font-medium dark:text-gray-300 text-gray-800 mb-1 block ">
              Analytics do Mês
            </label>
            <div className="space-y-1 overflow-hidden">
              {/* Total M1 vs Real */}
              <div className="dark:bg-gray-800 bg-gray-50 rounded-t-[6px] p-2 border dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Total M1 vs Real</span>
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
                    <span className="font-medium dark:text-white text-black">
                      R$ {dados.reduce((sum, item) => sum + (Number(item.m1_receita) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
                      R$ {dados.reduce((sum, item) => sum + (Number(item.real_receita) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-gray-700">
                    <span className="dark:text-gray-400 text-gray-700">Resultado:</span>
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
                    <span className="dark:text-gray-400 text-gray-700">Performance:</span>
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
              <div className="dark:bg-gray-800 bg-gray-50 p-2 border dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Clientes Plan vs Real</span>
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
                    <span className="font-medium dark:text-white text-black">
                      {dados.reduce((sum, item) => sum + (Number(item.clientes_plan) || 0), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
                      {dados.reduce((sum, item) => sum + (Number(item.clientes_real) || 0), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Médio */}
              <div className="dark:bg-gray-800 bg-gray-50 p-2 border dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Ticket Médio</span>
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
                    <span className="font-medium dark:text-white text-black">R$ 93,00</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
                      R$ {(() => {
                        const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_medio) || 0), 0) / dados.filter(item => Number(item.t_medio) > 0).length : 0;
                        return media.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tempo Médio de Bar */}
              <div className="dark:bg-gray-800 bg-gray-50 p-2 border dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Tempo Médio de Bar</span>
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
                    <span className="font-medium dark:text-white text-black">≤ 4min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
                      {(() => {
                        const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_bar) || 0), 0) / dados.filter(item => Number(item.t_bar) > 0).length : 0;
                        return media.toFixed(1);
                      })()}min
                    </span>
                  </div>
                </div>
              </div>

              {/* Tempo Médio de Cozinha */}
              <div className="dark:bg-gray-800 bg-gray-50 p-2 border dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Tempo Médio de Cozinha</span>
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
                    <span className="font-medium dark:text-white text-black">≤ 12min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
                      {(() => {
                        const media = dados.length > 0 ? dados.reduce((sum, item) => sum + (Number(item.t_coz) || 0), 0) / dados.filter(item => Number(item.t_coz) > 0).length : 0;
                        return media.toFixed(1);
                      })()}min
                    </span>
                  </div>
                </div>
              </div>

              {/* Fat até 19h */}
              <div className="dark:bg-gray-800 bg-gray-50 p-2 border rounded-b-[6px] dark:border-gray-700 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs dark:text-gray-400 text-gray-700">Fat até 19h</span>
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
                    <span className="font-medium dark:text-white text-black">≥ 15%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Realizado:</span>
                    <span className="font-bold dark:text-white text-black">
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
            <Button onClick={buscarDados} variant="outline" size="sm" className="h-8 px-3 bg-gray-800 border-gray-600 text-white" aria-label="Atualizar dados">
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Área Principal da Tabela */}
      <div className={`flex-1 overflow-x-visible overflow-y-auto hide-scrollbar ${modalOpen ? 'hidden' : ''}`}>
        <table className="min-w-[1200px] max-h-[900px] w-full table-auto border-collapse border-spacing-0 whitespace-nowrap text-xs dark:bg-transparent ">
          <thead className="bg-transparent dark:text-white border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="sticky left-0 bg-transparent px-2 py-1 w-16 text-center font-medium">Data</th>
              <th className="sticky left-0 bg-transparent px-2 py-1 w-16 text-center font-medium">Dia</th>
              {/* Faturamento */}
              <th className="px-1 py-1 w-20">Real</th>
              <th className="px-1 py-1 w-20">M1</th>
              {/* Clientes */}
              <th className="hidden sm:table-cell px-2 py-1 w-16 ">Cl.Plan</th>
              <th className="hidden sm:table-cell px-2 py-1 w-16 ">Cl.Real</th>
              <th className="hidden sm:table-cell px-2 py-1 w-16 ">Res.Tot</th>
              <th className="hidden sm:table-cell px-2 py-1 w-16 ">Res.P</th>
              <th className="hidden sm:table-cell px-2 py-1 w-16 ">Lot.Max</th>
              {/* Tickets */}
              <th className="hidden md:table-cell px-2 py-1 w-16">TE.Plan</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">TE.Real</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">TB.Plan</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">TB.Real</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">T.Medio</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">C.Art</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">C.Prod</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">%Art.Fat</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">%B</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">%D</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">%C</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">T.Coz</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">T.Bar</th>
              <th className="hidden md:table-cell px-2 py-1 w-16">Fat.19h</th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dados.map((item, index) => {
              return (
              <tr 
                key={index}
                onClick={() => abrirModal(item)}
                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
              >
                {/* Colunas fixas */}
                <td className="sticky left-0 dark:bg-gray-800 px-2 py-1 text-center text-xs font-medium border-r border-gray-200 dark:border-gray-700 dark:text-white">
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
                <td className={`px-1 py-1 text-xs text-center border-r border-gray-200 dark:border-gray-700 ${getColorClass(item.fat_19h_green)}`}>
                  {item.fat_19h > 0 ? `${item.fat_19h.toFixed(1)}%` : '-'}
                </td>
                

              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Modal de Edição do Evento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-2xl modal-dark">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Edit className="h-5 w-5" />
              Editar Evento - {eventoSelecionado?.dia_formatado}/{mesAtual.getMonth() + 1}/{mesAtual.getFullYear()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="m1_receita" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta M1 (R$)
                </Label>
                <Input
                  id="m1_receita"
                  type="number"
                  value={editData.m1_receita || ''}
                  onChange={(e) => handleInputChange('m1_receita', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="te_plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  TE Plan (R$)
                </Label>
                <Input
                  id="te_plan"
                  type="number"
                  value={editData.te_plan || ''}
                  onChange={(e) => handleInputChange('te_plan', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tb_plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  TB Plan (R$)
                </Label>
                <Input
                  id="tb_plan"
                  type="number"
                  value={editData.tb_plan || ''}
                  onChange={(e) => handleInputChange('tb_plan', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Novos campos de orçamentação */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c_artistico_plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  C.Artístico Plan (R$)
                </Label>
                <Input
                  id="c_artistico_plan"
                  type="number"
                  value={editData.c_artistico_plan || ''}
                  onChange={(e) => handleInputChange('c_artistico_plan', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={editData.observacoes || ''}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white min-h-[100px]"
                placeholder="Adicione observações sobre ajustes manuais, receitas por fora, etc..."
              />
            </div>

            {/* Dados Atuais (Read-only) */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dados Atuais do Sistema</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-gray-500 dark:text-gray-400">Receita Real:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatarMoeda(eventoSelecionado?.real_receita || 0)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 dark:text-gray-400">Clientes Real:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {eventoSelecionado?.clientes_real || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 dark:text-gray-400">Ticket Médio:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatarMoeda(eventoSelecionado?.t_medio || 0)}
                  </div>
                </div>
              </div>
            </div>
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
  );
} 
