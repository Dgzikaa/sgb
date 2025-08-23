'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/layouts/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Package, ShoppingCart, TrendingUp, DollarSign, Target, Download, CalendarDays, Calendar, Eye, X, Percent } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'
import { AnimatedCounter, AnimatedCurrency } from '@/components/ui/animated-counter'
import { motion } from 'framer-motion'

interface Produto {
  produto: string
  grupo: string
  quantidade: number
  valorTotal: number
  custoTotal: number
  visitas: number
  ultimaVenda: string
  primeiraVenda: string
}

interface EstatisticasProdutos {
  totalProdutos: number
  totalVendas: number
  totalQuantidade: number
  totalCusto: number
  margemLucro: number
  totalRegistros: number
}

interface ApiResponse {
  produtos: Produto[]
  estatisticas: EstatisticasProdutos
}

interface VendaDetalhada {
  data: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  custo: number
  margem: number
}

interface ProdutoDetalhado {
  nome: string
  grupo: string
}

interface DetalhesResponse {
  produto: ProdutoDetalhado
  vendas: VendaDetalhada[]
  estatisticas: {
    totalVendas: number
    quantidadeTotal: number
    valorTotal: number
    custoTotal: number
    margemLucro: number
  }
  dia_destaque: string
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasProdutos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<string>('todos')
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [vendasDetalhadas, setVendasDetalhadas] = useState<VendaDetalhada[]>([])
  const [diaDestaque, setDiaDestaque] = useState<string>('')
  const [loadingVendas, setLoadingVendas] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  
  const { selectedBar } = useBar()
  const { toast } = useToast()
  const isApiCallingRef = useRef(false)

  const fetchProdutos = useCallback(async () => {
    if (isApiCallingRef.current) return
    
    try {
      isApiCallingRef.current = true
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedBar?.id) {
        params.append('bar_id', selectedBar.id.toString())
      }
      if (diaSemanaFiltro !== 'todos') {
        params.append('dia_semana', diaSemanaFiltro)
      }

      const response = await fetch(`/api/analitico/produtos-final?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()
      setProdutos(data.produtos)
      setEstatisticas(data.estatisticas)

    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
      setError('Erro ao carregar dados dos produtos')
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os dados dos produtos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      isApiCallingRef.current = false
    }
  }, [selectedBar, diaSemanaFiltro, toast])

  const fetchVendasDetalhadas = async (produto: Produto) => {
    try {
      setLoadingVendas(true)
      
      const params = new URLSearchParams()
      params.append('produto', produto.produto)
      params.append('grupo', produto.grupo)
      if (selectedBar?.id) {
        params.append('bar_id', selectedBar.id.toString())
      }

      const response = await fetch(`/api/analitico/produtos/detalhes?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data: DetalhesResponse = await response.json()
      setVendasDetalhadas(data.vendas)
      setDiaDestaque(data.dia_destaque)

    } catch (err) {
      console.error('Erro ao buscar vendas detalhadas:', err)
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do produto.",
        variant: "destructive",
      })
    } finally {
      setLoadingVendas(false)
    }
  }

  const abrirModalProduto = async (produto: Produto) => {
    setProdutoSelecionado(produto)
    setModalAberto(true)
    await fetchVendasDetalhadas(produto)
  }

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00Z')
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const exportarCSV = () => {
    try {
      let dadosCSV: any[] = []
      let nomeArquivo = ''

      dadosCSV = produtos.map(produto => ({
        'Produto': produto.produto,
        'Grupo': produto.grupo,
        'Quantidade Vendida': produto.quantidade,
        'Valor Total': produto.valorTotal,
        'Custo Total': produto.custoTotal,
        'Margem (%)': produto.valorTotal > 0 ? (((produto.valorTotal - produto.custoTotal) / produto.valorTotal) * 100).toFixed(1) : '0',
        'Vendas': produto.visitas,
        'Última Venda': formatDate(produto.ultimaVenda),
        'Primeira Venda': formatDate(produto.primeiraVenda)
      }))
      nomeArquivo = `produtos_${diaSemanaFiltro !== 'todos' ? `dia_${diaSemanaFiltro}_` : ''}${new Date().toISOString().split('T')[0]}.csv`

      const headers = Object.keys(dadosCSV[0])
      const csvContent = [
        headers.join(','),
        ...dadosCSV.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', nomeArquivo)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${nomeArquivo} baixado com sucesso!`,
      })
    } catch (err) {
      console.error('Erro ao exportar CSV:', err)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      })
    }
  }

  const getBadgeVariant = (posicao: number): "default" | "secondary" | "destructive" | "outline" => {
    if (posicao === 1) return "default"
    if (posicao <= 3) return "secondary" 
    if (posicao <= 10) return "outline"
    return "outline"
  }

  const diasSemanaOptions = [
    { value: 'todos', label: 'Todos os dias' },
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="card-dark">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="card-dark">
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="text-center">
              <Package className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Erro ao carregar produtos
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <Button onClick={fetchProdutos} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <PageHeader
            title="Produtos"
            description="Análise detalhada dos produtos mais vendidos"
            icon={Package}
          />

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={diaSemanaFiltro} onValueChange={setDiaSemanaFiltro}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Filtrar por dia" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {diasSemanaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-gray-100">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={exportarCSV} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={produtos.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Produtos Únicos
                        </p>
                        <AnimatedCounter 
                          value={estatisticas.totalProdutos} 
                          className="text-2xl font-bold text-gray-900 dark:text-white"
                        />
                      </div>
                      <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Vendas Totais
                        </p>
                        <AnimatedCurrency 
                          value={estatisticas.totalVendas} 
                          className="text-2xl font-bold text-green-600 dark:text-green-400"
                        />
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Quantidade Total
                        </p>
                        <AnimatedCounter 
                          value={estatisticas.totalQuantidade} 
                          className="text-2xl font-bold text-orange-600 dark:text-orange-400"
                        />
                      </div>
                      <ShoppingCart className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Margem de Lucro
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatPercent(estatisticas.margemLucro)}
                        </p>
                      </div>
                      <Percent className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Tabela de Produtos */}
          <Card className="card-dark">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="card-title-dark">
                Top 100 Produtos por Vendas
              </CardTitle>
              <CardDescription className="card-description-dark">
                Ranking dos produtos com maior faturamento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-900 dark:text-gray-100">#</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">Produto</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">Grupo</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Qtd</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Vendas</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Valor Total</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Margem</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Última Venda</TableHead>
                      <TableHead className="text-center text-gray-900 dark:text-gray-100">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto, index) => {
                      const posicao = index + 1
                      const margem = produto.valorTotal > 0 ? ((produto.valorTotal - produto.custoTotal) / produto.valorTotal) * 100 : 0
                      
                      return (
                        <TableRow key={`${produto.produto}-${produto.grupo}`} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell>
                            <Badge variant={getBadgeVariant(posicao)}>
                              {posicao}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {produto.produto}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {produto.grupo}
                          </TableCell>
                          <TableCell className="text-center text-gray-900 dark:text-gray-100">
                            {produto.quantidade.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-center text-gray-900 dark:text-gray-100">
                            {produto.visitas}
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(produto.valorTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={margem >= 50 ? 'text-green-600 dark:text-green-400' : margem >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                              {formatPercent(margem)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-gray-600 dark:text-gray-400">
                            {formatDate(produto.ultimaVenda)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModalProduto(produto)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Detalhes do Produto */}
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg -m-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      {produtoSelecionado?.produto}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 text-lg">
                      📞 {produtoSelecionado?.grupo}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {loadingVendas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando vendas...</span>
                </div>
              ) : (
                <>
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">{vendasDetalhadas.length}</p>
                            <p className="text-sm opacity-90">Total de Vendas</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">
                              {formatCurrency(vendasDetalhadas.reduce((sum, v) => sum + v.valorTotal, 0))}
                            </p>
                            <p className="text-sm opacity-90">Total Faturado</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">
                              {vendasDetalhadas.reduce((sum, v) => sum + v.quantidade, 0).toFixed(0)}
                            </p>
                            <p className="text-sm opacity-90">Quantidade Total</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">
                              {vendasDetalhadas.length > 0 ? formatDate(vendasDetalhadas[0].data) : '-'}
                            </p>
                            <p className="text-sm opacity-90">Última Venda</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">{diaDestaque}</p>
                            <p className="text-sm opacity-90">Dia Destaque</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Histórico de Vendas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Vendas</h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Detalhamento de todas as vendas registradas
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableHead className="text-gray-900 dark:text-gray-100">Data da Venda</TableHead>
                            <TableHead className="text-center justify-center text-gray-900 dark:text-gray-100">Quantidade</TableHead>
                            <TableHead className="text-center justify-center text-gray-900 dark:text-gray-100">Valor Unit.</TableHead>
                            <TableHead className="text-center justify-center text-gray-900 dark:text-gray-100">Total</TableHead>
                            <TableHead className="text-center justify-center text-gray-900 dark:text-gray-100">Margem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendasDetalhadas.map((venda, index) => (
                            <TableRow key={index} className="border-gray-200 dark:border-gray-700">
                              <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(venda.data)}
                              </TableCell>
                              <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                {venda.quantidade.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                {formatCurrency(venda.valorUnitario)}
                              </TableCell>
                              <TableCell className="text-center font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(venda.valorTotal)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={venda.margem >= 50 ? 'text-green-600 dark:text-green-400' : venda.margem >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                                  {formatPercent(venda.margem)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      {vendasDetalhadas.length} vendas encontradas
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
