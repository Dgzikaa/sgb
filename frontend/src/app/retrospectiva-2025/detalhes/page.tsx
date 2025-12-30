'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Package,
  Award,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts'
import ChartCard from '@/components/retrospectiva/ChartCard'

export default function RetrospectiveDetailsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Calcular métricas adicionais
  const bebidasPercentual = data?.financeiro?.faturamentoTotal > 0
    ? (data.financeiro.faturamentoBebidas / data.financeiro.faturamentoTotal) * 100
    : 0

  const comidaPercentual = data?.financeiro?.faturamentoTotal > 0
    ? (data.financeiro.faturamentoComida / data.financeiro.faturamentoTotal) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/retrospectiva-2025"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Visão Geral</span>
          </Link>

          <h1 className="text-5xl font-black mb-4">
            📊 Análise Detalhada 2025
          </h1>
          <p className="text-xl text-white/90">
            Mergulhe fundo nos números e conquistas do ano
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Faturamento Total
              </h3>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              {formatCurrency(data?.financeiro?.faturamentoTotal || 0)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-semibold">
                {data?.operacional?.totalSemanas || 0} semanas operacionais
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                CMV Médio
              </h3>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              {formatPercent(data?.financeiro?.cmvMedio || 0)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              {(data?.financeiro?.cmvMedio || 0) < 30 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-semibold">Excelente controle</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-600 font-semibold">Atenção necessária</span>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                CMO Médio
              </h3>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              {formatPercent(data?.financeiro?.cmoMedio || 0)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              {(data?.financeiro?.cmoMedio || 0) < 15 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-semibold">Ótima eficiência</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-600 font-semibold">Revisar estratégia</span>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Análise Bebidas vs Comida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ChartCard
            title="🍷 Análise de Bebidas"
            description={`${formatPercent(bebidasPercentual)} do faturamento total`}
            delay={0.4}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  Faturamento Total
                </span>
                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                  {formatCurrency(data?.financeiro?.faturamentoBebidas || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  Participação no Total
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatPercent(bebidasPercentual)}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Meta: 60%</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Atual: {formatPercent(bebidasPercentual)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(bebidasPercentual, 100)}%` }}
                    transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-red-500 to-rose-600 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="🍔 Análise de Comida"
            description={`${formatPercent(comidaPercentual)} do faturamento total`}
            delay={0.5}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  Faturamento Total
                </span>
                <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(data?.financeiro?.faturamentoComida || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  Participação no Total
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatPercent(comidaPercentual)}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Meta: 40%</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Atual: {formatPercent(comidaPercentual)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(comidaPercentual, 100)}%` }}
                    transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Gráfico de Área - Evolução Acumulada */}
        <ChartCard
          title="📈 Evolução Acumulada de Faturamento"
          description="Crescimento progressivo ao longo do ano"
          delay={0.6}
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={data?.evolucaoMensal?.reduce((acc: any[], curr: any, index: number) => {
                const acumulado = index === 0
                  ? curr.faturamento
                  : acc[index - 1].faturamentoAcumulado + curr.faturamento
                
                acc.push({
                  ...curr,
                  faturamentoAcumulado: acumulado,
                })
                
                return acc
              }, []) || []}
            >
              <defs>
                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="faturamentoAcumulado"
                stroke="#8B5CF6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorFaturamento)"
                name="Faturamento Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* OKRs e Metas */}
        {data?.metas?.okrs && data.metas.okrs.length > 0 && (
          <div className="mt-12">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-black text-gray-900 dark:text-white mb-6"
            >
              🎯 OKRs e Conquistas
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.metas.okrs.map((okr: any, index: number) => (
                <motion.div
                  key={okr.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {okr.titulo || okr.nome}
                      </h3>
                      {okr.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {okr.descricao}
                        </p>
                      )}
                    </div>
                    {okr.progresso >= 100 ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                    ) : (
                      <Target className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {okr.progresso || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(okr.progresso || 0, 100)}%` }}
                        transition={{ delay: 0.9 + index * 0.1, duration: 1, ease: 'easeOut' }}
                        className={`h-3 rounded-full ${
                          okr.progresso >= 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : okr.progresso >= 70
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
