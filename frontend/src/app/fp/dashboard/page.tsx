'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Receipt, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { fetchFP } from '@/lib/api-fp'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts'

interface Transacao {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  categoria?: any
  conta?: any
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E']

export default function DashboardPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [transResult, contasResult] = await Promise.all([
          fetchFP('/api/fp/transacoes'),
          fetchFP('/api/fp/contas')
        ])

        if (transResult.success) setTransacoes(transResult.data)
        if (contasResult.success) setContas(contasResult.data)
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar por período
  const getDataInicio = () => {
    const hoje = new Date()
    if (periodoSelecionado === 'semana') {
      hoje.setDate(hoje.getDate() - 7)
    } else if (periodoSelecionado === 'mes') {
      hoje.setMonth(hoje.getMonth() - 1)
    } else if (periodoSelecionado === 'trimestre') {
      hoje.setMonth(hoje.getMonth() - 3)
    } else if (periodoSelecionado === 'ano') {
      hoje.setFullYear(hoje.getFullYear() - 1)
    }
    return hoje
  }

  const transacoesFiltradas = transacoes.filter((t) => {
    const dataTransacao = new Date(t.data)
    const dataInicio = getDataInicio()
    return dataTransacao >= dataInicio
  })

  // Calcular totais
  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0)

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0)

  const saldo = totalReceitas - totalDespesas

  // Saldo total em contas
  const saldoTotalContas = contas.reduce((acc, c) => acc + c.saldo_atual, 0)

  // Despesas por categoria
  const despesasPorCategoria: Record<string, number> = {}
  transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .forEach((t) => {
      const categoria = t.categoria?.nome || 'Sem categoria'
      despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + t.valor
    })

  const dadosDespesasPorCategoria = Object.entries(despesasPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Receitas por categoria
  const receitasPorCategoria: Record<string, number> = {}
  transacoesFiltradas
    .filter((t) => t.tipo === 'receita')
    .forEach((t) => {
      const categoria = t.categoria?.nome || 'Sem categoria'
      receitasPorCategoria[categoria] = (receitasPorCategoria[categoria] || 0) + t.valor
    })

  const dadosReceitasPorCategoria = Object.entries(receitasPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Evolução temporal (últimos 30 dias)
  const ultimosDias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const evolucao = ultimosDias.map((dia) => {
    const transacoesDia = transacoes.filter((t) => t.data === dia)
    const receitas = transacoesDia.filter((t) => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
    const despesas = transacoesDia.filter((t) => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0)
    
    return {
      data: new Date(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receitas,
      despesas,
      saldo: receitas - despesas
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Link href="/fp" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Financeiro</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visão geral das suas finanças
            </p>
          </div>

          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="tudo">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Saldo Total em Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoTotalContas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Receitas ({periodoSelecionado})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-100 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Despesas ({periodoSelecionado})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${saldo >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} text-white border-0`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Saldo ({periodoSelecionado})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Despesas por Categoria */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosDespesasPorCategoria.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma despesa registrada
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosDespesasPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDespesasPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Receitas por Categoria */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Receitas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosReceitasPorCategoria.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma receita registrada
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosReceitasPorCategoria}>
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolução Temporal */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Evolução (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucao}>
                <XAxis dataKey="data" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#10B981" name="Receitas" strokeWidth={2} />
                <Line type="monotone" dataKey="despesas" stroke="#EF4444" name="Despesas" strokeWidth={2} />
                <Line type="monotone" dataKey="saldo" stroke="#3B82F6" name="Saldo" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Contas */}
        <div className="mt-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Suas Contas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contas.map((conta) => (
                  <div key={conta.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${conta.cor}20` }}
                    >
                      <Wallet className="w-6 h-6" style={{ color: conta.cor }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{conta.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{conta.banco}</p>
                      <p className="text-lg font-bold" style={{ color: conta.cor }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldo_atual)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
