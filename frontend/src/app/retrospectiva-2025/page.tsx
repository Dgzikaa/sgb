'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-900 dark:to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
          <p className="text-2xl font-bold text-white">Carregando retrospectiva...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-900 dark:to-black">
      {/* Fogos de Artifício */}
      <NewYearFireworks
        show={showFireworks}
        autoTrigger={true}
        onComplete={() => {
          setShowFireworks(false)
          localStorage.setItem('newyear-fireworks-2026', 'true')
        }}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-20 h-20 text-yellow-400 mx-auto" />
            </motion.div>
            
            <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
              Retrospectiva 2025
            </h1>
            
            <p className="text-2xl text-white/90 font-semibold mb-8">
              Um ano de conquistas extraordinárias! 🚀
            </p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-8 py-4 rounded-full border border-white/20"
            >
              <Award className="w-6 h-6 text-yellow-400" />
              <span className="text-white font-bold text-lg">
                {data?.metas?.okrsConcluidos || 0} de {data?.metas?.okrsTotal || 0} OKRs Concluídos
              </span>
            </motion.div>
          </motion.div>

          {/* Stats Grid - Indicadores Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Faturamento Total"
              value={data?.financeiro?.faturamentoTotal || 0}
              prefix="R$ "
              decimals={2}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
              delay={0.1}
              description="Crescimento excepcional em 2025"
            />

            <StatCard
              title="Total de Clientes"
              value={data?.financeiro?.totalClientes || 0}
              icon={Users}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
              delay={0.2}
              description="Pessoas atendidas com excelência"
            />

            <StatCard
              title="Ticket Médio"
              value={data?.financeiro?.ticketMedio || 0}
              prefix="R$ "
              decimals={2}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-purple-500 to-pink-600"
              delay={0.3}
              description="Valor médio por cliente"
            />

            <StatCard
              title="Total de Eventos"
              value={data?.operacional?.totalEventos || 0}
              icon={Calendar}
              gradient="bg-gradient-to-br from-orange-500 to-red-600"
              delay={0.4}
              description="Eventos realizados com sucesso"
            />
          </div>

          {/* Faturamento Bebidas vs Comida */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <StatCard
              title="Faturamento Bebidas"
              value={data?.financeiro?.faturamentoBebidas || 0}
              prefix="R$ "
              decimals={2}
              icon={Wine}
              gradient="bg-gradient-to-br from-red-500 to-rose-600"
              delay={0.5}
              description="Receita total com bebidas"
            />

            <StatCard
              title="Faturamento Comida"
              value={data?.financeiro?.faturamentoComida || 0}
              prefix="R$ "
              decimals={2}
              icon={Utensils}
              gradient="bg-gradient-to-br from-yellow-500 to-amber-600"
              delay={0.6}
              description="Receita total com alimentação"
            />
          </div>

          {/* Pessoas e Cultura */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="NPS Médio"
              value={data?.pessoasCultura?.npsMedia || 0}
              decimals={1}
              icon={Star}
              gradient="bg-gradient-to-br from-yellow-500 to-orange-600"
              delay={0.7}
              description="Satisfação da equipe"
            />

            <StatCard
              title="Felicidade Média"
              value={data?.pessoasCultura?.felicidadeMedia || 0}
              decimals={1}
              icon={Smile}
              gradient="bg-gradient-to-br from-pink-500 to-rose-600"
              delay={0.8}
              description="Clima organizacional"
            />

            <StatCard
              title="Crescimento Instagram"
              value={data?.marketing?.crescimentoInstagram || 0}
              suffix=" seguidores"
              icon={Instagram}
              gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
              delay={0.9}
              description="Novos seguidores no ano"
            />

            <StatCard
              title="Tickets Vendidos"
              value={data?.operacional?.ticketsVendidos || 0}
              icon={Ticket}
              gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
              delay={1.0}
              description="Ingressos comercializados"
            />
          </div>
        </div>
      </div>

      {/* Gráficos Detalhados */}
      <div className="container mx-auto px-4 pb-16">
        <motion.h2
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="text-4xl font-black text-white mb-8 text-center"
        >
          📊 Análises Detalhadas
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Evolução Mensal */}
          <ChartCard
            title="Evolução Mensal de Faturamento"
            description="Desempenho financeiro ao longo de 2025"
            delay={1.2}
          >
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
                <Legend />
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
          </ChartCard>

          {/* Clientes por Mês */}
          <ChartCard
            title="Clientes Atendidos por Mês"
            description="Volume de clientes mensalmente"
            delay={1.3}
          >
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
                <Legend />
                <Bar
                  dataKey="clientes"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                  name="Clientes"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top 10 Produtos */}
        <ChartCard
          title="🏆 Top 10 Produtos Mais Vendidos"
          description="Os campeões de vendas em 2025"
          delay={1.4}
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data?.topProdutos || []}
              layout="vertical"
              margin={{ left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="nome"
                stroke="#9CA3AF"
                style={{ fontSize: '11px' }}
                width={140}
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
              <Bar
                dataKey="vendaLiquida"
                fill="#8B5CF6"
                radius={[0, 8, 8, 0]}
                name="Venda Líquida"
              >
                {data?.topProdutos?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Distribuição Bebidas vs Comida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <ChartCard
            title="Distribuição de Faturamento"
            description="Bebidas vs Comida"
            delay={1.5}
          >
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
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
          </ChartCard>

          <ChartCard
            title="Performance Geral"
            description="Indicadores-chave de desempenho"
            delay={1.6}
          >
            <ResponsiveContainer width="100%" height={300}>
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
          </ChartCard>
        </div>

        {/* Mensagem Final */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <Target className="w-20 h-20 text-white mx-auto mb-6" />
            <h2 className="text-5xl font-black text-white mb-4">
              2025 foi apenas o começo! 🚀
            </h2>
            <p className="text-2xl text-white/90 mb-6">
              Agora é hora de conquistar 2026 com ainda mais força!
            </p>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              <p className="text-6xl">✨🎯💪</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
