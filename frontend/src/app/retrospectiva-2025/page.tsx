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

            {/* Card: Clientes Ativos */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  Clientes
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {new Intl.NumberFormat('pt-BR').format(data?.financeiro?.clientesAtivos || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clientes Ativos Médio
              </div>
              {data?.financeiro?.recorrenciaMedia > 0 && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {(data.financeiro.recorrenciaMedia * 100).toFixed(1)}% de recorrência
                </div>
              )}
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

        {/* Indicadores Operacionais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Card: CMV Limpo */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  CMV Limpo
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {((data?.financeiro?.cmvLimpoMedio || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Média Anual
              </div>
              {data?.metas?.visaoGeral?.meta_cmv_limpo && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Meta: {data.metas.visaoGeral.meta_cmv_limpo}%
                </div>
              )}
            </div>

            {/* Card: CMO */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  CMO
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {((data?.financeiro?.cmoMedio || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Custo Mão de Obra
              </div>
              {data?.metas?.visaoGeral?.meta_cmo && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Meta: {data.metas.visaoGeral.meta_cmo}%
                </div>
              )}
            </div>

            {/* Card: % Artística */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                  Artística
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {((data?.financeiro?.percentualArtisticaMedio || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Custo Artístico
              </div>
              {data?.metas?.visaoGeral?.meta_artistica && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Meta: {data.metas.visaoGeral.meta_artistica}%
                </div>
              )}
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
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="vendas">Vendas</TabsTrigger>
              <TabsTrigger value="evolucao">Evolução</TabsTrigger>
              <TabsTrigger value="cultura">Cultura</TabsTrigger>
              <TabsTrigger value="problemas">Desafios</TabsTrigger>
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

              {/* Distribuição Bar / Drinks / Comida */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Faturamento</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bar (Cervejas)', value: data?.vendas?.faturamentoCervejas || 0 },
                          { name: 'Drinks', value: data?.vendas?.faturamentoDrinks || 0 },
                          { name: 'Comida', value: data?.vendas?.faturamentoComidas || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#F59E0B" />
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#10B981" />
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

                  <div className="flex flex-col justify-center space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <Beer className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Bar (Cervejas)</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.vendas?.faturamentoCervejas || 0)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {data?.vendas?.faturamentoCervejas && data?.vendas?.faturamentoCervejas + data?.vendas?.faturamentoDrinks + data?.vendas?.faturamentoComidas > 0
                          ? ((data.vendas.faturamentoCervejas / (data.vendas.faturamentoCervejas + data.vendas.faturamentoDrinks + data.vendas.faturamentoComidas)) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <Martini className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Drinks</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.vendas?.faturamentoDrinks || 0)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {data?.vendas?.faturamentoDrinks && data?.vendas?.faturamentoCervejas + data?.vendas?.faturamentoDrinks + data?.vendas?.faturamentoComidas > 0
                          ? ((data.vendas.faturamentoDrinks / (data.vendas.faturamentoCervejas + data.vendas.faturamentoDrinks + data.vendas.faturamentoComidas)) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <Utensils className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Comida</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.vendas?.faturamentoComidas || 0)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {data?.vendas?.faturamentoComidas && data?.vendas?.faturamentoCervejas + data?.vendas?.faturamentoDrinks + data?.vendas?.faturamentoComidas > 0
                          ? ((data.vendas.faturamentoComidas / (data.vendas.faturamentoCervejas + data.vendas.faturamentoDrinks + data.vendas.faturamentoComidas)) * 100).toFixed(1)
                          : 0}%
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

            {/* TAB: DESAFIOS E METAS */}
            <TabsContent value="problemas" className="space-y-6">
              {/* Visão Anual */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visão Anual 2025</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data?.metas?.visaoGeral?.imagem_1_ano || 'Ser um dos Principais Bares da Cidade'}
                    </p>
                  </div>
                </div>

                {/* Problemas Identificados */}
                {data?.metas?.visaoGeral?.principais_problemas && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Principais Desafios Identificados:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {data.metas.visaoGeral.principais_problemas.map((problema: string, pIndex: number) => (
                        <div key={pIndex} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-orange-500">⚠️</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{problema}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metas do Ano */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta Faturamento</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">R$ 10M</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta Clientes</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">4.000</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta CMV</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">34%</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta CMO</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">20%</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta Artística</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">20%</div>
                  </div>
                </div>
              </div>

              {/* Análise de OKRs com Status Automático */}
              <div>
                <h3 className="card-title-dark mb-4">Análise de Metas vs Resultados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Faturamento */}
                  <div className={`rounded-xl p-5 border ${
                    (data?.financeiro?.faturamentoTotal || 0) >= 10000000 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">💰 Faturamento</div>
                      {(data?.financeiro?.faturamentoTotal || 0) >= 10000000 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">Em progresso</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data?.financeiro?.faturamentoTotal || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Real</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">R$ 10M</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(data?.financeiro?.faturamentoTotal || 0) >= 10000000 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(((data?.financeiro?.faturamentoTotal || 0) / 10000000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-500">
                      {(((data?.financeiro?.faturamentoTotal || 0) / 10000000) * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Clientes Ativos */}
                  <div className={`rounded-xl p-5 border ${
                    (data?.financeiro?.clientesAtivos || 0) >= 4000 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">👥 Clientes Ativos</div>
                      {(data?.financeiro?.clientesAtivos || 0) >= 4000 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">Em progresso</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.financeiro?.clientesAtivos || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Real</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">4.000</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(data?.financeiro?.clientesAtivos || 0) >= 4000 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(((data?.financeiro?.clientesAtivos || 0) / 4000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-500">
                      {(((data?.financeiro?.clientesAtivos || 0) / 4000) * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* CMV Limpo */}
                  <div className={`rounded-xl p-5 border ${
                    ((data?.financeiro?.cmvMedio || 0) * 100) <= 34 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">📊 CMV Limpo</div>
                      {((data?.financeiro?.cmvMedio || 0) * 100) <= 34 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">Acima</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((data?.financeiro?.cmvMedio || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Real</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">34%</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                  </div>

                  {/* CMO */}
                  <div className={`rounded-xl p-5 border ${
                    ((data?.financeiro?.cmoMedio || 0) * 100) <= 20 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">👷 CMO</div>
                      {((data?.financeiro?.cmoMedio || 0) * 100) <= 20 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">Acima</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {((data?.financeiro?.cmoMedio || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Real</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">20%</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className={`rounded-xl p-5 border ${
                    (data?.marketing?.seguidoresFinal || 0) >= 50000 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">📱 Instagram</div>
                      {(data?.marketing?.seguidoresFinal || 0) >= 50000 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">Em progresso</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR').format(data?.marketing?.seguidoresFinal || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Seguidores</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">50k</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(data?.marketing?.seguidoresFinal || 0) >= 50000 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(((data?.marketing?.seguidoresFinal || 0) / 50000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-500">
                      {(((data?.marketing?.seguidoresFinal || 0) / 50000) * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Eventos */}
                  <div className={`rounded-xl p-5 border ${
                    (data?.operacional?.totalEventos || 0) >= 50 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">🎉 Eventos Premium</div>
                      {(data?.operacional?.totalEventos || 0) >= 50 ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Atingido</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">Em progresso</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data?.operacional?.totalEventos || 0}
                        </div>
                        <div className="text-xs text-gray-500">Realizados</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">50</div>
                        <div className="text-xs text-gray-500">Meta</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(data?.operacional?.totalEventos || 0) >= 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(((data?.operacional?.totalEventos || 0) / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-500">
                      {(((data?.operacional?.totalEventos || 0) / 50) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo de Metas */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  Resumo das Metas 2025
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {[
                        (data?.financeiro?.faturamentoTotal || 0) >= 10000000,
                        (data?.financeiro?.clientesAtivos || 0) >= 4000,
                        ((data?.financeiro?.cmvMedio || 0) * 100) <= 34,
                        (data?.marketing?.seguidoresFinal || 0) >= 50000,
                        (data?.operacional?.totalEventos || 0) >= 50,
                      ].filter(Boolean).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Metas Atingidas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {[
                        ((data?.financeiro?.cmoMedio || 0) * 100) > 20,
                      ].filter(Boolean).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Acima da Meta</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">6</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total de Metas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(([
                        (data?.financeiro?.faturamentoTotal || 0) >= 10000000,
                        (data?.financeiro?.clientesAtivos || 0) >= 4000,
                        ((data?.financeiro?.cmvMedio || 0) * 100) <= 34,
                        (data?.marketing?.seguidoresFinal || 0) >= 50000,
                        (data?.operacional?.totalEventos || 0) >= 50,
                      ].filter(Boolean).length / 6) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Taxa de Sucesso</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: INSIGHTS ESTRATÉGICOS 360° */}
            <TabsContent value="conquistas" className="space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  🎯 Insights Estratégicos 2025
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Análise 360° do seu ano — dados para planejar 2026
                </p>
              </div>

              {/* RECORDES DO ANO */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  🏆 Recordes do Ano
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Maior Faturamento */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">💰 Maior Faturamento</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(data?.insights?.recordes?.maiorFaturamentoDia?.valor || 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {data?.insights?.recordes?.maiorFaturamentoDia?.evento}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      📅 {data?.insights?.recordes?.maiorFaturamentoDia?.data}
                    </div>
                  </div>
                  
                  {/* Maior Público */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">👥 Maior Público</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR').format(data?.insights?.recordes?.maiorPublico?.clientes || 0)} pessoas
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {data?.insights?.recordes?.maiorPublico?.evento}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      📅 {data?.insights?.recordes?.maiorPublico?.data}
                    </div>
                  </div>

                  {/* Melhor Ticket */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">🎫 Melhor Ticket Médio</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(data?.insights?.recordes?.melhorTicketMedio?.ticket || 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {data?.insights?.recordes?.melhorTicketMedio?.evento}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      👥 {data?.insights?.recordes?.melhorTicketMedio?.clientes} clientes
                    </div>
                  </div>

                  {/* Horário Pico */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">⏰ Horário Pico</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {data?.insights?.recordes?.horarioPico?.hora || 0}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatCurrency(data?.insights?.recordes?.horarioPico?.faturamento || 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total no ano neste horário
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP CLIENTES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clientes que Mais Gastaram */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    💎 Top Clientes VIP
                  </h4>
                  <div className="space-y-3">
                    {(data?.insights?.topClientes || []).slice(0, 5).map((cliente: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{cliente.nome}</div>
                            <div className="text-xs text-gray-500">{cliente.visitas} visitas • {cliente.tempo_medio_min}min média</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(cliente.total_gasto)}</div>
                          <div className="text-xs text-gray-500">TM: {formatCurrency(cliente.ticket_medio)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clientes Mais Fiéis */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    ❤️ Clientes Mais Fiéis
                  </h4>
                  <div className="space-y-3">
                    {(data?.insights?.clientesFieis || []).slice(0, 5).map((cliente: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-pink-500' : idx === 2 ? 'bg-rose-500' : 'bg-gray-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{cliente.nome}</div>
                            <div className="text-xs text-gray-500">{cliente.horas_media}h média por visita</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600 dark:text-purple-400">{cliente.visitas} visitas</div>
                          <div className="text-xs text-gray-500">{formatCurrency(cliente.total_gasto)} total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TOP ARTISTAS */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  🎤 Artistas com Melhor Performance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.insights?.topArtistas || []).slice(0, 6).map((artista: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate pr-2">
                          {artista.artista}
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Shows:</span>
                          <span className="font-medium text-gray-900 dark:text-white ml-1">{artista.shows}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Público:</span>
                          <span className="font-medium text-gray-900 dark:text-white ml-1">{artista.media_publico}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Média Fat.:</span>
                          <span className="font-medium text-green-600 dark:text-green-400 ml-1">{formatCurrency(artista.media_faturamento)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PERFORMANCE POR DIA DA SEMANA */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  📅 Performance por Dia da Semana
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {(data?.insights?.performanceDiaSemana || []).map((dia: any, idx: number) => (
                    <div key={idx} className={`rounded-lg p-3 text-center ${
                      idx === 0 ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' : 'bg-white dark:bg-gray-700/50'
                    }`}>
                      <div className={`font-semibold text-sm ${idx === 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {dia.dia}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {(dia.media_faturamento / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-gray-500">
                        {dia.media_clientes} pessoas
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {dia.total_eventos} eventos
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP PRODUTOS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Drinks */}
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    🍹 Top Drinks
                  </h4>
                  <div className="space-y-2">
                    {(data?.insights?.topDrinks || []).slice(0, 5).map((drink: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-purple-500 text-white' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          }`}>{idx + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{drink.drink}</span>
                        </div>
                        <span className="font-medium text-purple-600 dark:text-purple-400">{drink.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comidas */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    🍔 Top Comidas
                  </h4>
                  <div className="space-y-2">
                    {(data?.insights?.topComidas || []).slice(0, 5).map((comida: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          }`}>{idx + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{comida.prato}</span>
                        </div>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{comida.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horários Pico */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    ⏰ Horários de Pico
                  </h4>
                  <div className="space-y-2">
                    {(data?.insights?.horariosPico || []).slice(0, 5).map((horario: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}>{idx + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300">{horario.hora}h</span>
                        </div>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(horario.faturamento)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DATAS-CHAVE PARA 2026 */}
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-900/10 dark:to-cyan-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  🗓️ Datas-Chave para 2026
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Performance em feriados e datas especiais — use para planejar 2026!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.insights?.datasChave || []).slice(0, 6).map((data_chave: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {data_chave.tipo_data}
                        </span>
                        <span className="text-xs text-gray-500">{data_chave.dia_semana}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {data_chave.evento}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">📅 {data_chave.data_evento}</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(data_chave.faturamento)}</span>
                      </div>
                      {data_chave.clientes > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          👥 {data_chave.clientes} pessoas
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP 10 EVENTOS */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  🎉 Top 10 Eventos do Ano
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Data</th>
                        <th className="pb-2 font-medium">Evento</th>
                        <th className="pb-2 font-medium text-right">Clientes</th>
                        <th className="pb-2 font-medium text-right">Faturamento</th>
                        <th className="pb-2 font-medium text-right">Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.insights?.topEventos || []).map((evento: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}>{idx + 1}</span>
                          </td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{evento.data_evento} ({evento.dia_semana})</td>
                          <td className="py-2 font-medium text-gray-900 dark:text-white">{evento.evento}</td>
                          <td className="py-2 text-right text-purple-600 dark:text-purple-400">{evento.clientes}</td>
                          <td className="py-2 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(evento.faturamento)}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(evento.ticket_medio)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mensagem Final */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-center text-white">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">
                  2025 foi apenas o começo!
                </h3>
                <p className="text-lg opacity-90 mb-4">
                  Use esses insights para dominar 2026! 🚀
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-sm">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-bold text-xl">{data?.insights?.topEventos?.length || 0}</div>
                    <div className="opacity-80">Top Eventos</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-bold text-xl">{data?.insights?.topClientes?.length || 0}</div>
                    <div className="opacity-80">Clientes VIP</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="font-bold text-xl">{data?.insights?.topArtistas?.length || 0}</div>
                    <div className="opacity-80">Top Artistas</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
