'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Target,
  Activity,
  AlertTriangle,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Star,
  Zap,
  Clock
} from 'lucide-react'

interface IndicadorDesempenho {
  id: string
  categoria: 'guardrail' | 'ovt' | 'qualidade' | 'produtos'
  nome: string
  descricao: string
  unidade: string
  meta?: number
  dados: {
    semanais: DadoSemanal[]
    mensais: DadoMensal[]
  }
}

interface DadoSemanal {
  semana: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface DadoMensal {
  mes: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface RespostaDesempenho {
  indicadores: IndicadorDesempenho[]
  resumo: {
    totalIndicadores: number
    acimaMeta: number
    abaixoMeta: number
    dentroMeta: number
  }
}

// Funções auxiliares
const formatarValor = (valor: number, unidade: string): string => {
  if (unidade === 'R$') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }
  
  if (unidade === '%') {
    return `${valor.toFixed(1)}%`
  }
  
  if (unidade === 'clientes') {
    return valor.toLocaleString('pt-BR')
  }
  
  return `${valor.toLocaleString('pt-BR')} ${unidade}`
}

const getStatusIcon = (status: string, tendencia: string) => {
  if (status === 'acima') {
    return tendencia === 'crescendo' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <CheckCircle className="h-4 w-4 text-green-500" />
  }
  
  if (status === 'abaixo') {
    return tendencia === 'decrescendo' ? 
      <TrendingDown className="h-4 w-4 text-red-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }
  
  return <Target className="h-4 w-4 text-blue-500" />
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'acima':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Acima</Badge>
    case 'abaixo':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Abaixo</Badge>
    case 'dentro':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Dentro</Badge>
    default:
      return <Badge variant="secondary">-</Badge>
  }
}

const getCategoriaColor = (categoria: string) => {
  const cores: { [key: string]: string } = {
    'guardrail': 'text-red-600 dark:text-red-400',
    'ovt': 'text-blue-600 dark:text-blue-400',
    'qualidade': 'text-green-600 dark:text-green-400',
    'produtos': 'text-purple-600 dark:text-purple-400'
  }
  return cores[categoria] || 'text-gray-600 dark:text-gray-400'
}

const getCategoriaLabel = (categoria: string) => {
  const labels: { [key: string]: string } = {
    'guardrail': 'Guardrail',
    'ovt': 'OVT',
    'qualidade': 'Qualidade',
    'produtos': 'Produtos'
  }
  return labels[categoria] || categoria
}

const getCategoriaIcon = (categoria: string) => {
  switch (categoria) {
    case 'guardrail':
      return <AlertTriangle className="h-4 w-4" />
    case 'ovt':
      return <Clock className="h-4 w-4" />
    case 'qualidade':
      return <Star className="h-4 w-4" />
    case 'produtos':
      return <Zap className="h-4 w-4" />
    default:
      return <BarChart3 className="h-4 w-4" />
  }
}

export default function DesempenhoPage() {
  const [dados, setDados] = useState<RespostaDesempenho | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [viewMode, setViewMode] = useState<'semanal' | 'mensal'>('semanal')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gestao/desempenho')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados')
      }
      
      const data = await response.json()
      setDados(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const indicadoresFiltrados = dados?.indicadores.filter(indicador => {
    if (categoriaFiltro === 'todas') return true
    return indicador.categoria === categoriaFiltro
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600 dark:text-gray-400">Carregando tabela de desempenho...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado disponível
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl w-fit">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Tabela de Desempenho
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Acompanhe os principais indicadores estratégicos do seu negócio
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Atualizar */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <Button onClick={carregarDados} variant="outline" className="w-full sm:w-auto">
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Indicadores
              </CardTitle>
              <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {dados.resumo.totalIndicadores}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Acima da Meta
              </CardTitle>
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {dados.resumo.acimaMeta}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Abaixo da Meta
              </CardTitle>
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {dados.resumo.abaixoMeta}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Dentro da Meta
              </CardTitle>
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dados.resumo.dentroMeta}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                <SelectItem value="guardrail">Guardrail</SelectItem>
                <SelectItem value="ovt">OVT</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Desempenho */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Indicadores de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'semanal' | 'mensal')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-4 sm:mb-6">
                <TabsTrigger 
                  value="semanal"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md text-xs sm:text-sm"
                >
                  Visão Semanal
                </TabsTrigger>
                <TabsTrigger 
                  value="mensal"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md text-xs sm:text-sm"
                >
                  Visão Mensal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="semanal" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Indicador</th>
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Categoria</th>
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Meta</th>
                        {dados.indicadores[0]?.dados.semanais.map((semana, index) => (
                          <th key={index} className="text-center p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                            {semana.semana}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {indicadoresFiltrados.map((indicador) => (
                        <tr key={indicador.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 sm:p-3">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{indicador.nome}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{indicador.descricao}</div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-2">
                              <span className={getCategoriaColor(indicador.categoria)}>
                                {getCategoriaIcon(indicador.categoria)}
                              </span>
                              <Badge variant="outline" className="text-xs">{getCategoriaLabel(indicador.categoria)}</Badge>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {indicador.meta ? formatarValor(indicador.meta, indicador.unidade) : '-'}
                            </div>
                          </td>
                          {indicador.dados.semanais.map((semana, index) => (
                            <td key={index} className="p-2 sm:p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {formatarValor(semana.valor, indicador.unidade)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(semana.status, semana.tendencia)}
                                  {getStatusBadge(semana.status)}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="mensal" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Indicador</th>
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Categoria</th>
                        <th className="text-left p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Meta</th>
                        {dados.indicadores[0]?.dados.mensais.map((mes, index) => (
                          <th key={index} className="text-center p-2 sm:p-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                            {mes.mes}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {indicadoresFiltrados.map((indicador) => (
                        <tr key={indicador.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 sm:p-3">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{indicador.nome}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{indicador.descricao}</div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-2">
                              <span className={getCategoriaColor(indicador.categoria)}>
                                {getCategoriaIcon(indicador.categoria)}
                              </span>
                              <Badge variant="outline" className="text-xs">{getCategoriaLabel(indicador.categoria)}</Badge>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {indicador.meta ? formatarValor(indicador.meta, indicador.unidade) : '-'}
                            </div>
                          </td>
                          {indicador.dados.mensais.map((mes, index) => (
                            <td key={index} className="p-2 sm:p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {formatarValor(mes.valor, indicador.unidade)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(mes.status, mes.tendencia)}
                                  {getStatusBadge(mes.status)}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
