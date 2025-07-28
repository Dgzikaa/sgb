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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-4">
        {/* Header Otimizado */}
        <div className="card-dark p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Planejamento Comercial
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {totalEventos} eventos • {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Navegação de Mês Melhorada */}
              <Button
                onClick={() => navegarMes('anterior')}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded-md">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </span>
              </div>
              
              <Button
                onClick={() => navegarMes('proximo')}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              
              <Button onClick={buscarDados} variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela Otimizada para Espaço */}
        <div className="card-dark p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border-spacing-0">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {/* Colunas fixas - largura reduzida */}
                  <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 w-16 border-r border-gray-200 dark:border-gray-700">
                    Data
                  </th>
                  <th className="sticky left-16 z-20 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 w-16 border-r border-gray-200 dark:border-gray-700">
                    Dia
                  </th>
                  
                  {/* Faturamento */}
                  <th className="px-1 py-3 text-center font-medium text-white bg-blue-600 border-r border-blue-500 w-20">
                    Real (R$)
                  </th>
                  <th className="px-1 py-3 text-center font-medium text-white bg-blue-600 border-r border-blue-500 w-20">
                    M1 (R$)
                  </th>
                  
                  {/* Clientes */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Cl.Plan
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Cl.Real
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Res.Tot
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Res.P
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-green-600 border-r border-green-500 w-16">
                    Lot.Max
                  </th>
                  
                  {/* Tickets */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.E.Plan
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.E.Real
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.B.Plan
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.B.Real
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-purple-600 border-r border-purple-500 w-16">
                    T.Médio
                  </th>
                  
                  {/* Rentabilidade */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-18">
                    C.Art
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-18">
                    C.Prod
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-orange-600 border-r border-orange-500 w-16">
                    %Art/Fat
                  </th>
                  
                  {/* Cesta */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %B
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %D
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-teal-600 border-r border-teal-500 w-12">
                    %C
                  </th>
                  
                  {/* Tempo */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-red-600 border-r border-red-500 w-16">
                    T.Coz
                  </th>
                  <th className="px-2 py-3 text-center font-medium text-white bg-red-600 border-r border-red-500 w-16">
                    T.Bar
                  </th>
                  
                  {/* Faturamento até 19h */}
                  <th className="px-2 py-3 text-center font-medium text-white bg-yellow-600 w-16">
                    Fat.19h
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dados.map((item, index) => (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      item.real_receita > 0 ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                    }`}
                    title={item.evento_nome ? `Evento: ${item.evento_nome}` : 'Sem evento'}
                  >
                    {/* Colunas fixas */}
                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-xs text-center font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.dia_semana}
                    </td>
                    <td className="sticky left-16 z-10 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-xs text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      {item.dia_formatado}
                    </td>
                    
                                               {/* Faturamento */}
                           <td className="px-1 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.real_receita > 0 ? formatarMoeda(item.real_receita) : '-'}
                           </td>
                           <td className="px-1 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.m1_receita > 0 ? formatarMoeda(item.m1_receita) : '-'}
                           </td>
                    
                    {/* Clientes */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes_plan || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes_real || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.res_total || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.res_presente || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.lot_max || '-'}
                    </td>
                    
                    {/* Tickets */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.te_plan > 0 ? formatarMoeda(item.te_plan) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.te_real > 0 ? formatarMoeda(item.te_real) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.tb_plan > 0 ? formatarMoeda(item.tb_plan) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.tb_real > 0 ? formatarMoeda(item.tb_real) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.t_medio > 0 ? formatarMoeda(item.t_medio) : '-'}
                    </td>
                    
                                               {/* Rentabilidade */}
                           <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.c_art > 0 ? formatarMoeda(item.c_art) : '-'}
                           </td>
                           <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.c_prod > 0 ? formatarMoeda(item.c_prod) : '-'}
                           </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.percent_art_fat > 0 ? `${item.percent_art_fat.toFixed(1)}%` : '-'}
                    </td>
                    
                    {/* Cesta */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.percent_b > 0 ? `${item.percent_b.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.percent_d > 0 ? `${item.percent_d.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.percent_c > 0 ? `${item.percent_c.toFixed(1)}%` : '-'}
                    </td>
                    
                    {/* Tempo */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.t_coz > 0 ? `${item.t_coz.toFixed(1)} min` : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.t_bar > 0 ? `${item.t_bar.toFixed(1)} min` : '-'}
                    </td>
                    
                    {/* Faturamento até 19h */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white">
                      {item.fat_19h > 0 ? formatarMoeda(item.fat_19h) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé com resumo */}
        <div className="card-dark p-4 mt-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-4">
              <span className="text-gray-600 dark:text-gray-400">
                Total de eventos: <span className="font-medium text-gray-900 dark:text-white">{totalEventos}</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Período: <span className="font-medium text-gray-900 dark:text-white">
                  {mesesNomes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
                </span>
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 