'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/layouts/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Users, TrendingUp, MessageCircle, DollarSign, Target, Download, CalendarDays, Calendar, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'
import { AnimatedCounter, AnimatedCurrency } from '@/components/ui/animated-counter'
import { motion } from 'framer-motion'

interface Cliente {
  identificador_principal: string
  nome_principal: string
  telefone: string | null
  email: string | null
  total_visitas: number
  valor_total_gasto: number
  valor_total_entrada: number
  valor_total_consumo: number
  ticket_medio_geral: number
  ticket_medio_entrada: number
  ticket_medio_consumo: number
  ultima_visita: string
}

interface Estatisticas {
  total_clientes_unicos: number
  total_visitas_geral: number
  ticket_medio_geral: number
  ticket_medio_entrada: number
  ticket_medio_consumo: number
  valor_total_entrada: number
  valor_total_consumo: number
}

interface ApiResponse {
  clientes: Cliente[]
  estatisticas: Estatisticas
}

interface Reservante {
  identificador_principal: string
  nome_principal: string
  telefone: string | null
  total_reservas: number
  reservas_seated: number
  reservas_confirmed: number
  reservas_pending: number
  reservas_cancelled: number
  reservas_noshow: number
  ultima_reserva: string
  percentual_presenca: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reservantes, setReservantes] = useState<Reservante[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<string>('todos')
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
  const [activeTab, setActiveTab] = useState<string>('clientes')
  const { toast } = useToast()
  const { selectedBar } = useBar()

  const diasSemana = [
    { value: 'todos', label: 'Todos os dias' },
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
  ]

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      
      // Delay mínimo para mostrar loading
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800))
      
      // Construir URL com parâmetros
      const params = new URLSearchParams()
      if (diaSemanaFiltro !== 'todos') {
        params.append('dia_semana', diaSemanaFiltro)
      }
      
      const url = `/api/analitico/clientes${params.toString() ? `?${params.toString()}` : ''}`
      console.log('🔍 Frontend: Buscando clientes com URL:', url)
      
      const [response] = await Promise.all([
        fetch(url, {
          headers: selectedBar ? {
            'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
          } : undefined
        }),
        minLoadingTime
      ])
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados dos clientes')
      }
      const data: ApiResponse = await response.json()
      setClientes(data.clientes)
      setClientesFiltrados(data.clientes) // Agora já vem filtrado da API
      setEstatisticas(data.estatisticas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [selectedBar, diaSemanaFiltro])

  const fetchReservantes = useCallback(async () => {
    try {
      setLoading(true)
      
      // Delay mínimo para mostrar loading
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800))
      
      // Construir URL com parâmetros
      const params = new URLSearchParams()
      if (diaSemanaFiltro !== 'todos') {
        params.append('dia_semana', diaSemanaFiltro)
      }
      
      const url = `/api/analitico/reservantes${params.toString() ? `?${params.toString()}` : ''}`
      console.log('🔍 Frontend: Buscando reservantes com URL:', url)
      
      const [response] = await Promise.all([
        fetch(url, {
          headers: selectedBar ? {
            'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
          } : undefined
        }),
        minLoadingTime
      ])
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados dos reservantes')
      }
      const data = await response.json()
      setReservantes(data.reservantes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [selectedBar, diaSemanaFiltro])

  // Carregamento inicial
  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Mudança de aba
  useEffect(() => {
    if (activeTab === 'reservantes' && reservantes.length === 0) {
      fetchReservantes()
    }
  }, [activeTab, fetchReservantes, reservantes.length])

  // Não precisamos mais filtrar no frontend, pois o filtro é feito na API
  // Os dados já vêm filtrados do backend

  const handleWhatsAppClick = (nome: string, telefone: string | null) => {
    try {
      if (!telefone) {
        toast({
          title: "Telefone não disponível",
          description: "Este cliente não possui telefone cadastrado",
          variant: "destructive"
        })
        return
      }

      // Remove caracteres especiais do telefone
      const telefoneNumeros = telefone.replace(/\D/g, '')
      
      // Monta a mensagem personalizada
      const mensagem = `Olá ${nome}! 🎉\n\nObrigado por ser um cliente especial do nosso estabelecimento! Sua fidelidade é muito importante para nós.\n\nEstamos aqui para qualquer dúvida ou para lhe oferecer nossas novidades e promoções exclusivas.\n\nEsperamos vê-lo em breve! 😊`
      
      // URL do WhatsApp com a mensagem
      const whatsappUrl = `https://wa.me/55${telefoneNumeros}?text=${encodeURIComponent(mensagem)}`
      
      // Abre em nova aba
      window.open(whatsappUrl, '_blank')
      
      toast({
        title: "WhatsApp aberto",
        description: `Conversa iniciada com ${nome}`,
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp",
        variant: "destructive"
      })
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

  const exportarCSV = () => {
    try {
      let dadosCSV: any[] = []
      let nomeArquivo = ''
      let totalItens = 0
      
      if (activeTab === 'clientes') {
        dadosCSV = clientesFiltrados.map((cliente, index) => ({
          'Posição': index + 1,
          'Nome': cliente.nome_principal,
          'Telefone': cliente.telefone || '',
          'Total Visitas': cliente.total_visitas,
          'Valor Total Entrada': cliente.valor_total_entrada,
          'Valor Total Consumo': cliente.valor_total_consumo,
          'Ticket Médio Geral': cliente.ticket_medio_geral,
          'Ticket Médio Entrada': cliente.ticket_medio_entrada,
          'Ticket Médio Consumo': cliente.ticket_medio_consumo,
          'Última Visita': formatDate(cliente.ultima_visita),
        }))
        
        nomeArquivo = diaSemanaFiltro === 'todos' 
          ? 'clientes_todos_os_dias.csv'
          : `clientes_${diasSemana.find(d => d.value === diaSemanaFiltro)?.label.toLowerCase().replace('-feira', '').replace(' ', '_')}.csv`
        
        totalItens = clientesFiltrados.length
      } else {
        dadosCSV = reservantes.map((reservante, index) => ({
          'Posição': index + 1,
          'Nome': reservante.nome_principal,
          'Telefone': reservante.telefone || '',
          'Total Reservas': reservante.total_reservas,
          'Reservas Seated': reservante.reservas_seated,
          'Reservas Confirmed': reservante.reservas_confirmed,
          'Reservas Pending': reservante.reservas_pending,
          'Reservas Cancelled': reservante.reservas_cancelled,
          'Reservas No-Show': reservante.reservas_noshow,
          'Última Reserva': formatDate(reservante.ultima_reserva),
        }))
        
        nomeArquivo = diaSemanaFiltro === 'todos' 
          ? 'reservantes_todos_os_dias.csv'
          : `reservantes_${diasSemana.find(d => d.value === diaSemanaFiltro)?.label.toLowerCase().replace('-feira', '').replace(' ', '_')}.csv`
        
        totalItens = reservantes.length
      }

      const csvContent = [
        Object.keys(dadosCSV[0]).join(','),
        ...dadosCSV.map(row => Object.values(row).join(','))
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
        description: `${totalItens} ${activeTab} exportados para CSV`,
      })
    } catch (err) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-3 py-6">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Carregando dados dos clientes...</span>
            </div>
            <Skeleton className="h-8 w-64 mb-2 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-5 w-96 bg-gray-300 dark:bg-gray-600" />
          </div>
          
          {/* Cards de Estatísticas Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-2 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
                  <Skeleton className="h-4 w-20 bg-gray-400 dark:bg-gray-500" />
                </CardHeader>
                <CardContent className="pt-4">
                  <Skeleton className="h-8 w-24 mb-2 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabela Skeleton */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded bg-slate-500" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2 bg-slate-500" />
                      <Skeleton className="h-4 w-64 bg-slate-600" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-10 w-48 bg-slate-500 rounded-xl" />
                    <Skeleton className="h-10 w-10 bg-slate-500 rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32 bg-slate-500 rounded-xl" />
                  <Skeleton className="h-10 w-32 bg-slate-500 rounded-xl" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div>
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow className="border-b border-slate-200 dark:border-slate-700">
                      {[...Array(8)].map((_, i) => (
                        <TableHead key={i} className="py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(10)].map((_, i) => (
                      <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                        {[...Array(8)].map((_, j) => (
                          <TableCell key={j} className="py-4">
                            <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg max-w-md mx-auto mt-20">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Erro ao carregar clientes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {error}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              Análise de Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
              Insights detalhados dos seus clientes mais valiosos
            </p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-500 to-purple-600">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes Únicos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <AnimatedCounter 
                      value={estatisticas?.total_clientes_unicos || 0}
                      duration={2}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  ContaHub
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500 to-emerald-600">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total de Visitas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <AnimatedCounter 
                      value={estatisticas?.total_visitas_geral || 0}
                      duration={2.2}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Desde a abertura
                </p>
              </CardContent>
            </Card>
          </motion.div>



          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-500 to-amber-600">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Ticket Médio Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <AnimatedCurrency 
                      value={Number(estatisticas?.ticket_medio_geral) || 0}
                      duration={2.4}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Por visita paga
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
              <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-orange-600">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  🎫 Ticket Entrada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <AnimatedCurrency 
                      value={Number(estatisticas?.ticket_medio_entrada) || 0}
                      duration={2.6}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Couvert médio
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-green-600">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  🍺 Ticket Consumo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <AnimatedCurrency 
                      value={Number(estatisticas?.ticket_medio_consumo) || 0}
                      duration={2.8}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Consumação média
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabelas com Abas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card className="card-dark shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-white" />
                    <div>
                      <CardTitle className="text-white">
                        {activeTab === 'clientes' ? 'Top 100 Clientes ContaHub' : 'Top 100 Reservantes Getin'}
                      </CardTitle>
                      <CardDescription className="text-slate-200">
                        {activeTab === 'clientes' 
                          ? 'Dados do ContaHub ordenados por visitas'
                          : 'Dados de reservas ordenados por reservas efetivadas (seated)'
                        }
                        {diaSemanaFiltro !== 'todos' && (
                          <span className="ml-2 text-yellow-300">
                            • Filtrado por {diasSemana.find(d => d.value === diaSemanaFiltro)?.label}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={diaSemanaFiltro} onValueChange={setDiaSemanaFiltro}>
                      <SelectTrigger className="w-full sm:w-[200px] bg-white/90 dark:bg-gray-700/90 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm">
                        <CalendarDays className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {diasSemana.map((dia) => (
                          <SelectItem key={dia.value} value={dia.value}>
                            {dia.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={exportarCSV}
                      disabled={(activeTab === 'clientes' ? clientesFiltrados.length : reservantes.length) === 0}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-400 dark:to-green-500 dark:hover:from-green-500 dark:hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                      size="icon"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded-xl shadow-sm">
                  <TabsTrigger 
                    value="clientes" 
                    className="px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 !rounded-xl"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reservantes" 
                    className="px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 !rounded-xl"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reservantes
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="clientes" className="mt-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-900 dark:text-white font-semibold py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-7 h-7 rounded-full p-0 flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
                          #
                        </Badge>
                        Posição
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Nome do Cliente
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contato
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">📊</span>
                        ContaHub
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <TrendingUp className="h-4 w-4" />
                        Visitas
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">🎫</span>
                        Entrada
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">🍺</span>
                        Consumo
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Target className="h-4 w-4" />
                        Ticket Médio
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">📅</span>
                        Última Visita
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <MessageCircle className="h-4 w-4" />
                        Contato
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente, index) => (
                <TableRow 
                  key={`${cliente.identificador_principal}-${index}`}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Badge 
                        variant="outline"
                        className={`
                          min-w-[2.5rem] h-8 flex items-center justify-center font-bold text-sm rounded-full
                          ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-500 shadow-lg' : ''}
                          ${index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white border-gray-400 shadow-lg' : ''}
                          ${index === 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-lg' : ''}
                          ${index >= 3 ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' : ''}
                        `}
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white font-medium">
                    {cliente.nome_principal}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col gap-1">
                      {cliente.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.telefone}
                        </span>
                      )}
                      {cliente.email && (
                        <span className="flex items-center gap-1 text-xs">
                          📧 {cliente.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      ✓ Ativo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {cliente.total_visitas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-gray-900 dark:text-white font-medium">
                    <div className="text-sm">
                      {formatCurrency(cliente.valor_total_entrada)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-900 dark:text-white font-medium">
                    <div className="text-sm">
                      {formatCurrency(cliente.valor_total_consumo)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                        Total: {formatCurrency(cliente.ticket_medio_geral)}
                      </Badge>
                      <div className="flex flex-col gap-1 items-center">
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs">
                          🎫 {formatCurrency(cliente.ticket_medio_entrada)}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                          🍺 {formatCurrency(cliente.ticket_medio_consumo)}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-600 dark:text-gray-400">
                    {formatDate(cliente.ultima_visita)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {cliente.telefone ? (
                        <Button
                          onClick={() => handleWhatsAppClick(cliente.nome_principal, cliente.telefone)}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-400 dark:to-green-500 dark:hover:from-green-500 dark:hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-8 h-8 p-0"
                          aria-label={`Enviar WhatsApp para ${cliente.nome_principal}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Sem telefone
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="reservantes" className="mt-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-900 dark:text-white font-semibold py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-7 h-7 rounded-full p-0 flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
                          #
                        </Badge>
                        Posição
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome do Reservante
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contato
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        Total Reservas
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">✅</span>
                        Seated
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">⏳</span>
                        Status Reservas
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">📊</span>
                        % Presença
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-lg">📅</span>
                        Última Reserva
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-900 dark:text-white font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <MessageCircle className="h-4 w-4" />
                        Contato
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservantes.map((reservante, index) => (
                    <TableRow 
                      key={`${reservante.identificador_principal}-${index}`}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary" 
                            className={`w-8 h-8 rounded-full p-0 flex items-center justify-center font-bold text-sm ${
                              index < 3 
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' 
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {index + 1}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {reservante.nome_principal}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          {reservante.telefone && (
                            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              📱 {reservante.telefone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {reservante.total_reservas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          {reservante.reservas_seated}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1 items-center">
                          {reservante.reservas_confirmed > 0 && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                              ✓ {reservante.reservas_confirmed}
                            </Badge>
                          )}
                          {reservante.reservas_pending > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 text-xs">
                              ⏳ {reservante.reservas_pending}
                            </Badge>
                          )}
                          {reservante.reservas_cancelled > 0 && (
                            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                              ❌ {reservante.reservas_cancelled}
                            </Badge>
                          )}
                          {reservante.reservas_noshow > 0 && (
                            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs">
                              ⚠️ {reservante.reservas_noshow}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-bold ${
                              reservante.percentual_presenca >= 80 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                : reservante.percentual_presenca >= 60
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {reservante.percentual_presenca.toFixed(1)}%
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {reservante.reservas_seated}/{reservante.total_reservas}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-gray-600 dark:text-gray-400">
                        {formatDate(reservante.ultima_reserva)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppClick(reservante.nome_principal, reservante.telefone)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-400 dark:to-green-500 dark:hover:from-green-500 dark:hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-8 h-8 p-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Card>
        </Tabs>
        </motion.div>

        {((activeTab === 'clientes' && clientesFiltrados.length === 0) || (activeTab === 'reservantes' && reservantes.length === 0)) && !loading && (
          <Card className="card-dark shadow-lg mt-6">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'clientes' ? <Users className="h-10 w-10 text-slate-400" /> : <Calendar className="h-10 w-10 text-slate-400" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {activeTab === 'clientes' 
                  ? (diaSemanaFiltro === 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente neste dia da semana')
                  : (diaSemanaFiltro === 'todos' ? 'Nenhum reservante encontrado' : 'Nenhum reservante neste dia da semana')
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {activeTab === 'clientes' 
                  ? (diaSemanaFiltro === 'todos' 
                      ? 'Não há dados de clientes disponíveis no momento. Verifique se os dados foram sincronizados corretamente.'
                      : `Não há clientes com última visita em ${diasSemana.find(d => d.value === diaSemanaFiltro)?.label}. Tente outro dia da semana.`
                    )
                  : (diaSemanaFiltro === 'todos' 
                      ? 'Não há dados de reservantes disponíveis no momento. Verifique se os dados foram sincronizados corretamente.'
                      : `Não há reservantes com reservas em ${diasSemana.find(d => d.value === diaSemanaFiltro)?.label}. Tente outro dia da semana.`
                    )
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}