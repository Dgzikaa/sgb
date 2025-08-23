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

import { Package, ShoppingCart, TrendingUp, DollarSign, Target, Download, CalendarDays, Calendar, Star, Percent } from 'lucide-react'
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
  diaDestaque: string
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



export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasProdutos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<string>('todos')
  const [activeTab, setActiveTab] = useState<string>('produtos')
  
  const { selectedBar } = useBar()
  const { toast } = useToast()
  const isApiCallingRef = useRef(false)

  const fetchProdutos = useCallback(async () => {
    if (isApiCallingRef.current) {
      console.log('⚠️ API já está sendo chamada, ignorando...')
      return
    }
    
    try {
      isApiCallingRef.current = true
      setLoading(true)
      setError(null)
      console.log('🔍 Frontend: Iniciando busca de produtos...')

      const params = new URLSearchParams()
      if (selectedBar?.id) {
        params.append('bar_id', selectedBar.id.toString())
      }
      if (diaSemanaFiltro !== 'todos') {
        params.append('dia_semana', diaSemanaFiltro)
      }
      
      console.log('📋 Frontend: Parâmetros da busca:', params.toString())

      const response = await fetch(`/api/analitico/produtos-final?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()
      console.log('✅ Frontend: Dados recebidos:', data.produtos.length, 'produtos')
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
  }, [])



  useEffect(() => {
    console.log('🔄 useEffect: Dependências mudaram, chamando fetchProdutos')
    fetchProdutos()
  }, [selectedBar, diaSemanaFiltro])

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
      const diaLabel = diasSemana.find(d => d.value === diaSemanaFiltro)?.label.replace(/[^a-zA-Z0-9]/g, '_') || 'todos'
      nomeArquivo = `produtos_${diaSemanaFiltro !== 'todos' ? `${diaLabel}_` : ''}${new Date().toISOString().split('T')[0]}.csv`

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

  const diasSemana = [
    { value: 'todos', label: 'Todos os dias' },
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira (até 15/04/25)' }, // Dados históricos apenas
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
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
        <div className="space-y-6">
          <PageHeader
            title="Produtos"
            description="Análise detalhada dos produtos mais vendidos"
            icon={Package}
          />

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={diaSemanaFiltro} onValueChange={setDiaSemanaFiltro}>
              <SelectTrigger className="w-full sm:w-[280px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filtrar por dia da semana" className="text-gray-900 dark:text-gray-100" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {diasSemana.map((dia) => (
                  <SelectItem 
                    key={dia.value} 
                    value={dia.value} 
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={exportarCSV} 
              variant="outline" 
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
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

          {/* Tabs de Produtos */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <TabsTrigger 
                value="produtos" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-md transition-all duration-200"
              >
                <Package className="w-4 h-4 mr-2" />
                Top 100 Produtos por Vendas
                <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {produtos.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="produtos" className="mt-6 space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ranking dos Produtos Mais Vendidos
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Produtos ordenados por faturamento total
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-900 dark:text-gray-100 font-medium">#</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Produto</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Grupo</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Qtd</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Vendas</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Valor Total</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Margem</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Dia Destaque</TableHead>
                          <TableHead className="text-center text-gray-900 dark:text-gray-100 font-medium">Última Venda</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtos.map((produto, index) => {
                          const posicao = index + 1
                          const margem = produto.valorTotal > 0 ? ((produto.valorTotal - produto.custoTotal) / produto.valorTotal) * 100 : 0
                          
                          return (
                            <TableRow key={`${produto.produto}-${produto.grupo}`} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <TableCell className="py-4">
                                <Badge 
                                  variant={getBadgeVariant(posicao)}
                                  className="font-semibold"
                                >
                                  {posicao}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {produto.produto}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                                {produto.grupo}
                              </TableCell>
                              <TableCell className="py-4 text-center font-medium text-gray-900 dark:text-gray-100">
                                {produto.quantidade.toFixed(0)}
                              </TableCell>
                              <TableCell className="py-4 text-center font-medium text-gray-900 dark:text-gray-100">
                                {produto.visitas}
                              </TableCell>
                              <TableCell className="py-4 text-center font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(produto.valorTotal)}
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                <Badge 
                                  variant="outline"
                                  className={`font-medium ${
                                    margem >= 50 
                                      ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                                      : margem >= 30 
                                      ? 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                                      : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                                  }`}
                                >
                                  {formatPercent(margem)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                <Badge 
                                  variant="secondary"
                                  className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  {produto.diaDestaque}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 text-center text-gray-600 dark:text-gray-400">
                                {formatDate(produto.ultimaVenda)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
