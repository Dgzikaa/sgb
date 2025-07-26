'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, Filter, Users, Music, MapPin } from 'lucide-react'
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
      return 'bg-emerald-500 text-white border-emerald-600'
    case 'pendente':
      return 'bg-amber-500 text-white border-amber-600'
    case 'cancelado':
      return 'bg-red-500 text-white border-red-600'
    case 'adiado':
      return 'bg-orange-500 text-white border-orange-600'
    default:
      return 'bg-blue-500 text-white border-blue-600'
  }
}

// Função para definir cor baseada no gênero
const getGeneroColor = (genero: string) => {
  switch (genero?.toLowerCase()) {
    case 'samba':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
    case 'pagode':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    case 'dj':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
    case 'jazz':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
    case 'sertanejo':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
    case 'cubana':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
    case 'vocal':
      return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
  }
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date()) // Data atual
  
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
      
      const urlFinal = `/api/gestao/eventos?${params.toString()}`
      console.log('🔍 URL da requisição:', urlFinal)
      
      const response = await fetch(urlFinal)
      
      if (!response.ok) {
        console.error('❌ Erro na resposta:', response.status, response.statusText)
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📅 Resposta da API:', data)
      console.log('📊 Total de eventos recebidos:', data.eventos?.length || 0)
      
      if (data.eventos && Array.isArray(data.eventos)) {
        setEventos(data.eventos)
        
        // Converter eventos para formato do calendário
        const calEvents: CalendarEvent[] = data.eventos.map((evento: Evento) => {
          console.log('🔄 Convertendo evento:', evento.nome, evento.data_evento)
          
          // Criar data corretamente
          const eventDate = new Date(evento.data_evento + 'T14:00:00') // 14h
          const endDate = new Date(evento.data_evento + 'T18:00:00')   // 18h
          
          console.log('📅 Data convertida:', eventDate, 'para evento:', evento.nome)
          
          return {
            id: evento.id,
            title: `${evento.nome}${evento.artista ? ` - ${evento.artista}` : ''}`,
            start: eventDate,
            end: endDate,
            resource: evento
          }
        })
        
        console.log('📊 Eventos convertidos para calendário:', calEvents.length)
        console.log('🎯 Primeiro evento:', calEvents[0])
        setCalendarEvents(calEvents)
        
        // Se há eventos, navegar para o mês do primeiro evento
        if (calEvents.length > 0) {
          const primeiroEvento = calEvents[0].start
          console.log('🎯 Navegando para data do primeiro evento:', primeiroEvento)
          setCurrentDate(primeiroEvento)
        }
      } else {
        console.warn('⚠️ Dados de eventos inválidos:', data)
        setEventos([])
        setCalendarEvents([])
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error)
      setEventos([])
      setCalendarEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 Iniciando carregamento de eventos...')
    carregarEventos()
  }, [dataInicio, dataFim, statusFiltro, generoFiltro])

  // Componente customizado para eventos no calendário
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { resource } = event
    return (
      <div className="w-full h-full p-1 rounded-md overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
        <div className="text-xs font-bold truncate">{resource.nome}</div>
        {resource.artista && (
          <div className="text-xs opacity-90 truncate mt-0.5 flex items-center gap-1">
            <Music className="w-2.5 h-2.5 flex-shrink-0" />
            {resource.artista}
          </div>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <Badge 
            variant="secondary" 
            className={`text-xs px-1 py-0 h-4 ${getGeneroColor(resource.genero)}`}
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

  // Debug do estado atual
  console.log('🔍 Estado atual:', {
    eventos: eventos.length,
    calendarEvents: calendarEvents.length,
    currentDate,
    loading
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg"></div>
              <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl"></div>
            </div>
            <div className="text-center mt-4 text-gray-600 dark:text-gray-400">
              Carregando eventos...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header Melhorado */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Calendário de Eventos
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {eventos.length} eventos encontrados | {calendarEvents.length} visíveis
                  </p>
                </div>
              </div>
              
              {/* Filtros Colapsáveis Melhorados */}
              <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex items-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Filter className="w-5 h-5" />
                    Filtros
                    {filtrosAbertos ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="absolute right-0 top-full mt-4 z-20 w-96">
                  <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-blue-600" />
                      Filtrar Eventos
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          📅 Data Início
                        </label>
                        <Input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          📅 Data Fim
                        </label>
                        <Input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          🎯 Status
                        </label>
                        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                          <SelectTrigger className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg">
                            <SelectValue placeholder="Todos os status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            <SelectItem value="confirmado">✅ Confirmado</SelectItem>
                            <SelectItem value="pendente">⏳ Pendente</SelectItem>
                            <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                            <SelectItem value="adiado">⏰ Adiado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          🎵 Gênero
                        </label>
                        <Select value={generoFiltro} onValueChange={setGeneroFiltro}>
                          <SelectTrigger className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg">
                            <SelectValue placeholder="Todos os gêneros" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            <SelectItem value="Samba">🥁 Samba</SelectItem>
                            <SelectItem value="Pagode">🎤 Pagode</SelectItem>
                            <SelectItem value="DJ">🎧 DJ</SelectItem>
                            <SelectItem value="Jazz">🎺 Jazz</SelectItem>
                            <SelectItem value="Sertanejo">🤠 Sertanejo</SelectItem>
                            <SelectItem value="Cubana">💃 Cubana</SelectItem>
                            <SelectItem value="Vocal">🎵 Vocal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" size="sm" onClick={limparFiltros} className="border-2">
                        🗑️ Limpar
                      </Button>
                      <Button size="sm" onClick={() => setFiltrosAbertos(false)} className="bg-blue-600 hover:bg-blue-700">
                        ✨ Aplicar
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
        
        {/* Calendário Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="h-[calc(100vh-400px)] min-h-[700px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="pt-BR"
                date={currentDate}
                onNavigate={(date) => {
                  console.log('📅 Navegação para:', date)
                  setCurrentDate(date)
                }}
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
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                className="calendar-dark modern-calendar"
                eventPropGetter={(event) => {
                  const status = event.resource.status?.toLowerCase()
                  let backgroundColor = '#3b82f6'
                  
                  switch (status) {
                    case 'confirmado':
                      backgroundColor = '#10b981'
                      break
                    case 'pendente':
                      backgroundColor = '#f59e0b'
                      break
                    case 'cancelado':
                      backgroundColor = '#ef4444'
                      break
                    case 'adiado':
                      backgroundColor = '#f97316'
                      break
                  }
                  
                  return {
                    style: {
                      backgroundColor,
                      borderColor: backgroundColor,
                      color: 'white',
                      border: '2px solid',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '2px 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }
                }}
                dayPropGetter={(date) => {
                  const today = new Date()
                  const isToday = date.toDateString() === today.toDateString()
                  
                  return {
                    style: {
                      backgroundColor: isToday ? '#dbeafe' : 'transparent',
                      borderRadius: isToday ? '8px' : '0'
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Legenda Melhorada */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-slate-800 border-t border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🏷️ Legenda de Cores
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                  🎯 Status dos Eventos
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Confirmado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pendente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Cancelado</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                  🎵 Gêneros Musicais
                </h5>
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    🥁 Samba
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    🎤 Pagode
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                    🎧 DJ
                  </Badge>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                  📊 Estatísticas
                </h5>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>Total BD: {eventos.length} eventos</div>
                  <div>Calendário: {calendarEvents.length} eventos</div>
                  <div>Mês atual: {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
