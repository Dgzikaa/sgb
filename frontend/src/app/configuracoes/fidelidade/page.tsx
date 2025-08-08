'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Users, 
  CreditCard, 
  TrendingUp,
  QrCode,
  DollarSign,
  Calendar,
  Activity,
  BarChart,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Membro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  data_adesao: string;
  saldo_atual: number;
  ultimo_checkin?: string;
}

interface Estatisticas {
  total_membros: number;
  membros_ativos: number;
  receita_mensal: number;
  checkins_hoje: number;
  saldo_total_creditos: number;
}

export default function FidelidadeAdminPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total_membros: 0,
    membros_ativos: 0,
    receita_mensal: 0,
    checkins_hoje: 0,
    saldo_total_creditos: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visao-geral');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar membros (mockup para demonstração)
      const mockMembros: Membro[] = [
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@teste.com',
          telefone: '61999999999',
          status: 'ativo',
          data_adesao: '2024-01-15',
          saldo_atual: 150.00,
          ultimo_checkin: '2024-01-20T19:30:00'
        },
        {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@teste.com',
          telefone: '61888888888',
          status: 'ativo',
          data_adesao: '2024-01-10',
          saldo_atual: 75.50,
          ultimo_checkin: '2024-01-19T20:15:00'
        }
      ];

      const mockEstatisticas: Estatisticas = {
        total_membros: 2,
        membros_ativos: 2,
        receita_mensal: 200.00,
        checkins_hoje: 0,
        saldo_total_creditos: 225.50
      };

      setMembros(mockMembros);
      setEstatisticas(mockEstatisticas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    'ativo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'suspenso': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'cancelado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  };

  const statusText = {
    'ativo': 'Ativo',
    'pendente': 'Pendente',
    'suspenso': 'Suspenso',
    'cancelado': 'Cancelado'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Crown className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Fidelidade - Admin
              </h1>
              <p className="text-amber-600 dark:text-amber-400">
                Gestão do programa VIP
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/fidelidade/leitor-qr">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <QrCode className="w-4 h-4 mr-2" />
                Scanner QR
              </Button>
            </Link>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total de Membros</p>
                        <p className="text-3xl font-bold">{estatisticas.total_membros}</p>
                      </div>
                      <Users className="w-10 h-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Membros Ativos</p>
                        <p className="text-3xl font-bold">{estatisticas.membros_ativos}</p>
                      </div>
                      <Activity className="w-10 h-10 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100">Receita Mensal</p>
                        <p className="text-3xl font-bold">R$ {estatisticas.receita_mensal.toFixed(0)}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Check-ins Hoje</p>
                        <p className="text-3xl font-bold">{estatisticas.checkins_hoje}</p>
                      </div>
                      <QrCode className="w-10 h-10 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100">Créditos Ativos</p>
                        <p className="text-3xl font-bold">R$ {estatisticas.saldo_total_creditos.toFixed(0)}</p>
                      </div>
                      <CreditCard className="w-10 h-10 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Resumo de Atividades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Últimas Atividades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Novo Membro</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Maria Santos se cadastrou</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Hoje
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Check-in</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">João Silva - 19:30</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Ontem
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Retenção</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">100%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uso de Créditos</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Frequência</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Membros */}
          <TabsContent value="membros" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestão de Membros
              </h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Membro
                </Button>
              </div>
            </div>

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Membro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Saldo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Último Check-in
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {membros.map((membro) => (
                        <tr key={membro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {membro.nome}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {membro.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={statusColor[membro.status as keyof typeof statusColor]}>
                              {statusText[membro.status as keyof typeof statusText]}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            R$ {membro.saldo_atual.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {membro.ultimo_checkin 
                              ? new Date(membro.ultimo_checkin).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financeiro" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestão Financeira
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Receita Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    R$ {estatisticas.receita_mensal.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    2 assinantes ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Créditos Emitidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    R$ 300,00
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    R$ 150 por membro
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Créditos Utilizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    R$ {(300 - estatisticas.saldo_total_creditos).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {((300 - estatisticas.saldo_total_creditos) / 300 * 100).toFixed(1)}% de utilização
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Relatórios e Análises
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Relatórios Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Relatório Mensal
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Análise de Membros
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Uso de Créditos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <QrCode className="w-4 h-4 mr-2" />
                    Check-ins
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Configurações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Valor da Mensalidade</span>
                    <span className="font-medium text-gray-900 dark:text-white">R$ 100,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Crédito Mensal</span>
                    <span className="font-medium text-gray-900 dark:text-white">R$ 150,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Limite de Membros</span>
                    <span className="font-medium text-gray-900 dark:text-white">100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Membros Atuais</span>
                    <span className="font-medium text-gray-900 dark:text-white">{estatisticas.total_membros}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
