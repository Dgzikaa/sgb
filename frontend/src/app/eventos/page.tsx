'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Eye,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evento {
  id: number;
  nome: string;
  data: string;
  hora: string;
  local: string;
  descricao?: string;
  status: string;
  categoria: string;
  capacidade: number;
  ingressos_vendidos: number;
  preco: number;
  organizador: string;
  created_at: string;
  updated_at: string;
}

interface CategoriaEvento {
  id: string;
  nome: string;
  cor: string;
  icon: string;
}

const categoriasPadrao: CategoriaEvento[] = [
  { id: 'show', nome: 'Show/Música', cor: 'bg-purple-500', icon: '🎵' },
  { id: 'festa', nome: 'Festa Temática', cor: 'bg-pink-500', icon: '🎉' },
  { id: 'happy-hour', nome: 'Happy Hour', cor: 'bg-orange-500', icon: '🍻' },
  { id: 'esporte', nome: 'Evento Esportivo', cor: 'bg-green-500', icon: '⚽' },
  { id: 'gastronomia', nome: 'Gastronomia', cor: 'bg-yellow-500', icon: '🍽️' },
  { id: 'networking', nome: 'Networking', cor: 'bg-blue-500', icon: '🤝' },
  { id: 'promocao', nome: 'Promoção', cor: 'bg-red-500', icon: '🏷️' },
  { id: 'especial', nome: 'Data Especial', cor: 'bg-indigo-500', icon: '🌟' },
];

export default function EventosPage() {
  const { toast } = useToast();
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    setPageTitle('Eventos & Planejamento');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const loadEventos = useCallback(async () => {
    if (!selectedBar) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/eventos?bar_id=${selectedBar.id}&ano=${currentDate.getFullYear()}&mes=${currentDate.getMonth() + 1}`
      );
      const data = await response.json();

      if (data.success) {
        setEventos(data.data || []);
      } else {
        console.error('Erro ao carregar eventos:', data.error);
        toast({
          title: '❌ Erro',
          description: 'Falha ao carregar eventos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar eventos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, currentDate, toast]);

  useEffect(() => {
    if (selectedBar) {
      loadEventos();
    }
  }, [loadEventos, selectedBar]);

  const saveEvento = async (evento: Partial<Evento>) => {
    if (!selectedBar) return;

    try {
      setLoading(true);

      const eventoData = {
        ...evento,
        bar_id: selectedBar.id,
      };

      const response = await fetch('/api/eventos', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingEvent ? { id: editingEvent.id, ...eventoData } : [eventoData]
        ),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Sucesso',
          description: editingEvent ? 'Evento atualizado!' : 'Evento criado!',
        });
        setShowEventModal(false);
        setEditingEvent(null);
        loadEventos();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: '❌ Erro',
        description: 'Falha ao salvar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvento = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/eventos?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Sucesso',
          description: 'Evento deletado!',
        });
        loadEventos();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: '❌ Erro',
        description: 'Falha ao deletar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoria = (categoriaId: string) => {
    return (
      categoriasPadrao.find(cat => cat.id === categoriaId) ||
      categoriasPadrao[0]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'planejado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'concluido':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredEventos = eventos.filter(evento => {
    const matchesCategoria =
      filtroCategoria === 'all' || evento.categoria === filtroCategoria;
    const matchesStatus =
      filtroStatus === 'all' || evento.status === filtroStatus;
    const matchesSearch =
      searchTerm === '' ||
      evento.nome_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategoria && matchesStatus && matchesSearch;
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(
      direction === 'prev'
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Eventos & Planejamento
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie e planeje os eventos do seu bar
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="text-xs"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Calendário
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-xs"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Lista
                </Button>
              </div>

              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>

              <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                    </DialogTitle>
                  </DialogHeader>
                  <EventForm
                    evento={editingEvent}
                    onSave={saveEvento}
                    onCancel={() => {
                      setShowEventModal(false);
                      setEditingEvent(null);
                    }}
                    categorias={categoriasPadrao}
                    loading={loading}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Buscar eventos
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Nome, descrição..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Categoria
                  </Label>
                  <Select
                    value={filtroCategoria}
                    onValueChange={setFiltroCategoria}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categoriasPadrao.map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.icon} {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="planejado">Planejado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setFiltroCategoria('all');
                      setFiltroStatus('all');
                      setSearchTerm('');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendário ou Lista */}
          {viewMode === 'calendar' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CalendarView
                  currentDate={currentDate}
                  eventos={filteredEventos}
                  onEditEvent={evento => {
                    setEditingEvent(evento);
                    setShowEventModal(true);
                  }}
                  onDeleteEvent={deleteEvento}
                  categorias={categoriasPadrao}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <EventList
                  eventos={filteredEventos}
                  onEditEvent={evento => {
                    setEditingEvent(evento);
                    setShowEventModal(true);
                  }}
                  onDeleteEvent={deleteEvento}
                  categorias={categoriasPadrao}
                />
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventos.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total do Mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventos.filter(e => e.status === 'confirmado').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirmados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventos.filter(e => e.status === 'planejado').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Planejados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(eventos.map(e => e.categoria)).size}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Categorias
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente do formulário de evento
function EventForm({
  evento,
  onSave,
  onCancel,
  categorias,
  loading,
}: {
  evento: Evento | null;
  onSave: (evento: Partial<Evento>) => void;
  onCancel: () => void;
  categorias: CategoriaEvento[];
  loading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Evento>>({
    nome_evento: '',
    descricao: '',
    data_evento: '',
    hora_inicio: '',
    hora_fim: '',
    categoria: 'show',
    local: '',
    capacidade_maxima: undefined,
    preco: undefined,
    status: 'planejado',
  });

  useEffect(() => {
    if (evento) {
      setFormData({
        ...evento,
        data_evento: evento.data_evento.split('T')[0],
        hora_inicio: evento.hora_inicio || '',
        hora_fim: evento.hora_fim || '',
      });
    }
  }, [evento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="nome_evento">Nome do Evento *</Label>
          <Input
            id="nome_evento"
            value={formData.nome_evento}
            onChange={e =>
              setFormData({ ...formData, nome_evento: e.target.value })
            }
            placeholder="Ex: Show de Rock, Happy Hour..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={e =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            placeholder="Descreva o evento..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="data_evento">Data *</Label>
          <Input
            id="data_evento"
            type="date"
            value={formData.data_evento}
            onChange={e =>
              setFormData({ ...formData, data_evento: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={formData.categoria}
            onValueChange={value =>
              setFormData({ ...formData, categoria: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categorias.map(categoria => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.icon} {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hora_inicio">Hora de Início</Label>
          <Input
            id="hora_inicio"
            type="time"
            value={formData.hora_inicio}
            onChange={e =>
              setFormData({ ...formData, hora_inicio: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="hora_fim">Hora de Fim</Label>
          <Input
            id="hora_fim"
            type="time"
            value={formData.hora_fim}
            onChange={e =>
              setFormData({ ...formData, hora_fim: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: string) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planejado">Planejado</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="local">Local</Label>
          <Input
            id="local"
            value={formData.local}
            onChange={e => setFormData({ ...formData, local: e.target.value })}
            placeholder="Ex: Salão Principal..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Salvando...' : 'Salvar Evento'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// Componente do calendário
function CalendarView({
  currentDate,
  eventos,
  onEditEvent,
  onDeleteEvent,
  categorias,
}: {
  currentDate: Date;
  eventos: Evento[];
  onEditEvent: (evento: Evento) => void;
  onDeleteEvent: (id: number) => void;
  categorias: CategoriaEvento[];
}) {
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventosForDay = (day: Date) => {
    return eventos.filter(evento => isSameDay(new Date(evento.data), day));
  };

  const getCategoria = (categoriaId: string) => {
    return categorias.find(cat => cat.id === categoriaId) || categorias[0];
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Cabeçalho dos dias da semana */}
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
        <div
          key={day}
          className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          {day}
        </div>
      ))}

      {/* Dias do mês */}
      {days.map(day => {
        const dayEvents = getEventosForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className={`
              min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg
              ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}
              ${isCurrentDay ? 'ring-2 ring-purple-500' : ''}
            `}
          >
            <div
              className={`
              text-sm font-medium mb-1
              ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
              ${isCurrentDay ? 'text-purple-600 dark:text-purple-400' : ''}
            `}
            >
              {format(day, 'd')}
            </div>

            <div className="space-y-1">
              {dayEvents.slice(0, 2).map(evento => {
                const categoria = getCategoria(evento.categoria);
                return (
                  <div
                    key={evento.id}
                    className={`
                      px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity
                      ${categoria.cor} text-white
                    `}
                    onClick={() => onEditEvent(evento)}
                    title={evento.nome_evento}
                  >
                    <div className="flex items-center gap-1">
                      <span>{categoria.icon}</span>
                      <span className="truncate">{evento.nome_evento}</span>
                    </div>
                  </div>
                );
              })}

              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente da lista de eventos
function EventList({
  eventos,
  onEditEvent,
  onDeleteEvent,
  categorias,
}: {
  eventos: Evento[];
  onEditEvent: (evento: Evento) => void;
  onDeleteEvent: (id: number) => void;
  categorias: CategoriaEvento[];
}) {
  const getCategoria = (categoriaId: string) => {
    return categorias.find(cat => cat.id === categoriaId) || categorias[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'planejado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'concluido':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (eventos.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum evento encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eventos.map(evento => {
        const categoria = getCategoria(evento.categoria);
        return (
          <div
            key={evento.id}
            className="card-dark p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${categoria.cor}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {evento.nome_evento}
                  </h3>
                  <Badge className={getStatusColor(evento.status)}>
                    {evento.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(evento.data), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </div>

                  {evento.hora_inicio && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {evento.hora_inicio}
                      {evento.hora_fim && ` - ${evento.hora_fim}`}
                    </div>
                  )}

                  {evento.local && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {evento.local}
                    </div>
                  )}
                </div>

                {evento.descricao && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {evento.descricao}
                  </p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditEvent(evento)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => evento.id && onDeleteEvent(evento.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
