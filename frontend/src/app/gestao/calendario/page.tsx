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
    case 'confirmado':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'cancelado':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'realizado':
      return <Star className="h-4 w-4 text-yellow-500" />
    default:
      return <Clock className="h-4 w-4 text-blue-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmado':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Confirmado</Badge>
    case 'cancelado':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelado</Badge>
    case 'realizado':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Realizado</Badge>
    default:
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Agendado</Badge>
  }
}

const getGeneroColor = (genero: string) => {
  const cores: { [key: string]: string } = {
    'Rock': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Pop': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'Sertanejo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'MPB': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Eletrônica': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Jazz': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
  }
  return cores[genero] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

const CalendarioMensal = ({ eventos, metasDiarias, onEventoClick }: {
  eventos: EventoCalendario[]
  metasDiarias: MetaDiaria[]
  onEventoClick: (evento: EventoCalendario) => void
}) => {
  const [dataAtual, setDataAtual] = useState(new Date())

  type DiaCalendario = {
    dia: number
    data: string
    evento?: EventoCalendario
    meta?: MetaDiaria
  } | null

  const obterDiasMes = (data: Date): (DiaCalendario)[] => {
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const diasNoMes = ultimoDia.getDate()
    const diaSemanaInicio = primeiroDia.getDay()

    const dias: (DiaCalendario)[] = []

    // Adicionar dias vazios no início
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null)
    }

    // Adicionar dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataString = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      const evento = eventos.find(e => e.data === dataString)
      const meta = metasDiarias.find(m => m.data === dataString)

      dias.push({
        dia,
        data: dataString,
        evento,
        meta
      })
    }

    return dias
  }

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    setDataAtual(prev => {
      const novaData = new Date(prev)
      if (direcao === 'anterior') {
        novaData.setMonth(prev.getMonth() - 1)
      } else {
        novaData.setMonth(prev.getMonth() + 1)
      }
      return novaData
    })
  }

  const dias = obterDiasMes(dataAtual)
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={() => navegarMes('anterior')}>
          ←
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {nomesMeses[dataAtual.getMonth()]} {dataAtual.getFullYear()}
        </h2>
        <Button variant="outline" size="sm" onClick={() => navegarMes('proximo')}>
          →
        </Button>
      </div>

      {/* Grade do Calendário */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {/* Cabeçalhos dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
          <div key={dia} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {dia}
          </div>
        ))}

        {/* Dias do mês */}
        {dias.map((dia, index) => (
          <div
            key={index}
            className={`min-h-[80px] p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${
              dia ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
            }`}
            onClick={() => dia?.evento && onEventoClick(dia.evento)}
          >
            {dia && (
              <>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {dia.dia}
                </div>
                {dia.evento && (
                  <div className="space-y-1">
                    <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-1 rounded truncate">
                      {dia.evento.label}
                    </div>
                    {dia.meta && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Meta: {formatarValor(dia.meta.faturamento_meta)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const DetalhesEvento = ({ evento, reservas, meta, onClose }: {
  evento: EventoCalendario
  reservas: ReservaEvento[]
  meta?: MetaDiaria
  onClose: () => void
}) => {
  const reservasEvento = reservas.filter(r => r.evento_id === evento.id)

  const calcularProgresso = (atual: number, meta: number) => {
    if (meta === 0) return 0
    return Math.min((atual / meta) * 100, 100)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{evento.label}</h2>
        <Button variant="outline" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Evento */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Informações do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Artista:</span>
                <span className="font-medium text-gray-900 dark:text-white">{evento.artista}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gênero:</span>
                <Badge className={getGeneroColor(evento.genero)}>{evento.genero}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Data:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatarDataCompleta(evento.data)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                {getStatusBadge(evento.status)}
              </div>
            </CardContent>
          </Card>

          {/* Metas e Realizado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Metas vs Realizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Faturamento</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatarValor(evento.planejado.faturamento)} / {meta ? formatarValor(meta.faturamento_meta) : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${calcularProgresso(evento.planejado.faturamento, meta?.faturamento_meta || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Clientes</span>
                  <span className="text-gray-900 dark:text-white">
                    {evento.planejado.clientes} / {meta ? meta.clientes_meta : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${calcularProgresso(evento.planejado.clientes, meta?.clientes_meta || 0)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Reservas ({reservasEvento.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reservasEvento.map(reserva => (
                  <div key={reserva.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{reserva.nome}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{reserva.telefone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{reserva.quantidade} pessoas</div>
                      <Badge className="mt-1">
                        {reserva.status === 'confirmada' ? 'Confirmada' : 
                         reserva.status === 'presente' ? 'Presente' : 
                         reserva.status === 'cancelada' ? 'Cancelada' : 'No Show'}
                      </Badge>
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

export default function CalendarioPage() {
  const [dados, setDados] = useState<RespostaCalendario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null)
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroGenero, setFiltroGenero] = useState('todos')

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/gestao/calendario')
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do calendário')
      }
      
      const dadosCalendario = await response.json()
      setDados(dadosCalendario)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando calendário...</p>
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

  const eventosFiltrados = dados.eventos.filter(evento => {
    const passaStatus = filtroStatus === 'todos' || evento.status === filtroStatus
    const passaGenero = filtroGenero === 'todos' || evento.genero === filtroGenero
    return passaStatus && passaGenero
  })

  const generos = [...new Set(dados.eventos.map(e => e.genero))]

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
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
    </div>
  )
}
