'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/layouts/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, Users, TrendingUp, MessageCircle, DollarSign, Target, Download, CalendarDays } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'

interface Cliente {
  identificador_principal: string
  nome_principal: string
  telefone: string | null
  email: string | null
  sistema: string
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<string>('todos')
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
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
      const response = await fetch('/api/analitico/clientes', {
        headers: selectedBar ? {
          'x-user-data': JSON.stringify({ bar_id: selectedBar.id })
        } : undefined
      })
      if (!response.ok) {
        throw new Error('Erro ao carregar dados dos clientes')
      }
      const data: ApiResponse = await response.json()
      setClientes(data.clientes)
      setClientesFiltrados(data.clientes) // Inicializar filtrados
      setEstatisticas(data.estatisticas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [selectedBar])

  useEffect(() => {
    fetchClientes()
  }, [selectedBar, fetchClientes])

  // Filtrar clientes baseado no dia da semana da última visita
  useEffect(() => {
    if (diaSemanaFiltro === 'todos') {
      setClientesFiltrados(clientes)
    } else {
      const clientesFiltrados = clientes.filter(cliente => {
        const dataUltimaVisita = new Date(cliente.ultima_visita)
        const diaSemanaVisita = dataUltimaVisita.getDay().toString()
        return diaSemanaVisita === diaSemanaFiltro
      })
      setClientesFiltrados(clientesFiltrados)
    }
  }, [clientes, diaSemanaFiltro])

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
      const dadosCSV = clientesFiltrados.map((cliente, index) => ({
        'Posição': index + 1,
        'Nome': cliente.nome_principal,
        'Telefone': cliente.telefone || '',
        'Email': cliente.email || '',
        'Sistema': cliente.sistema,
        'Total Visitas': cliente.total_visitas,
        'Valor Total Entrada': cliente.valor_total_entrada,
        'Valor Total Consumo': cliente.valor_total_consumo,
        'Ticket Médio Geral': cliente.ticket_medio_geral,
        'Ticket Médio Entrada': cliente.ticket_medio_entrada,
        'Ticket Médio Consumo': cliente.ticket_medio_consumo,
        'Última Visita': formatDate(cliente.ultima_visita),
      }))

      const csvContent = [
        Object.keys(dadosCSV[0]).join(','),
        ...dadosCSV.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const nomeArquivo = diaSemanaFiltro === 'todos' 
        ? 'clientes_todos_os_dias.csv'
        : `clientes_${diasSemana.find(d => d.value === diaSemanaFiltro)?.label.toLowerCase().replace('-feira', '').replace(' ', '_')}.csv`
      
      link.setAttribute('download', nomeArquivo)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação concluída",
        description: `${clientesFiltrados.length} clientes exportados para CSV`,
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-80 mb-3" />
            <Skeleton className="h-6 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
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
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Análise de Clientes" description="Insights detalhados dos seus clientes mais valiosos" />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">


          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
                  estatisticas?.total_clientes_unicos?.toLocaleString('pt-BR') || 0
                )}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                ContaHub + Sympla
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
                  Number(estatisticas?.total_visitas_geral || 0).toLocaleString('pt-BR')
                )}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Desde a abertura
              </p>
            </CardContent>
          </Card>



          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
                  formatCurrency(Number(estatisticas?.ticket_medio_geral) || 0)
                )}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Por visita paga
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
                  formatCurrency(Number(estatisticas?.ticket_medio_entrada) || 0)
                )}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Couvert médio
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
                  formatCurrency(Number(estatisticas?.ticket_medio_consumo) || 0)
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Consumação média
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Clientes */}
          <Card className="card-dark shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white" />
                <div>
                  <CardTitle className="text-white">
                    Top 100 Clientes Unificados
                  </CardTitle>
                  <CardDescription className="text-slate-200">
                    Dados integrados do ContaHub e Sympla ordenados por visitas
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
                  <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <CalendarDays className="h-4 w-4 mr-2" />
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
                  disabled={clientesFiltrados.length === 0}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar ({clientesFiltrados.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
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
                        <span className="text-lg">🏢</span>
                        Sistema
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
                      className={`text-xs ${
                        cliente.sistema === 'ContaHub' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {cliente.sistema}
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
                      {cliente.sistema === 'ContaHub' && (
                        <div className="flex flex-col gap-1 items-center">
                          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs">
                            🎫 {formatCurrency(cliente.ticket_medio_entrada)}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                            🍺 {formatCurrency(cliente.ticket_medio_consumo)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-600 dark:text-gray-400">
                    {formatDate(cliente.ultima_visita)}
                  </TableCell>
                  <TableCell className="text-center">
                    {cliente.telefone ? (
                      <Button
                        onClick={() => handleWhatsAppClick(cliente.nome_principal, cliente.telefone)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
                        aria-label={`Enviar WhatsApp para ${cliente.nome_principal}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Sem telefone
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {clientesFiltrados.length === 0 && !loading && (
          <Card className="card-dark shadow-lg mt-6">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {diaSemanaFiltro === 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente neste dia da semana'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {diaSemanaFiltro === 'todos' 
                  ? 'Não há dados de clientes disponíveis no momento. Verifique se os dados foram sincronizados corretamente.'
                  : `Não há clientes com última visita em ${diasSemana.find(d => d.value === diaSemanaFiltro)?.label}. Tente outro dia da semana.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}