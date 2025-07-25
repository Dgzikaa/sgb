'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Music,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react'

interface EventoCalendario {
  id: string
  data: string
  label: string
  artista: string
  genero: string
  reservas: {
    total: number
    presentes: number
    canceladas: number
  }
  planejado: {
    faturamento: number
    clientes: number
    ticket_medio: number
  }
  realizado?: {
    faturamento: number
    clientes: number
    ticket_medio: number
  }
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
  observacoes?: string
}

interface ReservaEvento {
  id: string
  evento_id: string
  nome: string
  telefone: string
  quantidade: number
  horario: string
  status: 'confirmada' | 'presente' | 'cancelada' | 'no_show'
  observacoes?: string
  data_criacao: string
}

interface MetaDiaria {
  data: string
  faturamento_meta: number
  clientes_meta: number
  ticket_medio_meta: number
  custo_artistico: number
  custo_producao: number
}

interface RespostaCalendario {
  eventos: EventoCalendario[]
  reservas: ReservaEvento[]
  metas_diarias: MetaDiaria[]
  resumo: {
    totalEventos: number
    eventosConfirmados: number
    eventosCancelados: number
    totalReservas: number
    reservasConfirmadas: number
    faturamentoPlanejado: number
    faturamentoRealizado: number
  }
}

// Funções auxiliares
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatarDataCompleta = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'realizado':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'confirmado':
      return <Target className="h-4 w-4 text-blue-500" />
    case 'agendado':
      return <Calendar className="h-4 w-4 text-orange-500" />
    case 'cancelado':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'realizado':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Realizado</Badge>
    case 'confirmado':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Confirmado</Badge>
    case 'agendado':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Agendado</Badge>
    case 'cancelado':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelado</Badge>
    default:
      return <Badge variant="secondary">-</Badge>
  }
}

const getGeneroColor = (genero: string) => {
  const cores: { [key: string]: string } = {
    'Eletrônica': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Rock': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Samba': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Jazz': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'MPB': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Funk': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Pagode': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Pop': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  }
  return cores[genero] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

// Componente de calendário mensal
const CalendarioMensal = ({ eventos, metasDiarias, onEventoClick }: {
  eventos: EventoCalendario[]
  metasDiarias: MetaDiaria[]
  onEventoClick: (evento: EventoCalendario) => void
}) => {
  const [mesAtual, setMesAtual] = useState(new Date())
  
  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()
  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay()
  
  type DiaCalendario = {
    dia: number
    data: string
    evento?: EventoCalendario
    meta?: MetaDiaria
  } | null
  
  const dias: DiaCalendario[] = []
  for (let i = 0; i < primeiroDia; i++) {
    dias.push(null)
  }
  
  for (let i = 1; i <= diasNoMes; i++) {
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), i)
    const dataStr = data.toISOString().split('T')[0]
    const evento = eventos.find(e => e.data === dataStr)
    const meta = metasDiarias.find(m => m.data === dataStr)
    
    dias.push({ dia: i, data: dataStr, evento, meta })
  }

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual)
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1)
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1)
    }
    setMesAtual(novoMes)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Calendário Mensal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navegarMes('anterior')}>
              ←
            </Button>
            <span className="font-medium text-sm sm:text-base">
              {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navegarMes('proximo')}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
            <div key={dia} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              {dia}
            </div>
          ))}
          
          {dias.map((item, index) => (
            <div
              key={index}
              className={`min-h-[60px] sm:min-h-[80px] p-1 border border-gray-200 dark:border-gray-700 ${
                item ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              {item && (
                <div className="h-full">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {item.dia}
                  </div>
                  
                  {item.evento && (
                    <div
                      className="cursor-pointer p-1 rounded text-xs mb-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => onEventoClick(item.evento!)}
                    >
                      <div className="font-medium truncate text-xs">{item.evento.label}</div>
                      <div className="text-gray-600 dark:text-gray-400 truncate text-xs">{item.evento.artista}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(item.evento.status)}
                        <Badge className={`text-xs ${getGeneroColor(item.evento.genero)}`}>
                          {item.evento.genero}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {item.meta && !item.evento && (
                    <div className="p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-xs">
                      <div className="text-blue-700 dark:text-blue-300 font-medium">Meta</div>
                      <div className="text-blue-600 dark:text-blue-400">
                        {formatarValor(item.meta.faturamento_meta)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de detalhes do evento
const DetalhesEvento = ({ evento, reservas, meta, onClose }: {
  evento: EventoCalendario
  reservas: ReservaEvento[]
  meta?: MetaDiaria
  onClose: () => void
}) => {
  const reservasEvento = reservas.filter(r => r.evento_id === evento.id)
  
  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Music className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="break-words">{evento.label}</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge(evento.status)}
          <Badge className={getGeneroColor(evento.genero)}>
            {evento.genero}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informações</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600 dark:text-gray-400">Data:</span> {formatarDataCompleta(evento.data)}</div>
              <div><span className="text-gray-600 dark:text-gray-400">Artista:</span> {evento.artista}</div>
              <div><span className="text-gray-600 dark:text-gray-400">Gênero:</span> {evento.genero}</div>
              {evento.observacoes && (
                <div><span className="text-gray-600 dark:text-gray-400">Observações:</span> {evento.observacoes}</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reservas</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600 dark:text-gray-400">Total:</span> {evento.reservas.total}</div>
              <div><span className="text-gray-600 dark:text-gray-400">Presentes:</span> {evento.reservas.presentes}</div>
              <div><span className="text-gray-600 dark:text-gray-400">Canceladas:</span> {evento.reservas.canceladas}</div>
            </div>
          </div>
        </div>

        {/* Comparação Planejado vs Realizado */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Desempenho</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Faturamento</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                {formatarValor(evento.planejado.faturamento)}
              </div>
              {evento.realizado && (
                <div className={`text-xs ${evento.realizado.faturamento >= evento.planejado.faturamento ? 'text-green-600' : 'text-red-600'}`}>
                  {evento.realizado.faturamento >= evento.planejado.faturamento ? '↑' : '↓'} {formatarValor(evento.realizado.faturamento)}
                </div>
              )}
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Clientes</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                {evento.planejado.clientes}
              </div>
              {evento.realizado && (
                <div className={`text-xs ${evento.realizado.clientes >= evento.planejado.clientes ? 'text-green-600' : 'text-red-600'}`}>
                  {evento.realizado.clientes >= evento.planejado.clientes ? '↑' : '↓'} {evento.realizado.clientes}
                </div>
              )}
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ticket Médio</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                {formatarValor(evento.planejado.ticket_medio)}
              </div>
              {evento.realizado && (
                <div className={`text-xs ${evento.realizado.ticket_medio >= evento.planejado.ticket_medio ? 'text-green-600' : 'text-red-600'}`}>
                  {evento.realizado.ticket_medio >= evento.planejado.ticket_medio ? '↑' : '↓'} {formatarValor(evento.realizado.ticket_medio)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de reservas */}
        {reservasEvento.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Reservas ({reservasEvento.length})</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {reservasEvento.slice(0, 10).map(reserva => (
                <div key={reserva.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded gap-2">
                  <div>
                    <div className="font-medium text-sm">{reserva.nome}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {reserva.quantidade} pessoas • {reserva.horario}
                    </div>
                  </div>
                  <Badge className={reserva.status === 'presente' ? 'bg-green-100 text-green-800' : 
                                   reserva.status === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                                   'bg-red-100 text-red-800'}>
                    {reserva.status}
                  </Badge>
                </div>
              ))}
              {reservasEvento.length > 10 && (
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  +{reservasEvento.length - 10} mais reservas
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CalendarioPage() {
  const [dados, setDados] = useState<RespostaCalendario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null)
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroGenero, setFiltroGenero] = useState<string>('todos')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gestao/calendario')
      
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

  const eventosFiltrados = dados?.eventos.filter(evento => {
    if (filtroStatus !== 'todos' && evento.status !== filtroStatus) return false
    if (filtroGenero !== 'todos' && evento.genero !== filtroGenero) return false
    return true
  }) || []

  const generos = [...new Set(dados?.eventos.map(e => e.genero) || [])]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando planejamento comercial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!dados) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado disponível
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Planejamento Comercial
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gerencie eventos, agendamentos e acompanhe o desempenho comercial
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 mb-4 sm:mb-6">
          <Button onClick={carregarDados} variant="outline" className="w-full sm:w-auto">
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {dados.resumo.totalEventos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Eventos Confirmados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {dados.resumo.eventosConfirmados}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Reservas
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dados.resumo.totalReservas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Faturamento Planejado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarValor(dados.resumo.faturamentoPlanejado)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="flex-1">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="agendado">Agendado</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={filtroGenero} onValueChange={setFiltroGenero}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Gêneros</SelectItem>
              {generos.map(genero => (
                <SelectItem key={genero} value={genero}>{genero}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendario' | 'lista')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendario">Calendário Mensal</TabsTrigger>
          <TabsTrigger value="lista">Lista de Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <CalendarioMensal 
            eventos={eventosFiltrados}
            metasDiarias={dados.metas_diarias}
            onEventoClick={setEventoSelecionado}
          />
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          <div className="grid gap-4">
            {eventosFiltrados.map(evento => (
              <Card key={evento.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setEventoSelecionado(evento)}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(evento.status)}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{evento.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{evento.artista}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Data</div>
                        <div className="font-medium text-sm">{formatarData(evento.data)}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Faturamento</div>
                        <div className="font-medium text-sm">{formatarValor(evento.planejado.faturamento)}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reservas</div>
                        <div className="font-medium text-sm">{evento.reservas.total}</div>
                      </div>
                      
                      <Badge className={getGeneroColor(evento.genero)}>
                        {evento.genero}
                      </Badge>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      {eventoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DetalhesEvento 
              evento={eventoSelecionado}
              reservas={dados.reservas}
              meta={dados.metas_diarias.find(m => m.data === eventoSelecionado.data)}
              onClose={() => setEventoSelecionado(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
