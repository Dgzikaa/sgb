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
import * as SelectPrimitive from '@radix-ui/react-select'
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
  dia_semana?: string
  semana?: number
  artista?: string
  genero?: string
  observacoes?: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    artista?: string
    genero?: string
    observacoes?: string
    nome: string
    dia_semana?: string
    semana?: number
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
  // Estado para o calendário - sempre inicia no mês atual
  const [currentDate, setCurrentDate] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1) // Primeiro dia do mês atual
  })
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    genero: 'todos'
  })
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const carregarEventos = async () => {
    try {
      setLoading(true)
      console.log('🔄 [CALENDARIO] Carregando eventos...')
      
      const params = new URLSearchParams()
      if (filtros.genero && filtros.genero !== 'todos') params.append('genero', filtros.genero)
      
      const response = await fetch(`/api/gestao/eventos?${params}`)
      const data = await response.json()
      
      console.log('📊 [CALENDARIO] Eventos carregados:', data.eventos.length)
      console.log('🔍 [CALENDARIO] Eventos de Julho 2025:', data.eventos.filter((e: Evento) => e.data_evento.startsWith('2025-07')))
      console.log('🔍 [CALENDARIO] Eventos das datas específicas:', data.eventos.filter((e: Evento) => 
        ['2025-07-25', '2025-07-26', '2025-07-28', '2025-07-30', '2025-07-31'].includes(e.data_evento)
      ))
      
      // Converter eventos para formato do calendário
      const events = data.eventos.map((evento: Evento) => ({
        id: evento.id,
        title: evento.nome, // Apenas o nome do evento
        start: new Date(`${evento.data_evento}T14:00:00`),
        end: new Date(`${evento.data_evento}T18:00:00`),
        resource: {
          artista: evento.artista,
          genero: evento.genero,
          observacoes: evento.observacoes,
          nome: evento.nome,
          dia_semana: evento.dia_semana,
          semana: evento.semana
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
      
      // Manter sempre o mês atual, independente dos eventos
      // Não alterar currentDate aqui para preservar o mês atual
      
    } catch (error) {
      console.error('❌ [CALENDARIO] Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [filtros.genero])

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex flex-col justify-start pt-1 space-y-1">
      {/* Nome do evento */}
      <div className="text-xs font-medium text-gray-900 dark:text-white truncate leading-tight">
        {event.resource.nome}
      </div>
      
      {/* Artista com ícone do gênero */}
      {event.resource.artista && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex-shrink-0">
            {getGeneroIcon(event.resource.genero)}
          </span>
          <span className="truncate leading-tight">
            {event.resource.artista}
          </span>
        </div>
      )}
    </div>
  )

  const eventPropGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '6px',
        padding: '4px 6px',
        margin: '1px 0',
        fontSize: '11px',
        fontWeight: '500',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'flex-start'
      }
    }
  }

  const dayPropGetter = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    // Verificar se há eventos neste dia
    const dayEvents = calendarEvents.filter(event => 
      event.start.toDateString() === date.toDateString()
    )
    
    const hasEvents = dayEvents.length > 0
    const genero = hasEvents ? dayEvents[0]?.resource.genero?.toLowerCase() : null
    
    const baseProps: any = {
      'data-has-events': hasEvents.toString()
    }
    
    if (genero) {
      baseProps['data-genero'] = genero
    }
    
    if (isToday) {
      return {
        style: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px'
        },
        ...baseProps
      }
    }
    
    return baseProps
  }

  const limparFiltros = () => {
    setFiltros({
      genero: 'todos'
    })
  }

  // Removidas estatísticas de status pois não temos mais essa informação
  const totalEventos = calendarEvents.length

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

    const currentMonth = format(toolbar.date, 'MMMM yyyy', { locale: ptBR })
    const currentMonthEvents = calendarEvents.filter(event => 
      getMonth(event.start) === getMonth(toolbar.date) && 
      getYear(event.start) === getYear(toolbar.date)
    ).length

    return (
      <div className="rbc-toolbar flex items-center justify-between">
        {/* Seletor de mês/ano isolado na esquerda */}
        <div className="flex items-center">
          <Select 
            value={`${getYear(toolbar.date)}-${getMonth(toolbar.date)}`} 
            onValueChange={(value) => {
              const [ano, mes] = value.split('-').map(Number)
              const newDate = new Date(ano, mes, 1)
              toolbar.onNavigate('current', newDate)
            }}
          >
            <SelectPrimitive.Trigger className="w-48 flex h-10 items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              <div className="flex items-center justify-between w-full">
                <SelectValue placeholder="Selecione um mês" />
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-2" />
              </div>
            </SelectPrimitive.Trigger>
            <SelectContent>
              {mesesComDados.map((mes) => (
                <SelectItem key={`${mes.ano}-${mes.mes}`} value={`${mes.ano}-${mes.mes}`}>
                  {mes.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navegação com setas centralizada */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <Button onClick={goToPrev} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {currentMonth}
          </span>
          <Button onClick={goToNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Contador de eventos no extremo direito */}
        <div className="flex items-center justify-end w-48">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentMonthEvents} eventos
          </span>
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
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{calendarEvents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Eventos</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalEventos}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Samba/Pagode</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {calendarEvents.filter(e => e.resource.genero?.toLowerCase() === 'samba' || e.resource.genero?.toLowerCase() === 'pagode').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">DJ</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {calendarEvents.filter(e => e.resource.genero?.toLowerCase() === 'dj').length}
                    </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gênero
                    </label>
                    <Select value={filtros.genero} onValueChange={(value) => setFiltros(prev => ({ ...prev, genero: value }))}>
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
      </div>
    </div>
  )
}
