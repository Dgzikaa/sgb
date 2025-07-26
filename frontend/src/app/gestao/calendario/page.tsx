'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Music,
  Mic,
  Star,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Evento {
  id: number;
  nome: string;
  data_evento: string;
  artista: string;
  genero: string;
  dia_semana: string;
  tipo_evento: string;
  status: string;
  hora_inicio?: string;
  hora_fim?: string;
  capacidade_maxima?: number;
  observacoes?: string;
}

interface NovoEvento {
  nome: string;
  data_evento: string;
  artista: string;
  genero: string;
  tipo_evento: string;
  hora_inicio: string;
  hora_fim: string;
  capacidade_maxima: number;
  observacoes: string;
}

export default function CalendarioPage() {
  const { setPageTitle } = usePageTitle();
  const { toast } = useToast();
  const router = useRouter();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroGenero, setFiltroGenero] = useState('todos');
  const [busca, setBusca] = useState('');
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  
  const [novoEvento, setNovoEvento] = useState<NovoEvento>({
    nome: '',
    data_evento: '',
    artista: '',
    genero: '',
    tipo_evento: '',
    hora_inicio: '',
    hora_fim: '',
    capacidade_maxima: 0,
    observacoes: ''
  });

  useEffect(() => {
    setPageTitle('Calendário de Eventos');
    carregarEventos();
  }, [setPageTitle]);

  const carregarEventos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gestao/eventos');
      if (response.ok) {
        const data = await response.json();
        setEventos(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar eventos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarEvento = async () => {
    try {
      setSalvandoEvento(true);
      
      const response = await fetch('/api/gestao/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoEvento)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Evento criado com sucesso!",
          variant: "default"
        });
        setModalAberto(false);
        carregarEventos();
        setNovoEvento({
          nome: '',
          data_evento: '',
          artista: '',
          genero: '',
          tipo_evento: '',
          hora_inicio: '',
          hora_fim: '',
          capacidade_maxima: 0,
          observacoes: ''
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar evento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar evento",
        variant: "destructive"
      });
    } finally {
      setSalvandoEvento(false);
    }
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  const getDiasDoMes = (): (Date | null)[] => {
    const inicio = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const fim = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];

    // Adicionar dias vazios do início
    const primeiroDiaDaSemana = inicio.getDay();
    for (let i = 0; i < primeiroDiaDaSemana; i++) {
      dias.push(null);
    }

    // Adicionar dias do mês
    for (let dia = 1; dia <= fim.getDate(); dia++) {
      dias.push(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia));
    }

    return dias;
  };

  const getEventosNoDia = (data: Date) => {
    const dataStr = data.toISOString().split('T')[0];
    return eventos.filter(evento => evento.data_evento === dataStr);
  };

  const eventosFiltrados = eventos.filter(evento => {
    const matchGenero = filtroGenero === 'todos' || evento.genero?.toLowerCase().includes(filtroGenero.toLowerCase());
    const matchBusca = busca === '' || 
      evento.nome.toLowerCase().includes(busca.toLowerCase()) ||
      evento.artista?.toLowerCase().includes(busca.toLowerCase());
    return matchGenero && matchBusca;
  });

  const generos = [...new Set(eventos.map(e => e.genero).filter(Boolean))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Confirmado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGeneroBadge = (genero: string) => {
    switch (genero?.toLowerCase()) {
      case 'samba':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"><Mic className="w-3 h-3 mr-1" />Samba</Badge>;
      case 'dj':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"><Music className="w-3 h-3 mr-1" />DJ</Badge>;
      case 'funk':
        return <Badge className="bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800"><Music className="w-3 h-3 mr-1" />Funk</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"><Star className="w-3 h-3 mr-1" />{genero}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredModule="gestao">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="gestao">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calendário de Eventos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie a programação de eventos do estabelecimento
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={carregarEventos}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button
              onClick={() => setModalAberto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 dark:text-white">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="busca" className="text-sm text-gray-700 dark:text-gray-300">Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="busca"
                    placeholder="Nome do evento ou artista..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Gênero</Label>
                <Select value={filtroGenero} onValueChange={setFiltroGenero}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os gêneros</SelectItem>
                    {generos.map((genero) => (
                      <SelectItem key={genero} value={genero}>{genero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {eventosFiltrados.length} eventos encontrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={mesAnterior}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={proximoMes}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grade do calendário */}
            <div className="grid grid-cols-7 gap-2">
              {getDiasDoMes().map((dia, index) => {
                if (!dia) {
                  return <div key={index} className="aspect-square" />;
                }
                
                const eventosNoDia = getEventosNoDia(dia);
                const isHoje = dia.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={`${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`}
                    className={`
                      aspect-square border border-gray-200 dark:border-gray-700 rounded-lg p-2 
                      ${isHoje ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800/50'}
                      hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-sm font-medium mb-1 ${isHoje ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {dia.getDate()}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {eventosNoDia.slice(0, 2).map((evento) => (
                          <div
                            key={evento.id}
                            className="text-xs p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 truncate"
                            title={`${evento.nome} - ${evento.artista}`}
                          >
                            {evento.nome}
                          </div>
                        ))}
                        {eventosNoDia.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{eventosNoDia.length - 2} eventos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de eventos */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              Próximos Eventos
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Lista detalhada dos próximos eventos programados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventosFiltrados
                .filter(evento => new Date(evento.data_evento) >= new Date())
                .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime())
                .slice(0, 10)
                .map((evento) => (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {evento.nome}
                        </h3>
                        {getStatusBadge(evento.status)}
                        {evento.genero && getGeneroBadge(evento.genero)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(evento.data_evento).toLocaleDateString('pt-BR')} - {evento.dia_semana}
                        </div>
                        {evento.artista && (
                          <div className="flex items-center gap-1">
                            <Mic className="w-4 h-4" />
                            {evento.artista}
                          </div>
                        )}
                        {evento.hora_inicio && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {evento.hora_inicio}
                          </div>
                        )}
                        {evento.capacidade_maxima && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {evento.capacidade_maxima} pessoas
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {eventosFiltrados.filter(evento => new Date(evento.data_evento) >= new Date()).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum evento encontrado com os filtros aplicados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal Novo Evento */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Novo Evento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nome" className="text-sm text-gray-700 dark:text-gray-300">Nome do Evento</Label>
                <Input
                  id="nome"
                  value={novoEvento.nome}
                  onChange={(e) => setNovoEvento({...novoEvento, nome: e.target.value})}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="data_evento" className="text-sm text-gray-700 dark:text-gray-300">Data</Label>
                <Input
                  id="data_evento"
                  type="date"
                  value={novoEvento.data_evento}
                  onChange={(e) => setNovoEvento({...novoEvento, data_evento: e.target.value})}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="artista" className="text-sm text-gray-700 dark:text-gray-300">Artista</Label>
                <Input
                  id="artista"
                  value={novoEvento.artista}
                  onChange={(e) => setNovoEvento({...novoEvento, artista: e.target.value})}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Gênero</Label>
                  <Select value={novoEvento.genero} onValueChange={(value) => setNovoEvento({...novoEvento, genero: value})}>
                    <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Samba">Samba</SelectItem>
                      <SelectItem value="DJ">DJ</SelectItem>
                      <SelectItem value="Funk">Funk</SelectItem>
                      <SelectItem value="Pop">Pop</SelectItem>
                      <SelectItem value="Rock">Rock</SelectItem>
                      <SelectItem value="Eletrônica">Eletrônica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Tipo</Label>
                  <Select value={novoEvento.tipo_evento} onValueChange={(value) => setNovoEvento({...novoEvento, tipo_evento: value})}>
                    <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Show">Show</SelectItem>
                      <SelectItem value="Festa">Festa</SelectItem>
                      <SelectItem value="Happy Hour">Happy Hour</SelectItem>
                      <SelectItem value="Evento Especial">Evento Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hora_inicio" className="text-sm text-gray-700 dark:text-gray-300">Hora Início</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={novoEvento.hora_inicio}
                    onChange={(e) => setNovoEvento({...novoEvento, hora_inicio: e.target.value})}
                    className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="hora_fim" className="text-sm text-gray-700 dark:text-gray-300">Hora Fim</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={novoEvento.hora_fim}
                    onChange={(e) => setNovoEvento({...novoEvento, hora_fim: e.target.value})}
                    className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="capacidade_maxima" className="text-sm text-gray-700 dark:text-gray-300">Capacidade Máxima</Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  value={novoEvento.capacidade_maxima}
                  onChange={(e) => setNovoEvento({...novoEvento, capacidade_maxima: parseInt(e.target.value) || 0})}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="observacoes" className="text-sm text-gray-700 dark:text-gray-300">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novoEvento.observacoes}
                  onChange={(e) => setNovoEvento({...novoEvento, observacoes: e.target.value})}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
                className="text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarEvento}
                disabled={salvandoEvento || !novoEvento.nome || !novoEvento.data_evento}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {salvandoEvento ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
