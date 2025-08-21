'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Edit, 
  Save, 
  X, 
  RefreshCcw, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  ChefHat,
  Wine,
  Target,
  AlertCircle,
  CheckCircle,
  Filter,
  Database,
  Music,
  User,
  Plus
} from 'lucide-react';

interface EventoInfo {
  id?: number;
  nome: string;
  artista: string;
  genero: string;
  observacoes?: string;
}

interface DiaData {
  reservas: number;
  pessoas: number;
  confirmadas: number;
  pessoasConfirmadas: number;
  canceladas: number;
  pessoasCanceladas: number;
  noshow: number;
  pessoasNoshow: number;
  pendentes: number;
  pessoasPendentes: number;
  evento: EventoInfo | null;
}

interface ApiResponse {
  success: boolean;
  data: Record<string, DiaData>;
  totais: {
    reservas: number;
    pessoas: number;
    confirmadas: number;
    pessoasConfirmadas: number;
    canceladas: number;
    pessoasCanceladas: number;
    noshow: number;
    pessoasNoshow: number;
    pendentes: number;
    pessoasPendentes: number;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  reservasCount: number;
  totalPessoas: number;
  confirmadasCount: number;
  pessoasConfirmadas: number;
  canceladasCount: number;
  pessoasCanceladas: number;
  noshowCount: number;
  pessoasNoshow: number;
  pendentesCount: number;
  pessoasPendentes: number;
  evento: EventoInfo | null;
}

export default function CalendarioPage() {
  const { user } = useUser();
  
  // Estados principais
  const [dados, setDados] = useState<Record<string, DiaData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [totais, setTotais] = useState({ 
    reservas: 0, 
    pessoas: 0, 
    confirmadas: 0, 
    pessoasConfirmadas: 0,
    canceladas: 0,
    pessoasCanceladas: 0,
    noshow: 0,
    pessoasNoshow: 0,
    pendentes: 0,
    pessoasPendentes: 0
  });
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<{
    data: string;
    evento: EventoInfo | null;
  } | null>(null);
  const [eventoCompleto, setEventoCompleto] = useState<EventoInfo | null>(null);
  const [carregandoEvento, setCarregandoEvento] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [excluindoEvento, setExcluindoEvento] = useState(false);
  
  // Estado para sincronização Getin
  const [sincronizandoGetin, setSincronizandoGetin] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh a cada 30 segundos se habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      buscarDados();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, currentMonth, currentYear, user]);

  // Buscar dados da API
  const buscarDados = async (mes?: number, ano?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const mesParam = mes || (currentMonth + 1);
      const anoParam = ano || currentYear;
      
      console.log(`🔍 Buscando dados para ${mesParam}/${anoParam}`);
      
      const params = new URLSearchParams({
        mes: mesParam.toString(),
        ano: anoParam.toString()
      });

      const response = await apiCall(`/api/ferramentas/calendario?${params}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });
      
      console.log('📊 Dados recebidos:', {
        total: Object.keys(response.data || {}).length,
        totais: response.totais,
        meta: response.meta
      });

      if (response.success && response.data) {
        setDados(response.data);
        setTotais(response.totais || { 
          reservas: 0, 
          pessoas: 0, 
          confirmadas: 0, 
          pessoasConfirmadas: 0, 
          canceladas: 0, 
          pessoasCanceladas: 0 
        });
        console.log(`✅ ${Object.keys(response.data).length} dias carregados para ${mesParam}/${anoParam}`);
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      buscarDados();
    }
  }, [user, currentMonth, currentYear]);

  // Alterar mês/ano
  const alterarPeriodo = (novoMes: number, novoAno: number) => {
    setCurrentMonth(novoMes);
    setCurrentYear(novoAno);
  };

  // Sincronizar dados do Getin
  const sincronizarGetin = async () => {
    try {
      setSincronizandoGetin(true);
      console.log('🔄 Iniciando sincronização forçada do Getin...');
      
      const response = await apiCall('/api/trigger-getin-sync', {
        method: 'GET',
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (response.success) {
        console.log('✅ Sincronização Getin concluída:', response.stats);
        
        // Mostrar feedback de sucesso
        alert(`✅ Sincronização concluída!\n\n📊 Reservas processadas: ${response.stats?.total_encontrados || 0}\n✅ Reservas salvas: ${response.stats?.total_salvos || 0}\n❌ Erros: ${response.stats?.total_erros || 0}`);
        
        // Recarregar dados da página após sincronização
        await buscarDados();
      } else {
        throw new Error(response.error || 'Erro na sincronização');
      }
    } catch (err) {
      console.error('❌ Erro na sincronização Getin:', err);
      alert('❌ Erro ao sincronizar dados do Getin. Tente novamente.');
    } finally {
      setSincronizandoGetin(false);
    }
  };

  // Abrir modal de edição de evento
  const abrirModalEvento = async (data: string, evento: EventoInfo | null) => {
    setEventoSelecionado({ data, evento });
    setModalOpen(true);
    
    // Se existe um evento, carregar dados completos da base de dados
    if (evento) {
      const eventoCompleto = await carregarDadosEvento(data);
      setEventoCompleto(eventoCompleto);
    } else {
      setEventoCompleto(null);
    }
  };

  // Fechar modal
  const fecharModal = () => {
    setModalOpen(false);
    setEventoSelecionado(null);
    setEventoCompleto(null);
  };

  // Salvar evento
  const salvarEvento = async (dadosEvento: {
    nome_evento: string;
    nome_artista: string;
    genero_musical: string;
    observacoes?: string;
  }) => {
    if (!eventoSelecionado || !user) return;

    console.log('💾 Iniciando salvamento do evento:', {
      eventoSelecionado,
      dadosEvento,
      eventoCompleto
    });

    setSalvandoEvento(true);
    try {
      const eventoId = eventoCompleto?.id;
      
      if (eventoId) {
        // Atualizar evento existente usando PUT
        console.log('🔄 Atualizando evento existente ID:', eventoId);
        const updateData = {
          id: eventoId,
          nome: dadosEvento.nome_evento,
          artista: dadosEvento.nome_artista || null,
          genero: dadosEvento.genero_musical,
          observacoes: dadosEvento.observacoes || null
        };
        
        const response = await apiCall('/api/ferramentas/calendario/eventos', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-data': encodeURIComponent(JSON.stringify(user))
          },
          body: JSON.stringify(updateData)
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Erro ao atualizar evento');
        }

        console.log('✅ Evento atualizado:', response.data);
      } else {
        // Criar novo evento usando POST
        console.log('➕ Criando novo evento');
        const novoEvento = {
          data_evento: eventoSelecionado.data,
          nome: dadosEvento.nome_evento,
          artista: dadosEvento.nome_artista || null,
          genero: dadosEvento.genero_musical,
          observacoes: dadosEvento.observacoes || null
        };

        const response = await apiCall('/api/ferramentas/calendario/eventos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-data': encodeURIComponent(JSON.stringify(user))
          },
          body: JSON.stringify(novoEvento)
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Erro ao criar evento');
        }

        console.log('✅ Evento criado:', response.data);
      }

      // Atualizar dados locais
      setDados(prev => ({
        ...prev,
        [eventoSelecionado.data]: {
          ...prev[eventoSelecionado.data],
          evento: {
            id: eventoId || response.data?.id,
            nome: dadosEvento.nome_evento,
            artista: dadosEvento.nome_artista,
            genero: dadosEvento.genero_musical,
            observacoes: dadosEvento.observacoes
          }
        }
      }));

      alert('✅ Evento salvo com sucesso!');
      fecharModal();
      
      // Recarregar dados para garantir sincronização
      buscarDados();
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('❌ Erro ao salvar evento: ' + (error as Error).message);
    } finally {
      setSalvandoEvento(false);
    }
  };

  // Excluir evento
  const excluirEvento = async () => {
    if (!eventoSelecionado || !eventoCompleto?.id) {
      alert('❌ Não é possível excluir: evento não identificado');
      return;
    }

    const confirmacao = confirm(
      `🗑️ Tem certeza que deseja excluir o evento "${eventoCompleto.nome}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmacao) return;

    setExcluindoEvento(true);
    try {
      console.log('🗑️ Excluindo evento ID:', eventoCompleto.id);
      
      const response = await apiCall(`/api/ferramentas/calendario/eventos?id=${eventoCompleto.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao excluir evento');
      }

      // Atualizar dados locais removendo o evento
      setDados(prev => ({
        ...prev,
        [eventoSelecionado.data]: {
          ...prev[eventoSelecionado.data],
          evento: null
        }
      }));

      alert('✅ Evento excluído com sucesso!');
      fecharModal();
      
      // Recarregar dados para garantir sincronização
      buscarDados();
      
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('❌ Erro ao excluir evento: ' + (error as Error).message);
    } finally {
      setExcluindoEvento(false);
    }
  };

  // Carregar dados completos do evento
  const carregarDadosEvento = async (data: string) => {
    if (!user) return null;

    console.log('🔍 Carregando dados do evento para:', data);
    setCarregandoEvento(true);
    try {
      const response = await apiCall(`/api/ferramentas/calendario/eventos?data=${data}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });
      
      console.log('📋 Dados recebidos da API:', response);
      
      if (response.success && response.data) {
        console.log('✅ Evento encontrado:', response.data);
        const eventoCompleto = {
          id: response.data.id,
          nome: response.data.nome || '',
          artista: response.data.artista || '',
          genero: response.data.genero || '',
          observacoes: response.data.observacoes || ''
        };
        console.log('📋 Evento formatado:', eventoCompleto);
        return eventoCompleto;
      } else {
        console.log('❌ Nenhum evento encontrado para a data:', data);
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return null;
    } finally {
      setCarregandoEvento(false);
    }
  };

  // Gerar dias do calendário
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayData = dados[dateString];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = date < today;
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        isPast,
        reservasCount: dayData?.reservas || 0,
        totalPessoas: dayData?.pessoas || 0,
        confirmadasCount: dayData?.confirmadas || 0,
        pessoasConfirmadas: dayData?.pessoasConfirmadas || 0,
        canceladasCount: dayData?.canceladas || 0,
        pessoasCanceladas: dayData?.pessoasCanceladas || 0,
        noshowCount: dayData?.noshow || 0,
        pessoasNoshow: dayData?.pessoasNoshow || 0,
        pendentesCount: dayData?.pendentes || 0,
        pessoasPendentes: dayData?.pessoasPendentes || 0,
        evento: dayData?.evento || null
      });
    }

    return days;
  };

  // Formatação de valores
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Meses para o seletor
  const meses = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' }
  ];

  // Anos disponíveis
  const anos = [2024, 2025, 2026];

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="card-dark p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <h3 className="card-title-dark mb-2">Erro ao carregar dados</h3>
            <p className="card-description-dark mb-4">{error}</p>
            <Button onClick={() => buscarDados()} className="btn-primary-dark">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 py-4 max-w-full">
        {/* Header com filtros */}
        <div className="card-dark p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="card-title-dark mb-2 flex items-center gap-3">
                <Calendar className="h-7 w-7 text-blue-600" />
                Calendário de Eventos
              </h1>
              <p className="card-description-dark">
                Visualize eventos, artistas e reservas em formato de calendário
              </p>
            </div>
            
            {/* Filtros de período */}
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <Select value={currentMonth.toString()} onValueChange={(value) => alterarPeriodo(parseInt(value), currentYear)}>
                <SelectTrigger className="w-32 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={currentYear.toString()} onValueChange={(value) => alterarPeriodo(currentMonth, parseInt(value))}>
                <SelectTrigger className="w-24 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => buscarDados()} 
                variant="outline" 
                size="sm"
                className="btn-outline-dark"
                title="Atualizar dados da página"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              
              <Button 
                onClick={sincronizarGetin} 
                variant="outline" 
                size="sm"
                className="btn-outline-dark"
                disabled={sincronizandoGetin}
                title="Sincronizar dados do Getin (reservas)"
              >
                {sincronizandoGetin ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
              </Button>

              {/* Auto Refresh */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">🔄 Auto</span>
              </label>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <Card className="card-dark">
          {/* Header do Calendário */}
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-xl">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold">
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{totais.confirmadas} realmente foram</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>{totais.pendentes} confirmadas</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{totais.canceladas - totais.noshow} canceladas</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>{totais.noshow} no-show</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <Users className="w-3 h-3" />
                  <span>{totais.pessoas} pessoas</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-gray-800">
              {weekDays.map((day) => (
                <div key={day} className="py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, 110px)' }}>
              {generateCalendarDays().map((day, index) => {
                if (!day.isCurrentMonth) {
                  return (
                    <div key={index} className="border-r border-b last:border-r-0 bg-gray-50/30 dark:bg-gray-800/30 opacity-40" />
                  );
                }

                const hasReservas = day.reservasCount > 0;
                const hasEvento = day.evento;
                const confirmadas = day.confirmadasCount;
                const canceladas = day.canceladasCount;
                const noshow = day.noshowCount;
                const pendentes = day.pendentesCount;

                return (
                  <div
                    key={index}
                    className={`border-r border-b last:border-r-0 p-2 relative transition-all hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex flex-col ${
                      day.isToday 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500' 
                        : 'bg-white dark:bg-gray-900'
                    }`}
                    onClick={() => !hasEvento && abrirModalEvento(day.date.toISOString().split('T')[0], null)}
                  >
                    {/* Header do dia */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${
                        day.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.date.getDate()}
                      </span>
                      
                      {/* Badge de reservas - Simplificado */}
                      {hasReservas && (
                        <div className="flex items-center gap-1">
                          {/* Total de reservas ativas (pending + confirmed + seated) */}
                          <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-blue-500">
                            {day.reservasCount - canceladas}
                          </Badge>
                          {/* Canceladas (canceled-user + no-show) */}
                          {canceladas > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              -{canceladas}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Área de conteúdo */}
                    <div className="space-y-1 flex-1 flex flex-col">
                      {/* Evento */}
                      {hasEvento ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEvento(day.date.toISOString().split('T')[0], day.evento);
                          }}
                          className="group cursor-pointer"
                        >
                          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-700 rounded p-2 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/50 dark:hover:to-purple-800/50 transition-all shadow-sm">
                            <div className="text-xs font-bold text-blue-800 dark:text-blue-200 truncate flex items-center gap-1" title={day.evento?.nome}>
                              <Music className="w-3 h-3" />
                              {day.evento?.nome}
                            </div>
                            {day.evento?.artista && (
                              <div className="text-xs text-blue-600 dark:text-blue-300 truncate flex items-center gap-1" title={day.evento?.artista}>
                                <User className="w-3 h-3" />
                                {day.evento?.artista}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEvento(day.date.toISOString().split('T')[0], null);
                          }}
                          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-2 text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-xs"
                        >
                          <div className="text-center">
                            <Plus className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">Adicionar</div>
                          </div>
                        </button>
                      )}

                      {/* Informações de reserva - Simplificado */}
                      <div className="mt-auto">
                        {hasReservas ? (
                          <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs">
                            <div className="text-center text-gray-700 dark:text-gray-300 font-medium text-xs leading-tight">
                              {/* Total de reservas ativas */}
                              <span className="text-blue-600 font-bold">{day.reservasCount - canceladas} reservas</span>
                              <span className="text-blue-700 dark:text-blue-400 ml-1">({day.totalPessoas - day.pessoasCanceladas} pax)</span>
                              
                              {/* Canceladas */}
                              {canceladas > 0 && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="text-red-600 font-bold">{canceladas} não foram</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5 text-xs">
                            <div className="text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
                              0 pax
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs">Confirmadas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-bold">⏳</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs">Pendentes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-600 font-bold">✗</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs">Canceladas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-200 rounded-full border border-blue-400"></div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs">Hoje</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3 h-3 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300 text-xs">Evento</span>
                  </div>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">pax = pessoas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">R</div>
              <span>Total de reservas ativas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded text-white flex items-center justify-center text-xs font-bold">-</div>
              <span>Canceladas + No-show</span>
            </div>
            <div className="text-gray-500">
              <span className="font-medium">pax</span> = pessoas
            </div>
          </div>
        </div>

        {/* Modal de Edição de Evento */}
        {modalOpen && eventoSelecionado && (
          <ModalEdicaoEvento
            isOpen={modalOpen}
            onClose={fecharModal}
            onSave={salvarEvento}
            onDelete={excluirEvento}
            evento={eventoSelecionado.evento}
            eventoCompleto={eventoCompleto}
            data={eventoSelecionado.data}
            loading={salvandoEvento}
            deleting={excluindoEvento}
            carregandoEvento={carregandoEvento}
          />
        )}
      </div>
    </div>
  );
}

// Componente Modal de Edição de Evento
interface ModalEdicaoEventoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dados: {
    nome_evento: string;
    nome_artista: string;
    genero_musical: string;
    observacoes?: string;
  }) => void;
  onDelete: () => void;
  evento: EventoInfo | null;
  eventoCompleto: EventoInfo | null;
  data: string;
  loading: boolean;
  deleting: boolean;
  carregandoEvento: boolean;
}

function ModalEdicaoEvento({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  evento, 
  eventoCompleto, 
  data, 
  loading, 
  deleting, 
  carregandoEvento 
}: ModalEdicaoEventoProps) {
  const dadosEvento = eventoCompleto || evento;
  
  const [formData, setFormData] = useState({
    nome_evento: '',
    nome_artista: '',
    genero_musical: '',
    observacoes: ''
  });

  useEffect(() => {
    if (dadosEvento) {
      setFormData({
        nome_evento: dadosEvento.nome || '',
        nome_artista: dadosEvento.artista || '',
        genero_musical: dadosEvento.genero || '',
        observacoes: dadosEvento.observacoes || ''
      });
    } else {
      setFormData({
        nome_evento: '',
        nome_artista: '',
        genero_musical: '',
        observacoes: ''
      });
    }
  }, [dadosEvento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_evento.trim()) {
      alert('Nome do evento é obrigatório');
      return;
    }
    onSave(formData);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {evento ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {evento ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {formatDate(data)}
          </p>
          {carregandoEvento && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Carregando dados do evento...
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Evento *
            </label>
            <Input
              value={formData.nome_evento}
              onChange={(e) => setFormData({ ...formData, nome_evento: e.target.value })}
              placeholder="Ex: Quarta de Bamba"
              required
              disabled={carregandoEvento}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Artista/Banda
            </label>
            <Input
              value={formData.nome_artista}
              onChange={(e) => setFormData({ ...formData, nome_artista: e.target.value })}
              placeholder="Ex: Breno Alves"
              disabled={carregandoEvento}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gênero Musical
            </label>
            <Select 
              value={formData.genero_musical} 
              onValueChange={(value) => setFormData({ ...formData, genero_musical: value })}
              disabled={carregandoEvento}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Samba">Samba</SelectItem>
                <SelectItem value="Pagode">Pagode</SelectItem>
                <SelectItem value="Sertanejo">Sertanejo</SelectItem>
                <SelectItem value="DJ">DJ</SelectItem>
                <SelectItem value="Jazz">Jazz</SelectItem>
                <SelectItem value="Vocal">Vocal</SelectItem>
                <SelectItem value="Cubana">Música Cubana</SelectItem>
                <SelectItem value="Variado">Variado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Festival Junino, Feriado, etc."
              rows={3}
              disabled={carregandoEvento}
            />
          </div>

          <DialogFooter className="flex gap-3">
            {eventoCompleto?.id && (
              <Button
                type="button"
                onClick={onDelete}
                variant="destructive"
                disabled={loading || deleting || carregandoEvento}
              >
                {deleting ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            )}
            
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading || deleting}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || deleting || carregandoEvento}
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
