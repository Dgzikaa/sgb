'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Search,
  BarChart3,
  MapPin,
  Coffee,
  Moon,
  Sun,
  Sunrise,
  Target,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PadraoCliente {
  telefone: string;
  nome: string;
  total_visitas: number;
  dia_semana_preferido: string;
  distribuicao_dias: Record<string, number>;
  tipo_evento_preferido: string;
  distribuicao_eventos: Record<string, number>;
  horario_preferido: string;
  distribuicao_horarios: Record<string, number>;
  intervalo_medio_visitas: number;
  frequencia: 'alto' | 'medio' | 'baixo';
  mes_mais_ativo: string;
  distribuicao_mensal: Record<string, number>;
  vem_sozinho: boolean;
  tamanho_grupo_medio: number;
}

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const CORES_DIAS = {
  segunda: '#3b82f6',
  terca: '#10b981',
  quarta: '#f59e0b',
  quinta: '#ef4444',
  sexta: '#8b5cf6',
  sabado: '#ec4899',
  domingo: '#06b6d4'
};

export default function PadroesComportamentoPage() {
  const [clientes, setClientes] = useState<PadraoCliente[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<PadraoCliente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const fetchPadroes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/padroes-comportamento?limite=100');
      const result = await response.json();

      if (result.success) {
        setClientes(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar padrões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPadroes();
  }, []);

  const buscarCliente = async (telefone: string) => {
    try {
      const response = await fetch(`/api/crm/padroes-comportamento?telefone=${telefone}`);
      const result = await response.json();

      if (result.success) {
        setClienteSelecionado(result.data);
        setModalAberto(true);
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  );

  const getFrequenciaBadge = (freq: string) => {
    switch (freq) {
      case 'alto':
        return <Badge className="bg-green-600">🔥 Alta (Semanal)</Badge>;
      case 'medio':
        return <Badge className="bg-yellow-600">⚡ Média (Mensal)</Badge>;
      case 'baixo':
        return <Badge className="bg-gray-600">💤 Baixa (Esporádico)</Badge>;
      default:
        return <Badge>-</Badge>;
    }
  };

  const getHorarioIcon = (horario: string) => {
    if (horario.includes('Manhã')) return <Sunrise className="w-4 h-4" />;
    if (horario.includes('Tarde')) return <Sun className="w-4 h-4" />;
    if (horario.includes('Noite')) return <Moon className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const prepararDadosDias = (dist: Record<string, number>) => {
    return Object.entries(dist).map(([dia, count]) => ({
      dia: dia.charAt(0).toUpperCase() + dia.slice(1),
      visitas: count
    }));
  };

  const prepararDadosEventos = (dist: Record<string, number>) => {
    return Object.entries(dist).map(([evento, count]) => ({
      name: evento.length > 20 ? evento.substring(0, 20) + '...' : evento,
      value: count
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Análise de Padrões de Comportamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Entenda os hábitos e preferências dos seus clientes
          </p>
        </div>

        {/* Stats Gerais */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Analisados</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_clientes_analisados}</div>
                  </div>
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Dia Mais Popular</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 capitalize">
                    {stats.dia_mais_popular}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Horário Popular</div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {stats.horario_mais_popular}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div>
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Alta Frequência</div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {stats.frequencia_alta}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">clientes</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Busca */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Padrões de Comportamento ({clientesFiltrados.length})
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Clique em um cliente para ver análise detalhada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhum cliente encontrado
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clientesFiltrados.map((cliente) => (
                  <Card
                    key={cliente.telefone}
                    className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => buscarCliente(cliente.telefone)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {cliente.nome}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.telefone}</p>
                        </div>
                        {getFrequenciaBadge(cliente.frequencia)}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            Total Visitas
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {cliente.total_visitas}
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            Intervalo Médio
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {cliente.intervalo_medio_visitas}d
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Dia Preferido</div>
                          <div className="text-sm font-bold text-blue-700 dark:text-blue-300 capitalize">
                            {cliente.dia_semana_preferido}
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-1">
                            {getHorarioIcon(cliente.horario_preferido)}
                            Horário
                          </div>
                          <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {cliente.horario_preferido.split(' ')[0]}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {cliente.vem_sozinho ? 'Geralmente sozinho' : `Grupo médio: ${cliente.tamanho_grupo_medio} pessoas`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
            {clienteSelecionado && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white text-2xl">
                    {clienteSelecionado.nome}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Análise Detalhada de Comportamento
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-50 dark:bg-gray-700/50">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {clienteSelecionado.total_visitas}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Visitas</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 capitalize">
                          {clienteSelecionado.dia_semana_preferido}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Dia Preferido</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 dark:bg-purple-900/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {clienteSelecionado.horario_preferido.split(' ')[0]}
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">Horário</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-900/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {clienteSelecionado.tamanho_grupo_medio}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Tamanho Grupo</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Distribuição por Dia da Semana */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white text-lg">
                          Distribuição por Dia da Semana
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={prepararDadosDias(clienteSelecionado.distribuicao_dias)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dia" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="visitas" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Distribuição por Tipo de Evento */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white text-lg">
                          Tipos de Evento Preferidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={prepararDadosEventos(clienteSelecionado.distribuicao_eventos)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepararDadosEventos(clienteSelecionado.distribuicao_eventos).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Insights */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Insights e Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <Activity className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Frequência {clienteSelecionado.frequencia}:</strong> Visita em média a cada {clienteSelecionado.intervalo_medio_visitas} dias
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Dia ideal para campanhas:</strong> {clienteSelecionado.dia_semana_preferido.charAt(0).toUpperCase() + clienteSelecionado.dia_semana_preferido.slice(1)}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Melhor horário de contato:</strong> {clienteSelecionado.horario_preferido}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>
                            {clienteSelecionado.vem_sozinho 
                              ? 'Cliente costuma vir sozinho - ideal para eventos intimistas'
                              : `Costuma trazer ${clienteSelecionado.tamanho_grupo_medio} pessoas - ideal para promoções de grupo`
                            }
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <BarChart3 className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Tipo de evento favorito:</strong> {clienteSelecionado.tipo_evento_preferido}
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

