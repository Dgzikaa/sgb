'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Plus,
  Upload,
  Settings,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardFPPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchDashboard()
  }, [mesAno])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const [ano, mes] = mesAno.split('-')
      const response = await fetch(`/api/fp/dashboard?ano=${ano}&mes=${mesAno}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const resumo = data?.resumo || {}
  const contas = data?.contas || []
  const topCategorias = data?.topCategorias || []
  const transacoesRecentes = data?.transacoesRecentes || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Financeiro Pessoal
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas finanças de forma simples e inteligente
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/fp/importar">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Extrato
                </Button>
              </Link>
              
              <Link href="/fp/transacoes">
                <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </Link>
              
              <Link href="/fp/categorias">
                <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Categorias
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtro de Mês/Ano */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Período
            </label>
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="input-dark max-w-xs"
            />
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Saldo Total */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Saldo Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldoTotal || 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {contas.length} conta{contas.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Receitas do Mês */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Receitas do Mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalReceitas || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Entradas
                    </p>
                  </div>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Despesas do Mês */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Despesas do Mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalDespesas || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Saídas
                    </p>
                  </div>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          {/* Saldo do Mês */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Saldo do Mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${
                    (resumo.saldo || 0) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.saldo || 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Receitas - Despesas
                  </p>
                </div>
                <DollarSign className={`w-10 h-10 ${
                  (resumo.saldo || 0) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 5 Categorias */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Principais Despesas
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Top 5 categorias do mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCategorias.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-500 text-center py-8">
                  Nenhuma despesa registrada neste mês
                </p>
              ) : (
                <div className="space-y-3">
                  {topCategorias.map((cat: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.cor }}
                        />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {cat.nome}
                        </span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contas */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Minhas Contas
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Saldos atualizados
                  </CardDescription>
                </div>
                <Link href="/fp/contas">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {contas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    Nenhuma conta cadastrada
                  </p>
                  <Link href="/fp/contas">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Primeira Conta
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {contas.map((conta: any) => (
                    <div key={conta.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {conta.nome}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {conta.banco} • {conta.tipo}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldo_atual)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transações Recentes */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">
                  Transações Recentes
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Últimas 10 movimentações
                </CardDescription>
              </div>
              <Link href="/fp/transacoes">
                <Button size="sm" variant="outline">
                  Ver Todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {transacoesRecentes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-500 text-center py-8">
                Nenhuma transação registrada
              </p>
            ) : (
              <div className="space-y-2">
                {transacoesRecentes.map((t: any) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: t.categoria?.cor || '#6B7280' }}
                      >
                        <span className="text-white text-lg">
                          {t.tipo === 'receita' ? '+' : '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {t.descricao}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(t.data).toLocaleDateString('pt-BR')} • {t.conta?.nome || 'Conta'}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-semibold ${
                      t.tipo === 'receita' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {t.tipo === 'receita' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
