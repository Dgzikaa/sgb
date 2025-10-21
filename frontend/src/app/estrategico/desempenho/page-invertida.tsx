'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp,
  RefreshCw,
  Calendar
} from 'lucide-react';

interface DesempenhoSemana {
  semana: string;
  periodo: string;
  faturamento_total: number;
  faturamento_couvert: number;
  faturamento_bar: number;
  ticket_medio: number;
  tm_entrada: number;
  tm_bar: number;
  cmv_percentual: number;
  cmo_percentual: number;
  atracao_percentual: number;
  clientes_atendidos: number;
  reservas_totais: number;
  reservas_presentes: number;
}

// Dados de outras tabelas empilhadas
interface TabelaQualidade {
  indicador: string;
  valores: { [semana: string]: number | string };
}

interface TabelaProdutos {
  produto: string;
  valores: { [semana: string]: number };
}

export default function DesempenhoInvertidaPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [semanas, setSemanas] = useState<DesempenhoSemana[]>([]);
  const [tabelaQualidade, setTabelaQualidade] = useState<TabelaQualidade[]>([]);
  const [tabelaProdutos, setTabelaProdutos] = useState<TabelaProdutos[]>([]);

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    try {
      // Dados mock simples - SEM consulta MCP pesada
      const mockSemanas: DesempenhoSemana[] = [
        {
          semana: 'S40',
          periodo: '30/09-06/10',
          faturamento_total: 125000,
          faturamento_couvert: 37500,
          faturamento_bar: 87500,
          ticket_medio: 168.50,
          tm_entrada: 85.20,
          tm_bar: 83.30,
          cmv_percentual: 22.5,
          cmo_percentual: 8.2,
          atracao_percentual: 18.5,
          clientes_atendidos: 742,
          reservas_totais: 320,
          reservas_presentes: 298
        },
        {
          semana: 'S41',
          periodo: '07/10-13/10',
          faturamento_total: 118000,
          faturamento_couvert: 35400,
          faturamento_bar: 82600,
          ticket_medio: 169.80,
          tm_entrada: 86.10,
          tm_bar: 83.70,
          cmv_percentual: 21.8,
          cmo_percentual: 7.9,
          atracao_percentual: 19.2,
          clientes_atendidos: 695,
          reservas_totais: 285,
          reservas_presentes: 267
        },
        {
          semana: 'S42',
          periodo: '14/10-20/10',
          faturamento_total: 132000,
          faturamento_couvert: 39600,
          faturamento_bar: 92400,
          ticket_medio: 169.70,
          tm_entrada: 84.80,
          tm_bar: 84.90,
          cmv_percentual: 23.1,
          cmo_percentual: 8.5,
          atracao_percentual: 17.8,
          clientes_atendidos: 778,
          reservas_totais: 342,
          reservas_presentes: 325
        },
        {
          semana: 'S43',
          periodo: '21/10-27/10',
          faturamento_total: 110000,
          faturamento_couvert: 33000,
          faturamento_bar: 77000,
          ticket_medio: 174.05,
          tm_entrada: 87.20,
          tm_bar: 86.85,
          cmv_percentual: 20.9,
          cmo_percentual: 7.6,
          atracao_percentual: 20.1,
          clientes_atendidos: 632,
          reservas_totais: 275,
          reservas_presentes: 258
        }
      ];

      // Tabela de Qualidade empilhada
      const mockQualidade: TabelaQualidade[] = [
        {
          indicador: 'NPS Score',
          valores: { 'S40': 76, 'S41': 79, 'S42': 81, 'S43': 75 }
        },
        {
          indicador: 'Avaliação Google',
          valores: { 'S40': 4.5, 'S41': 4.6, 'S42': 4.7, 'S43': 4.6 }
        },
        {
          indicador: 'Pesquisa Felicidade',
          valores: { 'S40': 8.1, 'S41': 8.3, 'S42': 8.4, 'S43': 8.0 }
        },
        {
          indicador: 'Tempo Médio Atendimento',
          valores: { 'S40': '12min', 'S41': '11min', 'S42': '13min', 'S43': '10min' }
        }
      ];

      // Tabela de Produtos empilhada
      const mockProdutos: TabelaProdutos[] = [
        {
          produto: 'Cerveja Long Neck',
          valores: { 'S40': 1250, 'S41': 1180, 'S42': 1320, 'S43': 1100 }
        },
        {
          produto: 'Drinks Premium',
          valores: { 'S40': 380, 'S41': 420, 'S42': 450, 'S43': 320 }
        },
        {
          produto: 'Petiscos',
          valores: { 'S40': 890, 'S41': 850, 'S42': 920, 'S43': 780 }
        }
      ];

      setSemanas(mockSemanas);
      setTabelaQualidade(mockQualidade);
      setTabelaProdutos(mockProdutos);
    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de desempenho",
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
            <h1 className="text-3xl font-bold text-gray-900">Tabela de Desempenho</h1>
            <p className="text-gray-600 mt-1">Semanas nas colunas - Formato invertido</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              Outubro 2024
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

        {/* TABELA PRINCIPAL - DESEMPENHO INVERTIDA */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Desempenho Semanal - Principais Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm min-w-[180px]">Indicador</th>
                    {semanas.map((semana) => (
                      <th key={semana.semana} className="text-center py-4 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                        <div>{semana.semana}</div>
                        <div className="text-xs text-gray-500 font-normal">{semana.periodo}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Faturamento Total */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Faturamento Total</td>
                    {semanas.map((semana) => (
                      <td key={`fat-${semana.semana}`} className="py-4 px-4 text-center font-semibold text-green-700">
                        {formatCurrency(semana.faturamento_total)}
                      </td>
                    ))}
                  </tr>

                  {/* Faturamento Couvert */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Faturamento Couvert</td>
                    {semanas.map((semana) => (
                      <td key={`cou-${semana.semana}`} className="py-4 px-4 text-center font-medium text-blue-700">
                        {formatCurrency(semana.faturamento_couvert)}
                      </td>
                    ))}
                  </tr>

                  {/* Faturamento Bar */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Faturamento Bar</td>
                    {semanas.map((semana) => (
                      <td key={`bar-${semana.semana}`} className="py-4 px-4 text-center font-medium text-purple-700">
                        {formatCurrency(semana.faturamento_bar)}
                      </td>
                    ))}
                  </tr>

                  {/* Ticket Médio */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Ticket Médio</td>
                    {semanas.map((semana) => (
                      <td key={`tm-${semana.semana}`} className="py-4 px-4 text-center font-medium text-gray-700">
                        {formatCurrency(semana.ticket_medio)}
                      </td>
                    ))}
                  </tr>

                  {/* Clientes Atendidos */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Clientes Atendidos</td>
                    {semanas.map((semana) => (
                      <td key={`cli-${semana.semana}`} className="py-4 px-4 text-center font-medium text-gray-700">
                        {semana.clientes_atendidos.toLocaleString('pt-BR')}
                      </td>
                    ))}
                  </tr>

                  {/* CMV % */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">CMV %</td>
                    {semanas.map((semana) => (
                      <td key={`cmv-${semana.semana}`} className="py-4 px-4 text-center font-medium text-red-700">
                        {semana.cmv_percentual.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* TABELA EMPILHADA - QUALIDADE */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="text-green-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Indicadores de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm min-w-[180px]">Indicador</th>
                    {semanas.map((semana) => (
                      <th key={semana.semana} className="text-center py-4 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                        {semana.semana}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabelaQualidade.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{item.indicador}</td>
                      {semanas.map((semana) => (
                        <td key={`qual-${semana.semana}-${index}`} className="py-4 px-4 text-center font-medium text-green-700">
                          {item.valores[semana.semana] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* TABELA EMPILHADA - PRODUTOS */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Vendas por Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm min-w-[180px]">Produto</th>
                    {semanas.map((semana) => (
                      <th key={semana.semana} className="text-center py-4 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                        {semana.semana}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabelaProdutos.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{item.produto}</td>
                      {semanas.map((semana) => (
                        <td key={`prod-${semana.semana}-${index}`} className="py-4 px-4 text-center font-medium text-purple-700">
                          {item.valores[semana.semana]?.toLocaleString('pt-BR') || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}