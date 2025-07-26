"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Music, Calendar as CalendarIcon, Filter, Users, TrendingUp } from 'lucide-react'

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
  artista: string
  genero: string
  tipo_evento: string
  observacoes: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    status: string
    artista: string
    genero: string
    tipo_evento: string
  }
}

// Função para obter ícone do gênero
const getGeneroIcon = (genero: string) => {
  switch (genero.toLowerCase()) {
    case 'dj':
      return '🎧'
    case 'samba':
      return '🎵'
    case 'pagode':
      return '🎸'
    case 'jazz':
      return '🎷'
    case 'sertanejo':
      return '🎤'
    case 'cubana':
      return '🥁'
    case 'vocal':
      return '🎭'
    default:
      return '🎶'
  }
}

// Função para obter cor do status (mais sutil e profissional)
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmado':
      return {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400'
      }
    case 'pendente':
      return {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
        text: 'text-amber-400'
      }
    case 'cancelado':
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400'
      }
    default:
      return {
        bg: 'bg-slate-500/20',
        border: 'border-slate-500/30',
        text: 'text-slate-400'
      }
  }
}

// Função para obter cor do gênero (mais sutil)
const getGeneroColor = (genero: string) => {
  switch (genero.toLowerCase()) {
    case 'dj':
      return 'text-purple-400'
    case 'samba':
      return 'text-yellow-400'
    case 'pagode':
      return 'text-orange-400'
    case 'jazz':
      return 'text-blue-400'
    case 'sertanejo':
      return 'text-green-400'
    case 'cubana':
      return 'text-red-400'
    case 'vocal':
      return 'text-pink-400'
    default:
      return 'text-gray-400'
  }
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedGenero, setSelectedGenero] = useState<string>('')

  const carregarEventos = async () => {
    try {
      console.log('🔄 Carregando eventos...')
      const response = await fetch('/api/gestao/eventos')
      const data = await response.json()
      
      console.log('📊 Eventos carregados:', data.eventos?.length || 0)
      setEventos(data.eventos || [])
      
      // Converter eventos para formato do calendário
      const events = (data.eventos || []).map((evento: Evento) => {
        const startDate = new Date(evento.data_evento + 'T14:00:00')
        const endDate = new Date(evento.data_evento + 'T18:00:00')
        
        return {
          id: evento.id,
          title: evento.artista ? `${evento.nome} - ${evento.artista}` : evento.nome,
          start: startDate,
          end: endDate,
          resource: {
            status: evento.status,
            artista: evento.artista,
            genero: evento.genero,
            tipo_evento: evento.tipo_evento
          }
        }
      })
      
      console.log('📅 Eventos convertidos:', events.length)
      setCalendarEvents(events)
      
      // Navegar para o primeiro evento se houver
      if (events.length > 0) {
        setCurrentDate(events[0].start)
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [])

  // Componente personalizado para eventos
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const statusColors = getStatusColor(event.resource.status)
    const generoColors = getGeneroColor(event.resource.genero)
    const generoIcon = getGeneroIcon(event.resource.genero)
    
    return (
      <div className={`
        p-2 rounded-lg border transition-all duration-200 hover:scale-105
        ${statusColors.bg} ${statusColors.border} ${statusColors.text}
        backdrop-blur-sm shadow-lg
      `}>
        <div className="font-semibold text-sm mb-1 truncate">
          {event.title}
        </div>
        {event.resource.genero && (
          <div className={`text-xs flex items-center gap-1 ${generoColors}`}>
            <span>{generoIcon}</span>
            <span>{event.resource.genero}</span>
          </div>
        )}
      </div>
    )
  }

  // Propriedades personalizadas para eventos
  const eventPropGetter = (event: CalendarEvent) => {
    const statusColors = getStatusColor(event.resource.status)
    return {
      className: `${statusColors.bg} ${statusColors.border} ${statusColors.text}`,
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '4px',
        margin: '1px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  }

  // Propriedades personalizadas para dias
  const dayPropGetter = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    return {
      className: isToday ? 'bg-blue-500/10 border-2 border-blue-500/30' : '',
      style: {
        backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: isToday ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
        borderRadius: isToday ? '8px' : '0'
      }
    }
  }

  // Filtrar eventos
  const filteredEvents = calendarEvents.filter(event => {
    if (selectedStatus && event.resource.status !== selectedStatus) return false
    if (selectedGenero && event.resource.genero !== selectedGenero) return false
    return true
  })

  // Estatísticas
  const totalEventos = eventos.length
  const eventosConfirmados = eventos.filter(e => e.status === 'confirmado').length
  const generosUnicos = [...new Set(eventos.map(e => e.genero).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Carregando calendário...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-blue-400" />
                Calendário de Eventos
              </h1>
              <p className="text-gray-400 text-lg">
                Gerencie e visualize todos os eventos do bar
              </p>
            </div>
            
            {/* Estatísticas */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">{totalEventos}</span>
                  <span className="text-gray-400 text-sm">Total</span>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">{eventosConfirmados}</span>
                  <span className="text-gray-400 text-sm">Confirmados</span>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold">{generosUnicos.length}</span>
                  <span className="text-gray-400 text-sm">Gêneros</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader className="pb-4">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between p-0 h-auto text-white hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-400" />
                    <span className="text-lg font-semibold">Filtros</span>
                  </div>
                  {filtersOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos os status</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="pendente">Pendente</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gênero</label>
                    <select
                      value={selectedGenero}
                      onChange={(e) => setSelectedGenero(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos os gêneros</option>
                      {generosUnicos.map(genero => (
                        <option key={genero} value={genero}>{genero}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 flex items-end">
                    <Button
                      onClick={() => {
                        setSelectedStatus('')
                        setSelectedGenero('')
                      }}
                      variant="outline"
                      className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Calendário */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-6">
            <div className="modern-calendar">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                views={['month']}
                defaultView="month"
                date={currentDate}
                onNavigate={setCurrentDate}
                components={{
                  event: EventComponent
                }}
                eventPropGetter={eventPropGetter}
                dayPropGetter={dayPropGetter}
                messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  agenda: "Agenda",
                  noEventsInRange: "Não há eventos neste período."
                }}
                culture="pt-BR"
              />
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="mt-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Legenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
                <span className="text-gray-300 text-sm">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500/20 border border-amber-500/30 rounded"></div>
                <span className="text-gray-300 text-sm">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded"></div>
                <span className="text-gray-300 text-sm">Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/10 border-2 border-blue-500/30 rounded"></div>
                <span className="text-gray-300 text-sm">Hoje</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <h4 className="text-white font-semibold mb-2">Gêneros Musicais:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {generosUnicos.map(genero => (
                  <div key={genero} className="flex items-center gap-2">
                    <span className={getGeneroColor(genero)}>{getGeneroIcon(genero)}</span>
                    <span className="text-gray-300 text-sm">{genero}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
