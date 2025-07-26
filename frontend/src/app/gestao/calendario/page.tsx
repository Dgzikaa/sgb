'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import 'react-big-calendar/lib/css/react-big-calendar.css'

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
  artista: string
  genero: string
  status: string
  tipo_evento: string
  observacoes?: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: Evento
}

// Função para definir cor baseada no status
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmado':
      return 'bg-green-500 text-white'
    case 'pendente':
      return 'bg-yellow-500 text-black'
    case 'cancelado':
      return 'bg-red-500 text-white'
    case 'adiado':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-blue-500 text-white'
  }
}

// Função para definir cor baseada no gênero
const getGeneroColor = (genero: string) => {
  switch (genero?.toLowerCase()) {
    case 'samba':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'pagode':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'dj':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'jazz':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'sertanejo':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'cubana':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'vocal':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')

  // Carregar eventos
  const carregarEventos = async () => {
    try {
      setLoading(true)
      
      // Construir URL com filtros
      const params = new URLSearchParams()
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)
      if (statusFiltro) params.append('status', statusFiltro)
      if (generoFiltro) params.append('genero', generoFiltro)
      
      const response = await fetch(`/api/gestao/eventos?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos')
      }
      
      const data = await response.json()
      setEventos(data.eventos || [])
      
      // Converter eventos para formato do calendário
      const calEvents: CalendarEvent[] = data.eventos.map((evento: Evento) => ({
        id: evento.id,
        title: evento.nome,
        start: new Date(`${evento.data_evento}T09:00:00`),
        end: new Date(`${evento.data_evento}T23:59:59`),
        resource: evento
      }))
      
      setCalendarEvents(calEvents)
      
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [dataInicio, dataFim, statusFiltro, generoFiltro])

  // Componente customizado para eventos no calendário
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { resource } = event
    return (
      <div className="text-xs p-1 rounded overflow-hidden">
        <div className="font-semibold truncate">{resource.nome}</div>
        {resource.artista && (
          <div className="text-gray-600 dark:text-gray-400 truncate">{resource.artista}</div>
        )}
        <div className="flex gap-1 mt-1">
          <Badge 
            variant="secondary" 
            className={`text-xs px-1 py-0 ${getStatusColor(resource.status)}`}
          >
            {resource.status}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs px-1 py-0 ${getGeneroColor(resource.genero)}`}
          >
            {resource.genero}
          </Badge>
        </div>
      </div>
    )
  }

  // Limpar filtros
  const limparFiltros = () => {
    setDataInicio('')
    setDataFim('')
    setStatusFiltro('')
    setGeneroFiltro('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Card className="card-dark">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <CardTitle className="card-title-dark">Calendário de Eventos</CardTitle>
              </div>
              
              {/* Filtros Colapsáveis */}
              <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                    {filtrosAbertos ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="absolute right-0 top-full mt-2 z-10 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Data Início
                      </label>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Data Fim
                      </label>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Status
                      </label>
                      <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="adiado">Adiado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Gênero
                      </label>
                      <Select value={generoFiltro} onValueChange={setGeneroFiltro}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="Samba">Samba</SelectItem>
                          <SelectItem value="Pagode">Pagode</SelectItem>
                          <SelectItem value="DJ">DJ</SelectItem>
                          <SelectItem value="Jazz">Jazz</SelectItem>
                          <SelectItem value="Sertanejo">Sertanejo</SelectItem>
                          <SelectItem value="Cubana">Cubana</SelectItem>
                          <SelectItem value="Vocal">Vocal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={limparFiltros}>
                      Limpar
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="h-[calc(100vh-300px)] min-h-[600px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="pt-BR"
                messages={{
                  next: 'Próximo',
                  previous: 'Anterior',
                  today: 'Hoje',
                  month: 'Mês',
                  week: 'Semana',
                  day: 'Dia',
                  agenda: 'Agenda',
                  date: 'Data',
                  time: 'Hora',
                  event: 'Evento',
                  noEventsInRange: 'Não há eventos neste período',
                  showMore: (total) => `+ Ver mais (${total})`
                }}
                components={{
                  event: EventComponent
                }}
                style={{
                  height: '100%',
                  fontFamily: 'Inter, sans-serif'
                }}
                className="calendar-dark"
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }
                })}
                dayPropGetter={(date) => ({
                  style: {
                    backgroundColor: 'transparent'
                  }
                })}
              />
            </div>
            
            {/* Legenda */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legenda</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Status</h5>
                  <div className="flex flex-col gap-1">
                    <Badge className="bg-green-500 text-white text-xs w-fit">Confirmado</Badge>
                    <Badge className="bg-yellow-500 text-black text-xs w-fit">Pendente</Badge>
                    <Badge className="bg-red-500 text-white text-xs w-fit">Cancelado</Badge>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gêneros</h5>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="bg-green-100 text-green-800 text-xs w-fit">Samba</Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs w-fit">Pagode</Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs w-fit">DJ</Badge>
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
