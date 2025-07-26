"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, getMonth, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, ChevronUp, Music, Calendar as CalendarIcon, Filter, Users, TrendingUp, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Evento {
  id: number
  nome: string
  data_evento: string
  status: string
  artista?: string
  genero?: string
  tipo_evento?: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    status: string
    artista?: string
    genero?: string
    tipo_evento?: string
    nome: string
  }
}

interface MesComDados {
  mes: number
  ano: number
  nome: string
  quantidade: number
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const getGeneroIcon = (genero?: string) => {
  if (!genero) return '🎵'
  
  const generoLower = genero.toLowerCase()
  if (generoLower.includes('dj')) return '🎧'
  if (generoLower.includes('samba')) return '🎵'
  if (generoLower.includes('pagode')) return '🎸'
  if (generoLower.includes('jazz')) return '🎷'
  if (generoLower.includes('sertanejo')) return '🎤'
  if (generoLower.includes('cubana')) return '🥁'
  if (generoLower.includes('vocal')) return '🎤'
  return '🎵'
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmado':
      return <CheckCircle className="w-3 h-3 text-green-500" />
    case 'pendente':
      return <Clock className="w-3 h-3 text-yellow-500" />
    case 'cancelado':
      return <XCircle className="w-3 h-3 text-red-500" />
    default:
      return <Clock className="w-3 h-3 text-gray-400" />
  }
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()))
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()))
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroGenero, setFiltroGenero] = useState<string>('')
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([])

  const carregarEventos = async () => {
    try {
      setLoading(true)
      console.log('🔄 [CALENDARIO] Carregando eventos...')
      
      const params = new URLSearchParams()
      if (filtroStatus && filtroStatus !== 'todos') params.append('status', filtroStatus)
      if (filtroGenero && filtroGenero !== 'todos') params.append('genero', filtroGenero)
      
      const response = await fetch(`/api/gestao/eventos?${params}`)
      const data = await response.json()
      
      console.log('📊 [CALENDARIO] Eventos carregados:', data.eventos.length)
      setEventos(data.eventos)
      
      // Converter eventos para formato do calendário
      const events = data.eventos.map((evento: Evento) => ({
        id: evento.id,
        title: evento.nome, // Apenas o nome do evento
        start: new Date(`${evento.data_evento}T14:00:00`),
        end: new Date(`${evento.data_evento}T18:00:00`),
        resource: {
          status: evento.status,
          artista: evento.artista,
          genero: evento.genero,
          tipo_evento: evento.tipo_evento,
          nome: evento.nome
        }
      }))
      
      setCalendarEvents(events)
      console.log('✅ [CALENDARIO] Eventos convertidos:', events.length)
      
      // Gerar lista de meses com dados
      const mesesComEventos = new Map<string, { mes: number; ano: number; quantidade: number }>()
      
      events.forEach(event => {
        const mes = getMonth(event.start)
        const ano = getYear(event.start)
        const key = `${ano}-${mes}`
        
        if (mesesComEventos.has(key)) {
          mesesComEventos.get(key)!.quantidade++
        } else {
          mesesComEventos.set(key, { mes, ano, quantidade: 1 })
        }
      })
      
      const mesesOrdenados = Array.from(mesesComEventos.entries())
        .map(([key, data]) => ({
          mes: data.mes,
          ano: data.ano,
          nome: `${meses[data.mes]} ${data.ano}`,
          quantidade: data.quantidade
        }))
        .sort((a, b) => {
          if (a.ano !== b.ano) return a.ano - b.ano
          return a.mes - b.mes
        })
      
      setMesesComDados(mesesOrdenados)
      console.log('📅 [CALENDARIO] Meses com dados:', mesesOrdenados)
      
      // Se não há eventos carregados, manter data atual
      if (events.length > 0) {
        const primeiroEvento = events[0]
        setCurrentDate(primeiroEvento.start)
        setSelectedMonth(getMonth(primeiroEvento.start))
        setSelectedYear(getYear(primeiroEvento.start))
      }
      
    } catch (error) {
      console.error('❌ [CALENDARIO] Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [filtroStatus, filtroGenero])

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
    setSelectedMonth(getMonth(date))
    setSelectedYear(getYear(date))
  }

  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="space-y-1">
      {/* Nome do evento */}
      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
        {event.resource.nome}
      </div>
      
      {/* Artista com ícone do gênero */}
      {event.resource.artista && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex-shrink-0">
            {getGeneroIcon(event.resource.genero)}
          </span>
          <span className="truncate">
            {event.resource.artista}
          </span>
        </div>
      )}
    </div>
  )

  const eventPropGetter = (event: CalendarEvent) => {
    const baseStyle = {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      padding: '4px 6px',
      margin: '1px 0',
      fontSize: '11px',
      fontWeight: '500',
      position: 'relative' as const
    }

    const status = event.resource.status.toLowerCase()

    // Apenas borda sutil baseada no status
    switch (status) {
      case 'confirmado':
        return {
          style: {
            ...baseStyle,
            borderLeft: '3px solid #10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)'
          },
          'data-status': 'confirmado'
        }
      case 'pendente':
        return {
          style: {
            ...baseStyle,
            borderLeft: '3px solid #f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.05)'
          },
          'data-status': 'pendente'
        }
      case 'cancelado':
        return {
          style: {
            ...baseStyle,
            borderLeft: '3px solid #ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)'
          },
          'data-status': 'cancelado'
        }
      default:
        return {
          style: {
            ...baseStyle,
            borderLeft: '3px solid #6b7280',
            backgroundColor: 'rgba(107, 114, 128, 0.05)'
          },
          'data-status': 'pendente'
        }
    }
  }

  const dayPropGetter = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return {
        style: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px'
        }
      }
    }
    return {}
  }

  const limparFiltros = () => {
    setFiltroStatus('todos')
    setFiltroGenero('todos')
  }

  const eventosConfirmados = eventos.filter(e => e.status.toLowerCase() === 'confirmado').length
  const eventosPendentes = eventos.filter(e => e.status.toLowerCase() === 'pendente').length
  const eventosCancelados = eventos.filter(e => e.status.toLowerCase() === 'cancelado').length

  // Componente personalizado para o toolbar do calendário
  const CustomToolbar = (toolbar: any) => {
    const goToPrev = () => {
      const date = new Date(toolbar.date)
      date.setMonth(date.getMonth() - 1)
      toolbar.onNavigate('prev', date)
    }

    const goToNext = () => {
      const date = new Date(toolbar.date)
      date.setMonth(date.getMonth() + 1)
      toolbar.onNavigate('next', date)
    }

    const goToCurrent = () => {
      const now = new Date()
      toolbar.onNavigate('current', now)
    }

    const currentMonth = format(toolbar.date, 'MMMM yyyy', { locale: ptBR })

    return (
      <div className="rbc-toolbar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={goToCurrent} variant="outline" size="sm">
            Hoje
          </Button>
          <Button onClick={goToPrev} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={goToNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {currentMonth}
          </span>
          
          {/* Seletor de mês com dados */}
          <Select 
            value={`${getYear(toolbar.date)}-${getMonth(toolbar.date)}`} 
            onValueChange={(value) => {
              const [ano, mes] = value.split('-').map(Number)
              const newDate = new Date(ano, mes, 1)
              toolbar.onNavigate('current', newDate)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um mês" />
            </SelectTrigger>
            <SelectContent>
              {mesesComDados.map((mes) => (
                <SelectItem key={`${mes.ano}-${mes.mes}`} value={`${mes.ano}-${mes.mes}`}>
                  {mes.nome} ({mes.quantidade} eventos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Calendário de Eventos
              </h1>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Eventos</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{eventos.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confirmados</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{eventosConfirmados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{eventosPendentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cancelados</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{eventosCancelados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </div>
                {filtrosAbertos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gênero
                    </label>
                    <Select value={filtroGenero} onValueChange={setFiltroGenero}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os gêneros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os gêneros</SelectItem>
                        <SelectItem value="DJ">DJ</SelectItem>
                        <SelectItem value="Samba">Samba</SelectItem>
                        <SelectItem value="Pagode">Pagode</SelectItem>
                        <SelectItem value="Jazz">Jazz</SelectItem>
                        <SelectItem value="Sertanejo">Sertanejo</SelectItem>
                        <SelectItem value="Cubana">Cubana</SelectItem>
                        <SelectItem value="Vocal">Vocal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={limparFiltros} variant="outline" className="w-full">
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Calendário */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Carregando eventos...</p>
                </div>
              </div>
            ) : (
              <div className="modern-calendar">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  date={currentDate}
                  onNavigate={handleDateChange}
                  views={['month']}
                  defaultView="month"
                  components={{
                    event: EventComponent,
                    toolbar: CustomToolbar
                  }}
                  eventPropGetter={eventPropGetter}
                  dayPropGetter={dayPropGetter}
                  messages={{
                    next: "Próximo",
                    previous: "Anterior",
                    today: "Hoje",
                    month: "Mês",
                    noEventsInRange: "Não há eventos neste período."
                  }}
                  culture="pt-BR"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Legenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status dos Eventos</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confirmado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pendente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cancelado</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Gêneros Musicais</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🎧</span>
                    <span className="text-gray-600 dark:text-gray-400">DJ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎵</span>
                    <span className="text-gray-600 dark:text-gray-400">Samba</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎸</span>
                    <span className="text-gray-600 dark:text-gray-400">Pagode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎷</span>
                    <span className="text-gray-600 dark:text-gray-400">Jazz</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎤</span>
                    <span className="text-gray-600 dark:text-gray-400">Sertanejo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🥁</span>
                    <span className="text-gray-600 dark:text-gray-400">Cubana</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
