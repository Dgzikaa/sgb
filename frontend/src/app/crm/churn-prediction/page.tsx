'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  MessageCircle,
  Phone,
  Calendar,
  Activity,
  Filter,
  Download,
  RefreshCcw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClienteChurn {
  telefone: string;
  nome: string;
  ultima_visita: string;
  dias_sem_visitar: number;
  visitas_ultimos_90_dias: number;
  visitas_90_180_dias: number;
  valor_ultimos_90_dias: number;
  valor_90_180_dias: number;
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  score_churn: number;
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acoes_sugeridas: string[];
}

interface Stats {
  total_clientes: number;
  critico: number;
  alto: number;
  medio: number;
  baixo: number;
  score_medio: number;
}

export default function ChurnPredictionPage() {
  const [clientes, setClientes] = useState<ClienteChurn[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroRisco, setFiltroRisco] = useState<string>('todos');

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = filtroRisco === 'todos' 
        ? '/api/crm/churn-prediction?limite=200'
        : `/api/crm/churn-prediction?nivel_risco=${filtroRisco}&limite=200`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setClientes(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filtroRisco]);

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return <Badge className="bg-red-600 dark:bg-red-500">🚨 Crítico</Badge>;
      case 'alto':
        return <Badge className="bg-orange-600 dark:bg-orange-500">⚠️ Alto Risco</Badge>;
      case 'medio':
        return <Badge className="bg-yellow-600 dark:bg-yellow-500">⚡ Médio</Badge>;
      case 'baixo':
        return <Badge className="bg-green-600 dark:bg-green-500">✅ Baixo</Badge>;
      default:
        return <Badge>-</Badge>;
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'decrescente':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const enviarWhatsApp = (telefone: string, nome: string) => {
    const mensagem = `Olá ${nome}! Sentimos sua falta no Deboche Ordinário! 🍺✨`;
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const exportarCSV = () => {
    const headers = ['Nome', 'Telefone', 'Nível Risco', 'Score', 'Dias Sem Visitar', 'Última Visita', 'Visitas 90d', 'Ações Sugeridas'];
    const rows = clientes.map(c => [
      c.nome,
      c.telefone,
      c.nivel_risco,
      c.score_churn,
      c.dias_sem_visitar,
      formatarData(c.ultima_visita),
      c.visitas_ultimos_90_dias,
      c.acoes_sugeridas.join('; ')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `churn-prediction-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Predição de Churn com IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema inteligente de identificação de clientes em risco de abandono
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clientes</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_clientes}</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="text-sm text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Crítico
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.critico}</div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Alto Risco</div>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.alto}</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Médio Risco</div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.medio}</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Baixo Risco</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.baixo}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filtros e Ações */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <Select value={filtroRisco} onValueChange={setFiltroRisco}>
                    <SelectTrigger className="w-[200px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Filtrar por risco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Níveis</SelectItem>
                      <SelectItem value="critico">🚨 Crítico</SelectItem>
                      <SelectItem value="alto">⚠️ Alto Risco</SelectItem>
                      <SelectItem value="medio">⚡ Médio</SelectItem>
                      <SelectItem value="baixo">✅ Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={fetchData}
                  variant="outline"
                  className="bg-white dark:bg-gray-700"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              <Button
                onClick={exportarCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Clientes em Risco ({clientes.length})
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Ordenados por score de churn (maior risco primeiro)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhum cliente encontrado com este filtro
              </div>
            ) : (
              <div className="space-y-4">
                {clientes.map((cliente, index) => (
                  <Card 
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Info Principal */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {cliente.nome}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {cliente.telefone}
                              </p>
                            </div>
                            {getNivelBadge(cliente.nivel_risco)}
                          </div>

                          {/* Score de Churn */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Score de Churn
                              </span>
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {cliente.score_churn}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full ${
                                  cliente.score_churn >= 75 ? 'bg-red-600' :
                                  cliente.score_churn >= 50 ? 'bg-orange-600' :
                                  cliente.score_churn >= 25 ? 'bg-yellow-600' : 'bg-green-600'
                                }`}
                                style={{ width: `${cliente.score_churn}%` }}
                              />
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Dias sem visitar
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {cliente.dias_sem_visitar}
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Última visita
                              </div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatarData(cliente.ultima_visita)}
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                Visitas 90d
                                {getTendenciaIcon(cliente.tendencia_frequencia)}
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {cliente.visitas_ultimos_90_dias}
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Visitas 90-180d
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {cliente.visitas_90_180_dias}
                              </div>
                            </div>
                          </div>

                          {/* Ações Sugeridas */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Ações Sugeridas:
                            </h4>
                            <ul className="space-y-1">
                              {cliente.acoes_sugeridas.map((acao, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                                  {acao}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex lg:flex-col gap-2 lg:w-48">
                          <Button
                            onClick={() => enviarWhatsApp(cliente.telefone, cliente.nome)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>

                          <Button
                            variant="outline"
                            className="flex-1 bg-white dark:bg-gray-700"
                            onClick={() => alert('Funcionalidade em desenvolvimento')}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Ligar
                          </Button>

                          <Button
                            variant="outline"
                            className="flex-1 bg-white dark:bg-gray-700"
                            onClick={() => alert('Funcionalidade em desenvolvimento')}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Agendar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

