'use client';

import React, { useState, useEffect } from 'react';
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

interface PlanejamentoData {
  data: string;
  dia: string;
  obsData: string;
  label: string;
  realizado: number;
  m1: number;
  m2: number;
  m3: number;
  clientes: {
    planejado: number;
    real: number;
    resTotal: number;
    resPresente: number;
    lotMax: number;
  };
  ticketEntrada: {
    planejado: number;
    real: number;
  };
  ticketBar: {
    planejado: number;
    real: number;
  };
  ticketMedio: number;
  rentabilidadeAtracoes: {
    custoArtistico: number;
    custoProducao: number;
    percArtFat: string;
  };
  cesta: {
    percBebidas: string;
    percDrinks: string;
    percCozinha: string;
  };
  tempo: {
    cozinha: number;
    bar: number;
  };
  faturamentoAte19h: string;
}

export default function PlanejamentoComercialPage() {
  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date(2025, 6)); // Julho 2025
  const [totalEventos, setTotalEventos] = useState(0);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Buscar dados da API
  const buscarDados = async () => {
    setLoading(true);
    try {
      const mes = mesAtual.getMonth() + 1;
      const ano = mesAtual.getFullYear();
      
      console.log('Frontend buscando dados:', { mes, ano, mesAtual });
      
      const response = await fetch(`/api/gestao/planejamento-comercial?mes=${mes}&ano=${ano}`);
      const result = await response.json();
      
      console.log('Resultado da API:', result);
      
      if (response.ok) {
        setDados(result.dados || []);
        setTotalEventos(result.totalEventos || 0);
        console.log('Dados carregados:', result.dados?.slice(0, 5));
      } else {
        console.error('Erro ao carregar dados:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, [mesAtual]);

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
                  <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 w-16">
                    Data
                  </th>
                  <th className="sticky left-16 z-20 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 w-16">
                    Dia
                  </th>
                  <th className="sticky left-32 z-20 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 w-40">
                    Evento
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
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      item.realizado > 0 ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {/* Colunas fixas */}
                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-xs text-center font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.data}
                    </td>
                    <td className="sticky left-16 z-10 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-xs text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      {item.dia}
                    </td>
                    <td className="sticky left-32 z-10 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      <div className="truncate" title={item.label}>
                        {item.label || '-'}
                      </div>
                    </td>
                    
                                               {/* Faturamento */}
                           <td className="px-1 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.realizado > 0 ? formatarMoeda(item.realizado) : '-'}
                           </td>
                           <td className="px-1 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.m1 > 0 ? formatarMoeda(item.m1) : '-'}
                           </td>
                    
                    {/* Clientes */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes.planejado || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes.real || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes.resTotal || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes.resPresente || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.clientes.lotMax || '-'}
                    </td>
                    
                    {/* Tickets */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.ticketEntrada.planejado > 0 ? formatarMoeda(item.ticketEntrada.planejado) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.ticketEntrada.real > 0 ? formatarMoeda(item.ticketEntrada.real) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.ticketBar.planejado > 0 ? formatarMoeda(item.ticketBar.planejado) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.ticketBar.real > 0 ? formatarMoeda(item.ticketBar.real) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.ticketMedio > 0 ? formatarMoeda(item.ticketMedio) : '-'}
                    </td>
                    
                                               {/* Rentabilidade */}
                           <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.rentabilidadeAtracoes.custoArtistico > 0 ? formatarMoeda(item.rentabilidadeAtracoes.custoArtistico) : '-'}
                           </td>
                           <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                             {item.rentabilidadeAtracoes.custoProducao > 0 ? formatarMoeda(item.rentabilidadeAtracoes.custoProducao) : '-'}
                           </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.rentabilidadeAtracoes.percArtFat !== '0%' ? item.rentabilidadeAtracoes.percArtFat : '-'}
                    </td>
                    
                    {/* Cesta */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.cesta.percBebidas !== '0%' ? item.cesta.percBebidas : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.cesta.percDrinks !== '0%' ? item.cesta.percDrinks : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.cesta.percCozinha !== '0%' ? item.cesta.percCozinha : '-'}
                    </td>
                    
                    {/* Tempo */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.tempo.cozinha > 0 ? item.tempo.cozinha.toFixed(0) : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      {item.tempo.bar > 0 ? item.tempo.bar.toFixed(0) : '-'}
                    </td>
                    
                    {/* Faturamento até 19h */}
                    <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-white">
                      {item.faturamentoAte19h !== '0%' ? item.faturamentoAte19h : '-'}
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