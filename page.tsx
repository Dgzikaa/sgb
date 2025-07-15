'use client';

import { useState, useEffect } from 'react';
import { useBar } from '@/contexts/BarContext';

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
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  reservasCount: number;
  totalPessoas: number;
  confirmadasCount: number;
  pessoasConfirmadas: number;
  canceladasCount: number;
  pessoasCanceladas: number;
  evento: EventoInfo | null;
}

export default function PlanejamentoPage() {
  const { selectedBar } = useBar();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dadosPorData, setDadosPorData] = useState<Record<string, DiaData>>({});
  const [totais, setTotais] = useState({ 
    reservas: 0, 
    pessoas: 0, 
    confirmadas: 0, 
    pessoasConfirmadas: 0,
    canceladas: 0,
    pessoasCanceladas: 0
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'reservas' | 'pessoas'>('reservas');
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Estados para o modal de edição de eventos
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<{
    data: string;
    evento: EventoInfo | null;
  } | null>(null);
  const [eventoCompleto, setEventoCompleto] = useState<EventoInfo | null>(null);
  const [carregandoEvento, setCarregandoEvento] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [excluindoEvento, setExcluindoEvento] = useState(false);

  // Auto refresh a cada 30 segundos se habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadReservasData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, currentMonth, currentYear, selectedBar]);

  useEffect(() => {
    loadReservasData();
  }, [currentMonth, currentYear, selectedBar]);

  const loadReservasData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mes: (currentMonth + 1).toString(),
        ano: currentYear.toString()
      });

      console.log('🔍 [LOAD DATA] Carregando dados para:', { 
        mes: currentMonth + 1, 
        ano: currentYear,
        url: `/api/dashboard/planejamento/reservas?${params}`
      });

      const response = await fetch(`/api/dashboard/planejamento/reservas?${params}`);
      console.log('📡 [LOAD DATA] Response status:', response.status);
      
      const result: ApiResponse = await response.json();
      console.log('📋 [LOAD DATA] Dados recebidos:', result);
      
      if (result.success && result.data) {
        console.log('✅ [LOAD DATA] Processando dados:', {
          totalDias: Object.keys(result.data || {}).length,
          totais: result.totais,
          diasComEventos: Object.entries(result.data || {}).filter(([_, dia]) => dia?.evento).length
        });

        

        // Log dos eventos encontrados
        Object.entries(result.data || {}).forEach(([data, dia]) => {
          if (dia?.evento) {
            console.log(`📅 [LOAD DATA] Evento ${data}:`, dia.evento);
          }
        });

        setDadosPorData(result.data || {});
        setTotais(result.totais || { reservas: 0, pessoas: 0, confirmadas: 0, pessoasConfirmadas: 0, canceladas: 0, pessoasCanceladas: 0 });
        console.log('✅ [LOAD DATA] Dados definidos no estado');
      } else {
        console.error('❌ [LOAD DATA] Erro ao carregar dados:', result);
        setDadosPorData({});
        setTotais({ reservas: 0, pessoas: 0, confirmadas: 0, pessoasConfirmadas: 0, canceladas: 0, pessoasCanceladas: 0 });
      }
    } catch (error) {
      console.error('💥 [LOAD DATA] Erro ao carregar reservas:', error);
      setDadosPorData({});
      setTotais({ reservas: 0, pessoas: 0, confirmadas: 0, pessoasConfirmadas: 0, canceladas: 0, pessoasCanceladas: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir modal de edição de evento
  const abrirModalEvento = async (data: string, evento: EventoInfo | null) => {
    setEventoEditando({ data, evento });
    setModalAberto(true);
    
    // Se existe um evento, carregar dados completos da base de dados
    if (evento) {
      const eventoCompleto = await carregarDadosEvento(data);
      setEventoCompleto(eventoCompleto);
    } else {
      setEventoCompleto(null);
    }
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setEventoEditando(null);
    setEventoCompleto(null);
  };

  // Função para salvar evento
  const salvarEvento = async (dadosEvento: {
    nome_evento: string;
    nome_artista: string;
    genero_musical: string;
    observacoes?: string;
  }) => {
    if (!eventoEditando || !selectedBar) return;

    console.log('💾 Iniciando salvamento do evento:', {
      eventoEditando,
      dadosEvento,
      eventoCompleto,
      selectedBar: selectedBar.id
    });

    setSalvandoEvento(true);
    try {
      const eventoId = eventoCompleto?.id;
      
      if (eventoId) {
        // Atualizar evento existente usando PUT
        console.log('🔄 Atualizando evento existente ID:', eventoId);
        const updateData = {
          id: eventoId,
          nome_evento: dadosEvento.nome_evento,
          nome_artista: dadosEvento.nome_artista || null,
          genero_musical: dadosEvento.genero_musical,
          observacoes: dadosEvento.observacoes || null
        };
        console.log('📝 Dados para atualização:', updateData);
        
        const response = await fetch('/api/admin/eventos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();
        console.log('📋 Resposta da API PUT:', result);
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao atualizar evento');
        }

        console.log('✅ Evento atualizado:', result.data);
      } else {
        // Criar novo evento usando POST
        console.log('➕ Criando novo evento');
        const novoEvento = {
          bar_id: selectedBar.id,
          nome_evento: dadosEvento.nome_evento,
          nome_artista: dadosEvento.nome_artista || null,
          genero_musical: dadosEvento.genero_musical,
          observacoes: dadosEvento.observacoes || null,
          data_evento: eventoEditando.data,
          horario_inicio: '19:00:00',
          horario_fim: '23:59:00',
          status: 'ativo',
          categoria: 'música',
          tipo_evento: 'show',
          divulgacao_ativa: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('📝 Dados para criação:', novoEvento);
        console.log('📋 Array que será enviado:', [novoEvento]);

        // POST precisa ser um array para a API atual
        const response = await fetch('/api/admin/eventos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([novoEvento]) // Array com um evento
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        const result = await response.json();
        console.log('📋 Resposta da API POST:', result);
        
        if (!response.ok || !result.success) {
          console.error('❌ Erro na resposta:', { status: response.status, result });
          throw new Error(result.error || `Erro ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Evento criado:', result.data);
      }

      // Atualizar dados locais
      setDadosPorData(prev => ({
        ...prev,
        [eventoEditando.data]: {
          ...prev[eventoEditando.data],
          evento: {
            nome: dadosEvento.nome_evento,
            artista: dadosEvento.nome_artista,
            genero: dadosEvento.genero_musical
          }
        }
      }));

      alert('✅ Evento salvo com sucesso!');
      fecharModal();
      
      // Recarregar dados para garantir sincronização
      loadReservasData();
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('❌ Erro ao salvar evento: ' + (error as Error).message);
    } finally {
      setSalvandoEvento(false);
    }
  };

  // Função para excluir evento
  const excluirEvento = async () => {
    if (!eventoEditando || !eventoCompleto?.id) {
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
      
      const response = await fetch(`/api/admin/eventos/${eventoCompleto.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      console.log('📋 Resposta da API DELETE:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao excluir evento');
      }

      // Atualizar dados locais removendo o evento
      setDadosPorData(prev => ({
        ...prev,
        [eventoEditando.data]: {
          ...prev[eventoEditando.data],
          evento: null
        }
      }));

      alert('✅ Evento excluído com sucesso!');
      fecharModal();
      
      // Recarregar dados para garantir sincronização
      loadReservasData();
      
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('❌ Erro ao excluir evento: ' + (error as Error).message);
    } finally {
      setExcluindoEvento(false);
    }
  };

  // Função para testar criação de evento (DEBUG)


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
      const dayData = dadosPorData[dateString];
      

      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        reservasCount: dayData?.reservas || 0,
        totalPessoas: dayData?.pessoas || 0,
        confirmadasCount: dayData?.confirmadas || 0,
        pessoasConfirmadas: dayData?.pessoasConfirmadas || 0,
        canceladasCount: dayData?.canceladas || 0,
        pessoasCanceladas: dayData?.pessoasCanceladas || 0,
        evento: dayData?.evento || null
      });
    }

    return days;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  // Função para carregar dados completos do evento
  const carregarDadosEvento = async (data: string) => {
    if (!selectedBar) return null;

    console.log('🔍 Carregando dados do evento para:', data);
    setCarregandoEvento(true);
    try {
      const [ano, mes, dia] = data.split('-');
      const response = await fetch(`/api/admin/eventos?bar_id=${selectedBar.id}&ano=${ano}&mes=${parseInt(mes)}`);
      const result = await response.json();
      
      console.log('📋 Dados recebidos da API:', result);
      
      if (result.success) {
        // Buscar evento específico da data
        const eventoEncontrado = result.data.find((evento: any) => {
          const dataEvento = new Date(evento.data_evento).toISOString().split('T')[0];
          console.log('🔍 Comparando:', dataEvento, 'com', data);
          return dataEvento === data;
        });
        
        if (eventoEncontrado) {
          console.log('✅ Evento encontrado:', eventoEncontrado);
          const eventoCompleto = {
            id: eventoEncontrado.id,
            nome: eventoEncontrado.nome_evento || '',
            artista: eventoEncontrado.nome_artista || '',
            genero: eventoEncontrado.genero_musical || '',
            observacoes: eventoEncontrado.observacoes || ''
          };
          console.log('📋 Evento formatado:', eventoCompleto);
          return eventoCompleto;
        } else {
          console.log('❌ Nenhum evento encontrado para a data:', data);
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return null;
    } finally {
      setCarregandoEvento(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Navegação */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🎵 Planejamento de Reservas
          </h1>
          <p className="text-gray-600">
            {selectedBar?.nome || 'Bar Ordinário'} - Visualize as reservas do mês com eventos e artistas
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Navegação de Mês e Ano */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Mês:</label>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white min-w-[120px] text-gray-900"
              >
                {[
                  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ].map((mes: any, index: any) => (
                  <option key={index} value={index}>{mes}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Ano:</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white min-w-[80px] text-gray-900"
              >
                {[2024, 2025, 2026, 2027].map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Controles de Visualização */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('reservas')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'reservas'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              RESERVAS
            </button>
            <button
              onClick={() => setViewMode('pessoas')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'pessoas'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              PESSOAS
            </button>
          </div>

          {/* Auto Refresh */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-gray-700">🔄 Atualizar</span>
          </label>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header do Calendário */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 border-b">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-lg font-bold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{totais.confirmadas} confirmadas</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{totais.canceladas} canceladas</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>{totais.reservas} total</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>{totais.pessoasConfirmadas} pax</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                <span>{totais.pessoasCanceladas} pax</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                <span>{totais.pessoas} pax</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="py-1.5 text-center text-sm font-bold text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Grid dos dias - Altura fixa para 6 semanas */}
                    <div className="grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, 100px)' }}>
          {generateCalendarDays().map((day: any, index: any) => {
            if (!day.isCurrentMonth) {
              return (
                <div key={index} className="border-r border-b last:border-r-0 bg-gray-50/30 opacity-40" />
              );
            }

            const hasReservas = day.reservasCount > 0;
            const hasEvento = day.evento;
            const confirmadas = day.confirmadasCount;
            const canceladas = day.canceladasCount;
            const total = day.reservasCount;

            return (
              <div
                key={index}
                className={`border-r border-b last:border-r-0 p-1 relative transition-all hover:bg-gray-50 cursor-pointer flex flex-col ${
                  day.isToday 
                    ? 'bg-white border-2 border-orange-500' 
                    : 'bg-white'
                }`}
                onClick={() => !hasEvento && abrirModalEvento(day.date.toISOString().split('T')[0], null)}
              >
                {/* Header do dia */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold ${
                    day.isToday ? 'text-orange-700' : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  
                  {/* Badge de reservas - formato confirmadas/canceladas */}
                  {hasReservas && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-1 py-0.5 rounded-full bg-green-500 text-white font-medium">
                        {confirmadas}
                      </span>
                      {canceladas > 0 && (
                        <>
                          <span className="text-xs text-gray-400">/</span>
                          <span className="text-xs px-1 py-0.5 rounded-full bg-red-500 text-white font-medium">
                            {canceladas}
                          </span>
                        </>
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
                      {/* Card do evento */}
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded p-1 hover:from-orange-200 hover:to-red-200 transition-all shadow-sm flex-shrink-0">
                        <div className="text-xs font-bold text-orange-800 truncate" title={day.evento?.nome}>
                          🎵 {day.evento?.nome}
                        </div>
                        {day.evento?.artista && (
                          <div className="text-xs text-orange-600 truncate" title={day.evento?.artista}>
                            👤 {day.evento?.artista}
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
                      className="w-full border-2 border-dashed border-gray-300 rounded p-1.5 text-gray-400 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all text-xs"
                    >
                      <div className="text-center">
                        <div>📅</div>
                        <div className="text-xs">Adicionar</div>
                      </div>
                    </button>
                  )}

                  {/* Informações detalhadas de reserva */}
                  <div className="mt-auto">
                    {hasReservas ? (
                      <div className="bg-gray-100 rounded px-2 py-1 text-xs">
                        <div className="text-center text-gray-700 font-medium text-xs leading-tight">
                          {confirmadas > 0 && (
                            <>
                              <span className="text-green-600 font-bold">✓ {confirmadas}</span>
                              <span className="text-green-700 ml-1">({day.pessoasConfirmadas} pax)</span>
                            </>
                          )}
                          {(day.reservasCount - confirmadas - canceladas) > 0 && (
                            <>
                              {confirmadas > 0 && <span className="mx-1">•</span>}
                              <span className="text-blue-600 font-bold">⏳ {day.reservasCount - confirmadas - canceladas}</span>
                              <span className="text-blue-700 ml-1">({day.totalPessoas - day.pessoasConfirmadas - day.pessoasCanceladas} pax)</span>
                            </>
                          )}
                          {canceladas > 0 && (
                            <>
                              {(confirmadas > 0 || (day.reservasCount - confirmadas - canceladas) > 0) && <span className="mx-1">•</span>}
                              <span className="text-red-600 font-bold">✗ {canceladas}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded px-1 py-0.5 text-xs">
                        <div className="text-center text-gray-500 text-xs font-medium">
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

        {/* Legenda - Colada diretamente na última linha */}
        <div className="bg-gray-50 px-4 py-2 -mt-px">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700 text-xs">Confirmadas (pax)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-600 font-bold">⏳</span>
                <span className="text-gray-700 text-xs">Pendentes (pax)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-600 font-bold">✗</span>
                <span className="text-gray-700 text-xs">Canceladas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-orange-200 rounded-full border border-orange-400"></div>
                <span className="text-gray-700 text-xs">Hoje</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-orange-100 rounded border border-orange-200"></div>
                <span className="text-gray-700 text-xs">Evento</span>
              </div>
            </div>
            <span className="text-gray-500 text-xs">Formato: ✓ confirmadas (pax) • ⏳ pendentes (pax) • ✗ canceladas</span>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Evento */}
      {modalAberto && eventoEditando && (
        <ModalEdicaoEvento
          isOpen={modalAberto}
          onClose={fecharModal}
          onSave={salvarEvento}
          onDelete={excluirEvento}
          evento={eventoEditando.evento}
          eventoCompleto={eventoCompleto}
          data={eventoEditando.data}
          loading={salvandoEvento}
          deleting={excluindoEvento}
          carregandoEvento={carregandoEvento}
        />
      )}
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

function ModalEdicaoEvento({ isOpen, onClose, onSave, onDelete, evento, eventoCompleto, data, loading, deleting, carregandoEvento }: ModalEdicaoEventoProps) {
  // Usar dados completos se disponíveis, senão usar dados básicos
  const dadosEvento = eventoCompleto || evento;
  
  const [formData, setFormData] = useState({
    nome_evento: '',
    nome_artista: '',
    genero_musical: '',
    observacoes: ''
  });

  // Atualizar form quando dados do evento carregarem
  useEffect(() => {
    console.log('🔄 Atualizando form com dados:', dadosEvento);
    if (dadosEvento) {
      const novoFormData = {
        nome_evento: dadosEvento.nome || '',
        nome_artista: dadosEvento.artista || '',
        genero_musical: dadosEvento.genero || '',
        observacoes: dadosEvento.observacoes || ''
      };
      console.log('📝 Novos dados do form:', novoFormData);
      setFormData(novoFormData);
    } else {
      console.log('🔄 Limpando form - sem dados de evento');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {evento ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {formatDate(data)}
              </p>
              {carregandoEvento && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Carregando dados do evento...
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Evento *
              </label>
              <input
                type="text"
                value={formData.nome_evento}
                onChange={(e) => setFormData({ ...formData, nome_evento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Ex: Quarta de Bamba"
                required
                disabled={carregandoEvento}
                style={{
                  opacity: carregandoEvento ? 0.6 : 1,
                  backgroundColor: carregandoEvento ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              />
            </div>

            {/* Nome do Artista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artista/Banda
              </label>
              <input
                type="text"
                value={formData.nome_artista}
                onChange={(e) => setFormData({ ...formData, nome_artista: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Ex: Breno Alves"
                disabled={carregandoEvento}
                style={{
                  opacity: carregandoEvento ? 0.6 : 1,
                  backgroundColor: carregandoEvento ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              />
            </div>

            {/* Gênero Musical */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gênero Musical
              </label>
              <select
                value={formData.genero_musical}
                onChange={(e) => setFormData({ ...formData, genero_musical: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                disabled={carregandoEvento}
                style={{
                  opacity: carregandoEvento ? 0.6 : 1,
                  backgroundColor: carregandoEvento ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              >
                <option value="">Selecione um gênero</option>
                <option value="Samba">Samba</option>
                <option value="Pagode">Pagode</option>
                <option value="Sertanejo">Sertanejo</option>
                <option value="DJ">DJ</option>
                <option value="Jazz">Jazz</option>
                <option value="Vocal">Vocal</option>
                <option value="Cubana">Música Cubana</option>
                <option value="Variado">Variado</option>
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white resize-none"
                rows={3}
                placeholder="Ex: Festival Junino, Feriado, etc."
                disabled={carregandoEvento}
                style={{
                  opacity: carregandoEvento ? 0.6 : 1,
                  backgroundColor: carregandoEvento ? '#f9fafb' : 'white',
                  color: '#111827'
                }}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              {/* Botão de Excluir - apenas para eventos existentes */}
              {eventoCompleto?.id && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading || deleting || carregandoEvento}
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </>
                  )}
                </button>
              )}
              
              <div className="flex gap-3 flex-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading || deleting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading || deleting || carregandoEvento}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Evento'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 