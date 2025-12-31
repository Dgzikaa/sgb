'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Award,
  Smile,
  Target,
  BarChart3,
  Wine,
  Utensils,
  Instagram,
  Ticket,
  Star,
  Sparkles,
  Beer,
  Martini,
  Droplet,
  UtensilsCrossed,
  TrendingDown,
  Trophy,
  CheckCircle2,
} from 'lucide-react'
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import NewYearFireworks from '@/components/retrospectiva/NewYearFireworks'
import StatCard from '@/components/retrospectiva/StatCard'
import ChartCard from '@/components/retrospectiva/ChartCard'

export default function Retrospectiva2025Page() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    // Verificar se deve mostrar fogos de artifício
    const now = new Date()
    const targetDate = new Date('2026-01-01T00:00:00')
    const hasShownFireworks = localStorage.getItem('newyear-fireworks-2026')

    if (now >= targetDate && !hasShownFireworks) {
      setShowFireworks(true)
    }

    // Buscar dados da retrospectiva
    fetch('/api/retrospectiva-2025')
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          setData(response.data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Sparkles className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">Carregando retrospectiva...</p>
        </motion.div>
      </div>
    )
  }

  const COLORS = {
    primary: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    success: ['#10B981', '#059669', '#047857'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
    danger: ['#EF4444', '#DC2626', '#B91C1C'],
    info: ['#3B82F6', '#2563EB', '#1D4ED8'],
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fogos de Artifício */}
      <NewYearFireworks
        show={showFireworks}
        autoTrigger={true}
        onComplete={() => {
          setShowFireworks(false)
          localStorage.setItem('newyear-fireworks-2026', 'true')
        }}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-dark p-8 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Voltar</span>
              </button>
              <div className="border-l border-gray-300 dark:border-gray-600 h-8" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Retrospectiva 2025
                  </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Conquistas, crescimento e evolução do ano
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data?.metas?.okrsConcluidos || 0}/{data?.metas?.okrsTotal || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">OKRs Concluídos</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Indicadores Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Faturamento Total */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  Financeiro
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(data?.financeiro?.faturamentoTotal || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Faturamento Total 2025
              </div>
            </div>

            {/* Card: Total Clientes */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  Clientes
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {new Intl.NumberFormat('pt-BR').format(data?.financeiro?.totalClientes || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clientes Atendidos
              </div>
            </div>

            {/* Card: Ticket Médio */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                  Médias
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(data?.financeiro?.ticketMedio || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ticket Médio
              </div>
            </div>

            {/* Card: Total Eventos */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                  Eventos
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {data?.operacional?.totalEventos || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Eventos Realizados
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs com Conteúdo Detalhado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-dark p-6"
        >
          <Tabs defaultValue="vendas" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="vendas">Vendas</TabsTrigger>
              <TabsTrigger value="evolucao">Evolução</TabsTrigger>
              <TabsTrigger value="cultura">Cultura</TabsTrigger>
              <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
            </TabsList>

            {/* TAB: VENDAS */}
            <TabsContent value="vendas" className="space-y-6">
              <div>
                <h3 className="card-title-dark mb-4">Produtos Vendidos em 2025</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <Beer className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Cervejas</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.vendas?.cervejas || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Faturamento: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data?.vendas?.faturamentoCervejas || 0)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Martini className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Drinks</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.vendas?.drinks || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Faturamento: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data?.vendas?.faturamentoDrinks || 0)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 border border-cyan-200 dark:border-cyan-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                        <Droplet className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Não Alcoólicos</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.vendas?.naoAlcoolicos || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Faturamento: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data?.vendas?.faturamentoNaoAlcoolicos || 0)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Comidas</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.vendas?.comidas || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Faturamento: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data?.vendas?.faturamentoComidas || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Vendas por Categoria */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Vendas</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.vendasPorCategoria || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="categoria"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: any) => new Intl.NumberFormat('pt-BR').format(value)}
                    />
                    <Bar
                      dataKey="quantidade_total"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                      name="Quantidade"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 10 Produtos */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Produtos</h4>
                <div className="space-y-3">
                  {data?.topProdutos?.slice(0, 10).map((produto: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{produto.nome}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{produto.quantidade} unidades</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(produto.vendaLiquida)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB: EVOLUÇÃO */}
            <TabsContent value="evolucao" className="space-y-6">
              <div>
                <h3 className="card-title-dark mb-4">Evolução ao Longo do Ano</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Faturamento Mensal */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faturamento Mensal</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data?.evolucaoMensal || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="mesNome" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Line
                          type="monotone"
                          dataKey="faturamento"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ fill: '#10B981', r: 6 }}
                          activeDot={{ r: 8 }}
                          name="Faturamento"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clientes por Mês */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clientes por Mês</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data?.evolucaoMensal || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="mesNome" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Bar
                          dataKey="clientes"
                          fill="#3B82F6"
                          radius={[8, 8, 0, 0]}
                          name="Clientes"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Distribuição Bebidas vs Comida */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Faturamento</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bebidas', value: data?.financeiro?.faturamentoBebidas || 0 },
                          { name: 'Comida', value: data?.financeiro?.faturamentoComida || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#EF4444" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                      <Wine className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Bebidas</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.financeiro?.faturamentoBebidas || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <Utensils className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Comida</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.financeiro?.faturamentoComida || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CULTURA */}
            <TabsContent value="cultura" className="space-y-6">
              <div>
                <h3 className="card-title-dark mb-4">Pessoas e Cultura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">NPS Médio</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(data?.pessoasCultura?.npsMedia || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Satisfação da equipe
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border border-pink-200 dark:border-pink-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                        <Smile className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Felicidade</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(data?.pessoasCultura?.felicidadeMedia || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Clima organizacional
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Instagram className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Instagram</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          +{new Intl.NumberFormat('pt-BR').format(data?.marketing?.crescimentoInstagram || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Novos seguidores
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.operacional?.ticketsVendidos || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ingressos vendidos
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Geral</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart
                    data={[
                      {
                        subject: 'Faturamento',
                        A: Math.min((data?.financeiro?.faturamentoTotal || 0) / 10000, 100),
                        fullMark: 100,
                      },
                      {
                        subject: 'Clientes',
                        A: Math.min((data?.financeiro?.totalClientes || 0) / 100, 100),
                        fullMark: 100,
                      },
                      {
                        subject: 'NPS',
                        A: (data?.pessoasCultura?.npsMedia || 0) * 10,
                        fullMark: 100,
                      },
                      {
                        subject: 'Felicidade',
                        A: (data?.pessoasCultura?.felicidadeMedia || 0) * 10,
                        fullMark: 100,
                      },
                      {
                        subject: 'Eventos',
                        A: Math.min((data?.operacional?.totalEventos || 0) * 5, 100),
                        fullMark: 100,
                      },
                    ]}
                  >
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                    />
                    <PolarRadiusAxis stroke="#9CA3AF" />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* TAB: CONQUISTAS */}
            <TabsContent value="conquistas" className="space-y-6">
              <div>
                <h3 className="card-title-dark mb-4">Conquistas de 2025</h3>
                
                {/* OKRs */}
                {data?.metas?.okrs && data.metas.okrs.length > 0 ? (
                  <div className="space-y-3">
                    {data.metas.okrs.map((okr: any, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {okr.titulo || okr.descricao}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {okr.descricao}
                            </p>
                          </div>
                          {okr.progresso >= 100 && (
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 ml-4" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {okr.progresso || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                (okr.progresso || 0) >= 100
                                  ? 'bg-green-600 dark:bg-green-400'
                                  : (okr.progresso || 0) >= 70
                                  ? 'bg-blue-600 dark:bg-blue-400'
                                  : 'bg-yellow-600 dark:bg-yellow-400'
                              }`}
                              style={{ width: `${Math.min(okr.progresso || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-12 text-center">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Nenhum OKR configurado para 2025
                    </p>
                  </div>
                )}
              </div>

              {/* Visão Estratégica */}
              {data?.metas?.visaoGeral && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Visão Estratégica 2025
                    </h4>
                  </div>
                  {data.metas.visaoGeral.visao && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {data.metas.visaoGeral.visao}
                    </p>
                  )}
                  {data.metas.visaoGeral.missao && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Missão:</strong> {data.metas.visaoGeral.missao}
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem Final */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-center text-white">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">
                  2025 foi apenas o começo!
                </h3>
                <p className="text-lg opacity-90">
                  Agora é hora de conquistar 2026 com ainda mais força! 🚀
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
