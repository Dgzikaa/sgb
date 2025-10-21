'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users,
  DollarSign,
  Target,
  Clock,
  Star,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Wine,
  ChefHat,
  Ticket
} from 'lucide-react';

interface EventoCompleto {
  data: string;
  dia_semana: string;
  descricao: string; // "DJ Fulano, Jogo do Flamengo"
  
  // PARTE 1: Dia/Faturamento/Meta
  faturamento_real: number;
  empilhamento_m1: number; // Novo campo solicitado
  meta_dia: number;
  
  // PARTE 2: Clientes/Reservas/Ticket/NPS
  clientes_atendidos: number;
  reservas_totais: number;
  reservas_presentes: number;
  ticket_medio_entrada: number;
  ticket_medio_bar: number;
  ticket_medio_geral: number;
  nps_score?: number;
  
  // PARTE 3: Rentabilidade Atrações/%Couvert
  custo_atracao: number;
  percentual_atracao_faturamento: number;
  percentual_couvert: number;
  rentabilidade_atracao: number;
  
  // PARTE 4: Cesta/Atrasos/TempoMedio/QtdItens
  valor_cesta_media: number;
  atrasos_cozinha: number;
  atrasos_bar: number;
  tempo_medio_cozinha: number;
  tempo_medio_bar: number;
  quantidade_itens_media: number;
  
  // Status
  status: 'realizado' | 'projetado' | 'planejado';
}

export default function PlanejamentoComercialExcelPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<EventoCompleto[]>([]);
  const [mesAtual, setMesAtual] = useState(10); // Outubro
  const [anoAtual, setAnoAtual] = useState(2025);

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    try {
      // Simular dados completos como no Excel
      const mockEventos: EventoCompleto[] = [
        {
          data: '2025-10-01',
          dia_semana: 'Terça-feira',
          descricao: 'DJ Marcus, Noite Sertaneja',
          faturamento_real: 15500,
          empilhamento_m1: 18200,
          meta_dia: 16000,
          clientes_atendidos: 95,
          reservas_totais: 45,
          reservas_presentes: 42,
          ticket_medio_entrada: 85.50,
          ticket_medio_bar: 78.20,
          ticket_medio_geral: 163.16,
          nps_score: 78,
          custo_atracao: 3500,
          percentual_atracao_faturamento: 22.6,
          percentual_couvert: 35.2,
          rentabilidade_atracao: 77.4,
          valor_cesta_media: 45.80,
          atrasos_cozinha: 3,
          atrasos_bar: 1,
          tempo_medio_cozinha: 18.5,
          tempo_medio_bar: 8.2,
          quantidade_itens_media: 2.8,
          status: 'realizado'
        },
        {
          data: '2025-10-02',
          dia_semana: 'Quarta-feira',
          descricao: 'Banda Acústica, Noite Romântica',
          faturamento_real: 12800,
          empilhamento_m1: 14500,
          meta_dia: 13500,
          clientes_atendidos: 78,
          reservas_totais: 35,
          reservas_presentes: 33,
          ticket_medio_entrada: 82.00,
          ticket_medio_bar: 82.05,
          ticket_medio_geral: 164.10,
          nps_score: 82,
          custo_atracao: 2800,
          percentual_atracao_faturamento: 21.9,
          percentual_couvert: 38.1,
          rentabilidade_atracao: 78.1,
          valor_cesta_media: 48.20,
          atrasos_cozinha: 2,
          atrasos_bar: 0,
          tempo_medio_cozinha: 16.8,
          tempo_medio_bar: 7.5,
          quantidade_itens_media: 3.1,
          status: 'realizado'
        },
        {
          data: '2025-10-03',
          dia_semana: 'Quinta-feira',
          descricao: 'DJ Pedro, Eletrônica',
          faturamento_real: 18200,
          empilhamento_m1: 21000,
          meta_dia: 19000,
          clientes_atendidos: 112,
          reservas_totais: 55,
          reservas_presentes: 51,
          ticket_medio_entrada: 88.20,
          ticket_medio_bar: 74.30,
          ticket_medio_geral: 162.50,
          nps_score: 75,
          custo_atracao: 4200,
          percentual_atracao_faturamento: 23.1,
          percentual_couvert: 32.8,
          rentabilidade_atracao: 76.9,
          valor_cesta_media: 42.10,
          atrasos_cozinha: 5,
          atrasos_bar: 2,
          tempo_medio_cozinha: 22.1,
          tempo_medio_bar: 9.8,
          quantidade_itens_media: 2.6,
          status: 'realizado'
        },
        {
          data: '2025-10-31',
          dia_semana: 'Quinta-feira',
          descricao: 'Halloween Party, DJ Special + Decoração Temática',
          faturamento_real: 0,
          empilhamento_m1: 28000,
          meta_dia: 25000,
          clientes_atendidos: 0,
          reservas_totais: 85,
          reservas_presentes: 0,
          ticket_medio_entrada: 95.00,
          ticket_medio_bar: 85.00,
          ticket_medio_geral: 180.00,
          custo_atracao: 6500,
          percentual_atracao_faturamento: 23.2,
          percentual_couvert: 30.0,
          rentabilidade_atracao: 76.8,
          valor_cesta_media: 52.00,
          atrasos_cozinha: 0,
          atrasos_bar: 0,
          tempo_medio_cozinha: 18.0,
          tempo_medio_bar: 8.0,
          quantidade_itens_media: 3.2,
          status: 'planejado'
        }
      ];

      setEventos(mockEventos);
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
  }, [selectedBar?.id, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'realizado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Realizado</Badge>;
      case 'projetado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Projetado</Badge>;
      case 'planejado':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Planejado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planejamento Comercial</h1>
            <p className="text-gray-600 mt-1">Formato Excel com empilhamento M1 e descrições completas</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              Outubro {anoAtual}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={loading}
              className="border-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* TABELA ÚNICA - FORMATO EXCEL COMPLETO */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Planejamento Comercial - Formato Excel
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Tabela completa com todos os indicadores como na planilha</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[80vh]">
              <table className="w-full min-w-[2000px]">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-300">
                  <tr>
                    {/* Colunas fixas */}
                    <th className="sticky left-0 z-20 bg-gray-50 text-left py-3 px-3 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">Data</th>
                    <th className="sticky left-[80px] z-20 bg-gray-50 text-left py-3 px-3 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">Dia</th>
                    <th className="sticky left-[160px] z-20 bg-gray-50 text-left py-3 px-3 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[250px]">Obs Data</th>
                    
                    {/* Realizado */}
                    <th className="text-right py-3 px-3 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[100px]">Realizado</th>
                    
                    {/* Nº Clientes */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Plan</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Real</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">Res Total</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">Res Pres</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[80px]">Lot Max</th>
                    
                    {/* Ticket Entrada */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Plan</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[60px]">Real</th>
                    
                    {/* Ticket Bar */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Plan</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Real</th>
                    
                    {/* TM */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[80px]">TM</th>
                    
                    {/* Rentabilidade Atrações */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">C. Artístico</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[80px]">C. Produção</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[80px]">%Art/Fat</th>
                    
                    {/* Cesta */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[50px]">%B</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[50px]">%D</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[50px]">%C</th>
                    
                    {/* Tempo */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Coz</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[60px]">Bar</th>
                    
                    {/* Tempo Max */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r border-gray-300 min-w-[60px]">Coz</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs border-r-2 border-gray-400 min-w-[60px]">Bar</th>
                    
                    {/* NPS */}
                    <th className="text-center py-3 px-2 font-bold text-gray-900 text-xs min-w-[60px]">NPS</th>
                  </tr>
                  
                  {/* Segunda linha de cabeçalho com grupos */}
                  <tr className="bg-blue-50">
                    <th className="sticky left-0 z-20 bg-blue-50 border-r border-gray-300"></th>
                    <th className="sticky left-[80px] z-20 bg-blue-50 border-r border-gray-300"></th>
                    <th className="sticky left-[160px] z-20 bg-blue-50 border-r-2 border-gray-400"></th>
                    <th className="border-r-2 border-gray-400"></th>
                    <th className="text-center py-2 px-1 font-semibold text-blue-900 text-xs border-r-2 border-gray-400" colSpan={5}>Nº Clientes</th>
                    <th className="text-center py-2 px-1 font-semibold text-green-900 text-xs border-r-2 border-gray-400" colSpan={2}>Ticket Entrada</th>
                    <th className="text-center py-2 px-1 font-semibold text-purple-900 text-xs border-r-2 border-gray-400" colSpan={2}>Ticket Bar</th>
                    <th className="border-r-2 border-gray-400"></th>
                    <th className="text-center py-2 px-1 font-semibold text-orange-900 text-xs border-r-2 border-gray-400" colSpan={3}>Rentabilidade Atrações</th>
                    <th className="text-center py-2 px-1 font-semibold text-red-900 text-xs border-r-2 border-gray-400" colSpan={3}>Cesta</th>
                    <th className="text-center py-2 px-1 font-semibold text-gray-900 text-xs border-r-2 border-gray-400" colSpan={2}>Tempo</th>
                    <th className="text-center py-2 px-1 font-semibold text-gray-900 text-xs border-r-2 border-gray-400" colSpan={2}>Tempo Max</th>
                    <th className="text-center py-2 px-1 font-semibold text-indigo-900 text-xs">NPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventos.map((evento, index) => {
                    const isRealizado = evento.status === 'realizado';
                    const rowBg = evento.status === 'planejado' ? 'bg-yellow-25' : 'hover:bg-gray-50';
                    
                    return (
                      <tr key={index} className={rowBg}>
                        {/* Colunas fixas */}
                        <td className="sticky left-0 z-10 bg-white py-2 px-3 font-medium text-gray-900 text-xs border-r border-gray-300">
                          {new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="sticky left-[80px] z-10 bg-white py-2 px-3 text-gray-700 text-xs border-r border-gray-300">
                          {evento.dia_semana.substring(0, 3).toUpperCase()}
                        </td>
                        <td className="sticky left-[160px] z-10 bg-white py-2 px-3 text-gray-700 font-medium text-xs border-r-2 border-gray-400">
                          {evento.descricao}
                        </td>
                        
                        {/* Realizado */}
                        <td className="py-2 px-3 text-right font-semibold text-xs border-r-2 border-gray-400" 
                            style={{color: isRealizado ? (evento.faturamento_real >= evento.meta_dia ? '#16a34a' : '#dc2626') : '#6b7280'}}>
                          {evento.faturamento_real > 0 ? formatCurrency(evento.faturamento_real) : '-'}
                        </td>
                        
                        {/* Nº Clientes */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {evento.clientes_atendidos > 0 ? evento.clientes_atendidos : '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-xs border-r border-gray-300" 
                            style={{color: isRealizado ? '#16a34a' : '#6b7280'}}>
                          {evento.clientes_atendidos > 0 ? evento.clientes_atendidos : '-'}
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {evento.reservas_totais}
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {evento.reservas_presentes > 0 ? evento.reservas_presentes : '-'}
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r-2 border-gray-400">
                          {evento.reservas_totais}
                        </td>
                        
                        {/* Ticket Entrada */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {formatCurrency(evento.ticket_medio_entrada)}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-xs border-r-2 border-gray-400"
                            style={{color: isRealizado ? '#16a34a' : '#6b7280'}}>
                          {evento.faturamento_real > 0 ? formatCurrency(evento.ticket_medio_entrada) : '-'}
                        </td>
                        
                        {/* Ticket Bar */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {formatCurrency(evento.ticket_medio_bar)}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-xs border-r border-gray-300"
                            style={{color: isRealizado ? '#16a34a' : '#6b7280'}}>
                          {evento.faturamento_real > 0 ? formatCurrency(evento.ticket_medio_bar) : '-'}
                        </td>
                        
                        {/* TM */}
                        <td className="py-2 px-2 text-center font-semibold text-xs border-r-2 border-gray-400"
                            style={{color: isRealizado ? '#16a34a' : '#6b7280'}}>
                          {evento.faturamento_real > 0 ? formatCurrency(evento.ticket_medio_geral) : '-'}
                        </td>
                        
                        {/* Rentabilidade Atrações */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {formatCurrency(evento.custo_atracao)}
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {formatCurrency(evento.custo_atracao * 0.3)}
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r-2 border-gray-400">
                          {evento.percentual_atracao_faturamento.toFixed(0)}%
                        </td>
                        
                        {/* Cesta */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {evento.percentual_couvert.toFixed(0)}%
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {(100 - evento.percentual_couvert).toFixed(0)}%
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r-2 border-gray-400">
                          {((evento.percentual_couvert + (100 - evento.percentual_couvert)) / 2).toFixed(0)}%
                        </td>
                        
                        {/* Tempo */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {evento.tempo_medio_cozinha.toFixed(0)}min
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r-2 border-gray-400">
                          {evento.tempo_medio_bar.toFixed(0)}min
                        </td>
                        
                        {/* Tempo Max */}
                        <td className="py-2 px-2 text-center text-xs border-r border-gray-300">
                          {(evento.tempo_medio_cozinha + 5).toFixed(0)}min
                        </td>
                        <td className="py-2 px-2 text-center text-xs border-r-2 border-gray-400">
                          {(evento.tempo_medio_bar + 3).toFixed(0)}min
                        </td>
                        
                        {/* NPS */}
                        <td className="py-2 px-2 text-center font-semibold text-xs">
                          {evento.nps_score || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>


        {/* Resumo do Mês */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(eventos.reduce((acc, e) => acc + e.faturamento_real, 0))}
                </div>
                <p className="text-sm text-gray-600 mt-1">Faturamento Realizado</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(eventos.reduce((acc, e) => acc + e.empilhamento_m1, 0))}
                </div>
                <p className="text-sm text-gray-600 mt-1">Empilhamento M1</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {eventos.reduce((acc, e) => acc + e.clientes_atendidos, 0).toLocaleString('pt-BR')}
                </div>
                <p className="text-sm text-gray-600 mt-1">Clientes Atendidos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(eventos.reduce((acc, e) => acc + (e.nps_score || 0), 0) / eventos.filter(e => e.nps_score).length).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600 mt-1">NPS Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

