'use client'

import { useState, useEffect } from 'react'
import { StandardPageLayout } from '@/components/layouts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  BarChart3Icon,
  FileTextIcon,
  RefreshCwIcon,
  DollarSignIcon,
  PieChartIcon,
  ActivityIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBarContext } from '@/contexts/BarContext'

interface DashboardData {
  resumo: {
    total_receitas: number
    total_despesas: number
    saldo_liquido: number
    total_transacoes: number
  }
  receitas_por_categoria: Array<{
    categoria: string
    total: number
    tipo: string
  }>
  despesas_por_categoria: Array<{
    categoria: string
    total: number
    tipo: string
  }>
  transacoes_recentes: Array<{
    id: string
    tipo: 'receita' | 'despesa'
    descricao: string
    valor: number
    data: string
    status: string
    categoria: string
  }>
  estatisticas: {
    categorias_com_receitas: number
    categorias_com_despesas: number
    receitas_categorizadas: number
    despesas_categorizadas: number
  }
}

export default function DashboardFinanceiroPage() {
  const { selectedBar } = useBarContext()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)

  const carregarDados = async () => {
    if (!selectedBar) {
      toast({
        title: "Bar não selecionado",
        description: "Selecione um bar para ver os dados financeiros",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard-financeiro?barId=${selectedBar.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar dados')
      }
      
      setData(result)
      
      toast({
        title: "✅ Dados Carregados!",
        description: `${result.resumo.total_transacoes} transações encontradas`,
      })
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  useEffect(() => {
    if (selectedBar) {
      carregarDados()
    }
  }, [selectedBar])

  const getMaxValue = (items: Array<{ total: number }>) => {
    return Math.max(...items.map(item => item.total), 1)
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              💰 Dashboard Financeiro
            </h1>
            <p className="text-gray-600 mt-1">
              Visão geral das finanças do ContaAzul com dados categorizados
            </p>
            {data && (
              <p className="text-sm text-gray-500 mt-2">
                Última atualização: {new Date().toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <Button onClick={carregarDados} disabled={loading}>
            {loading ? (
              <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="w-4 h-4 mr-2" />
            )}
            Atualizar Dados
          </Button>
        </div>

        {/* Cards de Resumo */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.resumo.total_receitas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.estatisticas.receitas_categorizadas} receitas categorizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.resumo.total_despesas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.estatisticas.despesas_categorizadas} despesas categorizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                <BarChart3Icon className={`h-4 w-4 ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.resumo.saldo_liquido)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
                <ActivityIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.resumo.total_transacoes.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.estatisticas.categorias_com_receitas + data.estatisticas.categorias_com_despesas} categorias ativas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos de Categorias */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                  Top Receitas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.receitas_por_categoria.slice(0, 8).map((item, index) => {
                    const maxValue = getMaxValue(data.receitas_por_categoria)
                    const percentage = (item.total / maxValue) * 100
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate">
                            {item.categoria}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                  {data.receitas_por_categoria.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma receita categorizada encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Despesas por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-red-600" />
                  Top Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.despesas_por_categoria.slice(0, 8).map((item, index) => {
                    const maxValue = getMaxValue(data.despesas_por_categoria)
                    const percentage = (item.total / maxValue) * 100
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate">
                            {item.categoria}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                  {data.despesas_por_categoria.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma despesa categorizada encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transações Recentes */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                Transações Recentes ({data.transacoes_recentes.length})
              </CardTitle>
              <CardDescription>
                Últimas transações categorizadas por data de vencimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.transacoes_recentes.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Nenhuma transação categorizada encontrada.
                    </AlertDescription>
                  </Alert>
                ) : (
                  data.transacoes_recentes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={item.tipo === 'receita' ? 'default' : 'destructive'}>
                            {item.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
                          </Badge>
                          <span className="font-medium">{item.descricao}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            📁 {item.categoria}
                          </span>
                          <span className="mx-2">•</span>
                          <span>📅 {formatDate(item.data)}</span>
                          <span className="mx-2">•</span>
                          <span>📊 {item.status}</span>
                        </div>
                      </div>
                      <div className={`font-bold text-lg ${item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.tipo === 'receita' ? '+' : '-'}{formatCurrency(item.valor)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de Loading */}
        {loading && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Carregando dados financeiros do ContaAzul...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Buscando receitas, despesas e categorias...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado sem dados */}
        {!loading && !data && selectedBar && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <DollarSignIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Dados Financeiros</h3>
                <p className="text-gray-500 mb-4">
                  Clique em "Atualizar Dados" para carregar as informações financeiras do ContaAzul.
                </p>
                <Button onClick={carregarDados}>
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Carregar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info sobre sincronização */}
        {!loading && !selectedBar && (
          <Alert>
            <AlertDescription>
              💡 Selecione um bar no menu lateral para visualizar os dados financeiros do ContaAzul.
              Certifique-se de que o sync categorizado foi executado nas configurações.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </StandardPageLayout>
  )
} 