'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Database,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface AnaliticoData {
  vd_mesadesc: string;
  vd_localizacao: string;
  itm: string;
  trn: string;
  trn_desc: string;
  prd_desc: string;
  qtd: number;
  valorfinal: number;
  custo: number;
  desconto: number;
  ano: number;
  mes: number;
}

export default function ContaHubAnaliticoPage() {
  const [data, setData] = useState<AnaliticoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVendas: 0,
    totalItens: 0,
    mediaTicket: 0,
    totalDesconto: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/relatorios/analitico');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        
        // Calcular estatísticas
        const totalVendas = result.data?.reduce((sum: number, item: AnaliticoData) => sum + (item.valorfinal || 0), 0) || 0;
        const totalItens = result.data?.reduce((sum: number, item: AnaliticoData) => sum + (item.qtd || 0), 0) || 0;
        const totalDesconto = result.data?.reduce((sum: number, item: AnaliticoData) => sum + (item.desconto || 0), 0) || 0;
        
        setStats({
          totalVendas,
          totalItens,
          mediaTicket: totalItens > 0 ? totalVendas / totalItens : 0,
          totalDesconto,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredModule="relatorios">
      <div className="space-y-6 mt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                Relatório Analítico - ContaHub
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Dados analíticos detalhados de vendas e produtos
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4 mb-6">
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-dark shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Vendas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {stats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Itens
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalItens.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ticket Médio
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {stats.mediaTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Desconto
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {stats.totalDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Dados */}
        <Card className="card-dark shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Dados Analíticos
            </CardTitle>
            <CardDescription>
              {loading ? 'Carregando dados...' : `${data.length} registros encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Localização</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Produto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Qtd</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Valor Final</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Desconto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Mês/Ano</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 20).map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{item.vd_localizacao}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{item.prd_desc}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{item.qtd}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          R$ {item.valorfinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          R$ {item.desconto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {item.mes}/{item.ano}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 