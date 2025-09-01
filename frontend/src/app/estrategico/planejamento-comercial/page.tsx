'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Edit, 
  Save, 
  X, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Users, 
  DollarSign,
  Clock,
  ChefHat,
  Wine,
  Target,
  AlertCircle,
  CheckCircle,
  Eye,
  Filter,
  Database,
  BarChart3,
  Ticket
} from 'lucide-react';

interface PlanejamentoData {
  evento_id: number;
  data_evento: string;
  dia_semana: string;
  evento_nome: string;
  dia: number;
  mes: number;
  ano: number;
  dia_formatado: string;
  data_curta: string;
  
  // Dados financeiros
  real_receita: number;
  m1_receita: number;
  
  // Dados de público
  clientes_plan: number;
  clientes_real: number;
  res_tot: number;
  res_p: number;
  lot_max: number;
  
  // Tickets
  te_plan: number;
  te_real: number;
  tb_plan: number;
  tb_real: number;
  t_medio: number;
  
  // Custos
  c_art: number;
  c_prod: number;
  percent_art_fat: number;
  
  // Percentuais
  percent_b: number;
  percent_d: number;
  percent_c: number;
  
  // Tempos e performance
  t_coz: number;
  t_bar: number;
  fat_19h: number;
  
  // Flags de performance
  real_vs_m1_green: boolean;
  ci_real_vs_plan_green: boolean;
  te_real_vs_plan_green: boolean;
  tb_real_vs_plan_green: boolean;
  t_medio_green: boolean;
  percent_art_fat_green: boolean;
  t_coz_green: boolean;
  t_bar_green: boolean;
  fat_19h_green: boolean;
}

interface EventoEdicaoCompleta {
  id: number;
  nome: string;
  // Dados de planejamento
  m1_r: number;
  cl_plan: number;
  te_plan: number;
  tb_plan: number;
  c_artistico_plan: number;
  // Dados reais
  real_r: number;
  cl_real: number;
  te_real: number;
  tb_real: number;
  t_medio: number;
  res_tot: number;
  res_p: number;
  c_art: number;
  c_prod: number;
  percent_b: number;
  percent_d: number;
  percent_c: number;
  t_coz: number;
  t_bar: number;
  observacoes: string;
}

export default function PlanejamentoComercialPage() {
  const { user } = useUser();
  const { setPageTitle } = usePageTitle();
  const searchParams = useSearchParams();
  
  // Estados principais
  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros - Ler da URL ou usar mês/ano atual como padrão
  const mesFromUrl = searchParams.get('mes');
  const anoFromUrl = searchParams.get('ano');
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje);
  const [filtroMes, setFiltroMes] = useState(mesFromUrl ? parseInt(mesFromUrl) : hoje.getMonth() + 1); // Mês atual
  const [filtroAno, setFiltroAno] = useState(anoFromUrl ? parseInt(anoFromUrl) : hoje.getFullYear()); // Ano atual
  
  // Estados do modal unificado
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false); // true = editar, false = visualizar
  const [eventoSelecionado, setEventoSelecionado] = useState<PlanejamentoData | null>(null);
  const [eventoEdicao, setEventoEdicao] = useState<EventoEdicaoCompleta | null>(null);
  const [salvando, setSalvando] = useState(false);
  
  // Estado para sincronização Getin
  const [sincronizandoGetin, setSincronizandoGetin] = useState(false);

  // Buscar dados da API
  const buscarDados = async (mes?: number, ano?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const mesParam = mes || filtroMes;
      const anoParam = ano || filtroAno;
      
      const timestamp = new Date().getTime();
      // Debug verbose apenas quando necessário
      if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log(`🔍 Buscando dados para ${mesParam}/${anoParam} (${timestamp})`);
      }
      
      const data = await apiCall(`/api/estrategico/planejamento-comercial?mes=${mesParam}&ano=${anoParam}&_t=${timestamp}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user)),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Debug detalhado apenas verbose
      if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('📊 Nova estrutura - Dados recebidos:', {
          total: data.data?.length || 0,
          estrutura: data.meta?.estrutura,
          eventos_recalculados: data.meta?.eventos_recalculados,
          dados_reais_disponiveis: data.meta?.dados_reais_disponiveis
        });
      }
      
      // Debug específico removido para reduzir logs desnecessários

      if (data.success && data.data) {
        // A API já retorna os dados filtrados por mês/ano, apenas ordenar por data crescente
        const dadosOrdenados = data.data.sort((a, b) => {
          const dataA = new Date(a.data_evento);
          const dataB = new Date(b.data_evento);
          return dataA.getTime() - dataB.getTime();
        });
        
        setDados(dadosOrdenados);
        
        // Debug silencioso - apenas verbose quando necessário
        if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
          console.log(`✅ ${dadosOrdenados.length} eventos carregados para ${mesParam}/${anoParam}`);
          
          if (dadosOrdenados.length > 0) {
            console.log(`🔍 Primeira data: ${dadosOrdenados[0].data_evento} | Última: ${dadosOrdenados[dadosOrdenados.length - 1].data_evento}`);
          }
          
          if (data.meta?.dados_reais_disponiveis) {
            console.log('📅 Períodos com dados reais:', data.meta.dados_reais_disponiveis);
          }
        }
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

  // Atualizar filtros quando parâmetros da URL mudarem
  useEffect(() => {
    const mesFromUrl = searchParams.get('mes');
    const anoFromUrl = searchParams.get('ano');
    
    if (mesFromUrl && anoFromUrl) {
      const mes = parseInt(mesFromUrl);
      const ano = parseInt(anoFromUrl);
      
      if (mes >= 1 && mes <= 12 && ano >= 2020 && ano <= 2030) {
        setFiltroMes(mes);
        setFiltroAno(ano);
        setMesAtual(new Date(ano, mes - 1, 1));
      }
    }
  }, [searchParams]);

  // Carregar dados iniciais
  // Definir título da página
  useEffect(() => {
    setPageTitle('📊 Planejamento Comercial');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    if (user) {
      buscarDados();
    }
  }, [user, filtroMes, filtroAno]);

  // Alterar mês/ano
  const alterarPeriodo = (novoMes: number, novoAno: number) => {
    setFiltroMes(novoMes);
    setFiltroAno(novoAno);
    setMesAtual(new Date(novoAno, novoMes - 1, 1));
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

  // Forçar recálculo da tabela eventos_base
  const [recalculandoEventos, setRecalculandoEventos] = useState(false);
  
  const recalcularEventosBase = async () => {
    try {
      setRecalculandoEventos(true);
      console.log('🔄 Iniciando recálculo forçado da eventos_base...');
      
      const response = await apiCall('/api/eventos/recalcular-eventos-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          data_inicio: `${filtroAno}-${filtroMes.toString().padStart(2, '0')}-01`,
          data_fim: filtroMes === 12 
            ? `${filtroAno + 1}-01-31` 
            : `${filtroAno}-${(filtroMes + 1).toString().padStart(2, '0')}-01`
        })
      });

      if (response.success) {
        console.log('✅ Recálculo eventos_base concluído:', response);
        
        // Mostrar feedback de sucesso
        alert(`✅ Recálculo concluído!\n\n📊 Eventos recalculados: ${response.total_recalculados || 0}\n🔄 Dados atualizados com sucesso!`);
        
        // Recarregar dados da página após recálculo
        await buscarDados();
      } else {
        throw new Error(response.error || 'Erro no recálculo');
      }
    } catch (err) {
      console.error('❌ Erro no recálculo eventos_base:', err);
      alert('❌ Erro ao recalcular dados dos eventos. Tente novamente.');
    } finally {
      setRecalculandoEventos(false);
    }
  };

  // Abrir modal de edição unificado (planejamento + valores reais)
  const abrirModal = (evento: PlanejamentoData, editMode: boolean = false) => {
    console.log('🔍 Debug - Evento selecionado para edição:', evento);
    
    setEventoSelecionado(evento);
    setModoEdicao(editMode);
    
    const dadosIniciais: EventoEdicaoCompleta = {
      id: evento.evento_id,
      nome: evento.evento_nome,
      // Dados de planejamento
      m1_r: evento.m1_receita || 0,
      cl_plan: evento.clientes_plan || 0,
      te_plan: evento.te_plan || 0,
      tb_plan: evento.tb_plan || 0,
      c_artistico_plan: evento.c_art || 0,
      // Dados reais
      real_r: evento.real_receita || 0,
      cl_real: evento.clientes_real || 0,
      te_real: evento.te_real || 0,
      tb_real: evento.tb_real || 0,
      t_medio: evento.t_medio || 0,
      res_tot: evento.res_tot || 0,
      res_p: evento.res_p || 0,
      c_art: evento.c_art || 0,
      c_prod: evento.c_prod || 0,
      percent_b: evento.percent_b || 0,
      percent_d: evento.percent_d || 0,
      percent_c: evento.percent_c || 0,
      t_coz: evento.t_coz || 0,
      t_bar: evento.t_bar || 0,
      observacoes: ''
    };
    
    console.log('🔍 Debug - Dados iniciais do modal unificado:', dadosIniciais);
    
    setEventoEdicao(dadosIniciais);
    setModalOpen(true);
  };

  // Fechar modal unificado
  const fecharModal = () => {
    setModalOpen(false);
    setEventoSelecionado(null);
    setEventoEdicao(null);
  };

  // Salvar edição unificada (planejamento + valores reais)
  const salvarEdicao = async () => {
    if (!eventoEdicao) return;

    try {
      setSalvando(true);
      
      // Salvar dados de planejamento
      const responsePlanejamento = await apiCall(`/api/eventos/${eventoEdicao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          nome: eventoEdicao.nome,
          m1_r: eventoEdicao.m1_r,
          cl_plan: eventoEdicao.cl_plan,
          te_plan: eventoEdicao.te_plan,
          tb_plan: eventoEdicao.tb_plan,
          c_artistico_plan: eventoEdicao.c_artistico_plan,
          observacoes: eventoEdicao.observacoes
        })
      });

      if (!responsePlanejamento.success) {
        throw new Error(responsePlanejamento.error || 'Erro ao salvar planejamento');
      }

      // Salvar valores reais
      const responseReais = await apiCall(`/api/eventos/${eventoEdicao.id}/valores-reais`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          real_r: eventoEdicao.real_r || 0,
          cl_real: eventoEdicao.cl_real || 0,
          te_real: eventoEdicao.te_real || 0,
          tb_real: eventoEdicao.tb_real || 0,
          t_medio: eventoEdicao.t_medio || 0,
          res_tot: eventoEdicao.res_tot || 0,
          res_p: eventoEdicao.res_p || 0,
          c_art: eventoEdicao.c_art || 0,
          c_prod: eventoEdicao.c_prod || 0,
          percent_b: eventoEdicao.percent_b || 0,
          percent_d: eventoEdicao.percent_d || 0,
          percent_c: eventoEdicao.percent_c || 0,
          t_coz: eventoEdicao.t_coz || 0,
          t_bar: eventoEdicao.t_bar || 0,
          observacoes: eventoEdicao.observacoes || ''
        })
      });

      if (!responseReais.success) {
        throw new Error(responseReais.error || 'Erro ao salvar valores reais');
      }

      console.log('✅ Evento atualizado com sucesso (planejamento + valores reais)');
      fecharModal();
        // Recarregar dados
        await buscarDados();
      
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      alert('Erro ao salvar alterações: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };



  // Formatação de valores
  const formatarMoeda = (valor: number | null | undefined): string => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number | null | undefined): string => {
    if (!valor && valor !== 0) return '0,0%';
    return `${valor.toFixed(1).replace('.', ',')}%`;
  };

  // Função para formatar tempo em minutos
  const formatarTempo = (valor: number | null | undefined): string => {
    if (!valor && valor !== 0) return '0,00 min';
    return `${valor.toFixed(2).replace('.', ',')} min`;
  };

  // Componente de Badge de Status
  const StatusBadge = ({ isGreen, value, suffix = '' }: { isGreen: boolean; value: number | string; suffix?: string }) => (
    <Badge variant={isGreen ? "default" : "destructive"} className="text-xs">
      {isGreen ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
      {value}{suffix}
    </Badge>
  );

  // Meses para o seletor
  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // Anos disponíveis
  const anos = [2025, 2026];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando planejamento comercial...</p>
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
    <div className="min-h-[calc(100vh-4px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 py-1 max-w-[98vw]">
            
        {/* Layout principal com tabela e controles laterais */}
        {dados.length === 0 ? (
          <Card className="card-dark p-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="card-title-dark mb-2">Nenhum evento encontrado</h3>
              <p className="card-description-dark">
                Não há eventos cadastrados para {meses.find(m => m.value === filtroMes)?.label} de {filtroAno}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Controles Mobile - Topo */}
            <div className="md:hidden mb-4">
              <Card className="card-dark p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    Controles
                  </h3>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {dados.length} eventos
                  </div>
                </div>
                
                {/* Período */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Período
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filtroMes.toString()} onValueChange={(value) => alterarPeriodo(parseInt(value), filtroAno)}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                        {meses.map((mes) => (
                          <SelectItem 
                            key={mes.value} 
                            value={mes.value.toString()}
                            className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/50 text-xs"
                          >
                            {mes.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filtroAno.toString()} onValueChange={(value) => alterarPeriodo(filtroMes, parseInt(value))}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                        {anos.map((ano) => (
                          <SelectItem 
                            key={ano} 
                            value={ano.toString()}
                            className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/50 text-xs"
                          >
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>


              </Card>
            </div>

          <div className="flex gap-4">
            {/* Tabela principal - Desktop */}
            <Card className="card-dark flex-1 hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto border-x border-gray-200 dark:border-gray-700">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Data</th>
                      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Dia</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Real</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">M1</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Cl.P</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Cl.R</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">R.Tot</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">R.P</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Lot</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TE.P</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TE.R</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TB.P</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TB.R</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Med</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">C.Art</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">C.Prod</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%Art</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%B</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%D</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%C</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Coz</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Bar</th>
                      <th className="px-1 py-0.5 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dados.map((evento) => (
                      <tr key={evento.evento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50" title={evento.evento_nome}>
                        <td className="px-1 py-0.5 text-xs font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          {evento.data_curta}
                        </td>
                        <td className="px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.dia_semana?.substring(0, 3).toUpperCase()}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.real_vs_m1_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.real_receita > 0 ? formatarMoeda(evento.real_receita) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.m1_receita > 0 ? formatarMoeda(evento.m1_receita) : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.clientes_plan || '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.ci_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.clientes_real || '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.res_tot || '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.res_p || '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.lot_max || '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.te_plan > 0 ? formatarMoeda(evento.te_plan) : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.te_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.te_real > 0 ? formatarMoeda(evento.te_real) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.tb_plan > 0 ? formatarMoeda(evento.tb_plan) : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.tb_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.tb_real > 0 ? formatarMoeda(evento.tb_real) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_medio_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_medio > 0 ? formatarMoeda(evento.t_medio) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.c_art > 0 ? formatarMoeda(evento.c_art) : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.c_prod > 0 ? formatarMoeda(evento.c_prod) : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.percent_art_fat_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.percent_art_fat > 0 ? evento.percent_art_fat.toFixed(1) + '%' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_b > 0 ? evento.percent_b.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_d > 0 ? evento.percent_d.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_c > 0 ? evento.percent_c.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_coz_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_coz > 0 ? evento.t_coz.toFixed(1) + 'min' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_bar_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_bar > 0 ? evento.t_bar.toFixed(1) + 'min' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-0.5 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              onClick={() => abrirModal(evento, false)}
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700 text-blue-600 dark:text-blue-400"
                              title="Visualizar evento"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => abrirModal(evento, true)}
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-700 text-green-600 dark:text-green-400"
                              title="Editar evento"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
            </CardContent>
          </Card>
            
            {/* Versão Mobile - Cards */}
            <div className="flex-1 md:hidden">
              <div className="space-y-3">
                {dados.map((evento) => (
                  <Card key={evento.evento_id} className="card-dark">
                    <CardContent className="p-3">
                      {/* Header do Card */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {evento.data_curta}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {evento.dia_semana}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {evento.evento_nome}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Métricas Principais - Linha 1 */}
                      <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Real</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarMoeda(evento.real_receita)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">M1</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarMoeda(evento.m1_receita)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Cl.R</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {evento.clientes_real || '-'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">T.Med</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarTempo(evento.t_medio)}
                          </span>
                        </div>
                      </div>

                      {/* Métricas Secundárias - Linha 2 */}
                      <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Ticket className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">TE</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarMoeda(evento.te_real)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Wine className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">TB</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarMoeda(evento.tb_real)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Res.T</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {evento.res_tot || '-'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Res.P</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {evento.res_p || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Métricas Avançadas - Linha 3 */}
                      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ChefHat className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">T.Coz</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarTempo(evento.t_coz)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Wine className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">T.Bar</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarTempo(evento.t_bar)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">%Art</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarPercentual(evento.percent_art_fat)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BarChart3 className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">%B</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white block">
                            {formatarPercentual(evento.percent_b)}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => abrirModal(evento, false)}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => abrirModal(evento, true)}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Painel lateral com controles - Desktop */}
            <div className="w-64 flex-shrink-0 hidden md:block">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 sticky top-4">
                <div className="space-y-3">
                  {/* Título do painel */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-600" />
                      Controles
                    </h3>
                  </div>
                  
                  {/* Filtros de período */}
                    <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      Período
                      </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={filtroMes.toString()} onValueChange={(value) => alterarPeriodo(parseInt(value), filtroAno)}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                          {meses.map((mes) => (
                            <SelectItem 
                              key={mes.value} 
                              value={mes.value.toString()}
                              className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/50 text-xs"
                            >
                              {mes.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    
                      <Select value={filtroAno.toString()} onValueChange={(value) => alterarPeriodo(filtroMes, parseInt(value))}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                          {anos.map((ano) => (
                            <SelectItem 
                              key={ano} 
                              value={ano.toString()}
                              className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/50 text-xs"
                            >
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={recalcularEventosBase} 
                      disabled={recalculandoEventos}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      title="Forçar recálculo dos dados dos eventos"
                    >
                      {recalculandoEventos ? (
                        <>
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                          Recalculando...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Atualizar Eventos
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={sincronizarGetin} 
                      disabled={sincronizandoGetin}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      title="Sincronizar dados do Getin (reservas)"
                    >
                      {sincronizandoGetin ? (
                        <>
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4" />
                          Sync Getin
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Informações do período */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Período:
                        </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {meses.find(m => m.value === filtroMes)?.label} {filtroAno}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Eventos:
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {dados.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        Estatísticas
                      </h3>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      {/* Meta M1 vs Realizado */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Meta M1:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatarMoeda(dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0) >= 
                            dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0)
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarMoeda(dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0))}
                            {dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0) >= 
                            dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0)
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Atingido:</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            ((dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0) / 
                              dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0)) * 100) >= 100 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {((dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0) / 
                              dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0)) * 100).toFixed(1)}%
                            {((dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0) / 
                              dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0)) * 100) >= 100 
                              ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Falta faturar:</span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {formatarMoeda(Math.max(0, dados.reduce((sum, evento) => sum + (evento.m1_receita || 0), 0) - 
                              dados.reduce((sum, evento) => sum + (evento.real_receita || 0), 0)))}
                          </span>
                        </div>
                      </div>

                      {/* T.M Entrada */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.M Entrada:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatarMoeda(dados.filter(e => e.te_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_plan || 0) / arr.length, 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.M Entrada Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            (dados.filter(e => e.te_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_real || 0) / arr.length, 0)) >=
                            (dados.filter(e => e.te_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_plan || 0) / arr.length, 0))
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarMoeda(dados.filter(e => e.te_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_real || 0) / arr.length, 0))}
                            {(dados.filter(e => e.te_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_real || 0) / arr.length, 0)) >=
                            (dados.filter(e => e.te_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.te_plan || 0) / arr.length, 0))
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>

                      {/* T.M Bar */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.M Bar:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatarMoeda(dados.filter(e => e.tb_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_plan || 0) / arr.length, 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.M Bar Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            (dados.filter(e => e.tb_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_real || 0) / arr.length, 0)) >=
                            (dados.filter(e => e.tb_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_plan || 0) / arr.length, 0))
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarMoeda(dados.filter(e => e.tb_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_real || 0) / arr.length, 0))}
                            {(dados.filter(e => e.tb_real > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_real || 0) / arr.length, 0)) >=
                            (dados.filter(e => e.tb_plan > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.tb_plan || 0) / arr.length, 0))
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>

                      {/* T.Coz */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Meta T.Coz:</span>
                          <span className="font-medium text-gray-900 dark:text-white">12.0min</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.Coz Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            (dados.filter(e => e.t_coz > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_coz || 0) / arr.length, 0)) <= 12
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(dados.filter(e => e.t_coz > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_coz || 0) / arr.length, 0)).toFixed(1)}min
                            {(dados.filter(e => e.t_coz > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_coz || 0) / arr.length, 0)) <= 12
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>

                      {/* T.Bar */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Meta T.Bar:</span>
                          <span className="font-medium text-gray-900 dark:text-white">4.0min</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">T.Bar Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            (dados.filter(e => e.t_bar > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_bar || 0) / arr.length, 0)) <= 4
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(dados.filter(e => e.t_bar > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_bar || 0) / arr.length, 0)).toFixed(1)}min
                            {(dados.filter(e => e.t_bar > 0)
                              .reduce((sum, evento, _, arr) => sum + (evento.t_bar || 0) / arr.length, 0)) <= 4
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>

                      {/* Clientes */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Meta Clientes:</span>
                          <span className="font-medium text-gray-900 dark:text-white">10.000</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Clientes Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            dados.reduce((sum, evento) => sum + (evento.clientes_real || 0), 0) >= 10000
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dados.reduce((sum, evento) => sum + (evento.clientes_real || 0), 0).toLocaleString()}
                            {dados.reduce((sum, evento) => sum + (evento.clientes_real || 0), 0) >= 10000
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>

                      {/* Reservas Presentes */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Meta Reservas Presentes:</span>
                          <span className="font-medium text-gray-900 dark:text-white">2.600</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Reservas Presentes Real:</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            dados.reduce((sum, evento) => sum + (evento.res_p || 0), 0) >= 2600
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dados.reduce((sum, evento) => sum + (evento.res_p || 0), 0).toLocaleString()}
                            {dados.reduce((sum, evento) => sum + (evento.res_p || 0), 0) >= 2600
                              ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </>
        )}

        {/* Modal Unificado - Planejado vs Realizado */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-[70vw] max-h-[85vh] p-0 overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <DialogHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
                <BarChart3 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                {modoEdicao ? 'Editar Evento' : 'Visualizar Evento'} - {eventoEdicao?.nome}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {modoEdicao ? 'Edite os dados planejados e reais do evento' : 'Análise comparativa: Planejado vs Realizado'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                
                {/* COLUNA ESQUERDA - PLANEJADO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PLANEJADO</h2>
                      </div>

                  {/* Receita Planejada */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Receita
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Meta Receita</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.m1_r ? Number(eventoEdicao.m1_r.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, m1_r: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.m1_r)}
                      </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Público Planejado */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Público
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clientes Planejados</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.cl_plan || 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, cl_plan: parseInt(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {(eventoEdicao?.cl_plan || 0).toLocaleString('pt-BR')}
                      </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tickets Planejados */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Tickets
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ticket Entrada Planejado</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.te_plan ? Number(eventoEdicao.te_plan.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, te_plan: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.te_plan)}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ticket Bar Planejado</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.tb_plan ? Number(eventoEdicao.tb_plan.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, tb_plan: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.tb_plan)}
                      </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custos Planejados */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Custos
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Custo Artístico Planejado</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.c_artistico_plan ? Number(eventoEdicao.c_artistico_plan.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, c_artistico_plan: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.c_artistico_plan)}
                      </div>
                        )}
                    </div>
                      </div>
                      </div>
                      </div>

                {/* COLUNA DIREITA - REALIZADO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">REALIZADO</h2>
                      </div>

                  {/* Receita Real */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Receita
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Receita Real</Label>
                        {modoEdicao ? (
                          <Input
                            type="number"
                            value={eventoEdicao?.real_r ? Number(eventoEdicao.real_r.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, real_r: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.real_r)}
                      </div>
                        )}
                      </div>
                      </div>
                      </div>

                  {/* Público Real */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Público
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clientes Reais</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.cl_real || 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, cl_real: parseInt(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {(eventoEdicao?.cl_real || 0).toLocaleString('pt-BR')}
                      </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Reservas Totais</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.res_tot || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, res_tot: parseInt(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {(eventoEdicao?.res_tot || 0).toLocaleString('pt-BR')}
                            </div>
                          )}
                      </div>
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Reservas Pagas</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.res_p || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, res_p: parseInt(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {(eventoEdicao?.res_p || 0).toLocaleString('pt-BR')}
                      </div>
                          )}
                    </div>
                      </div>
                    </div>
                  </div>

                  {/* Tickets Reais */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Tickets
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ticket Entrada Real</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.te_real ? Number(eventoEdicao.te_real.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, te_real: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.te_real)}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ticket Bar Real</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.tb_real ? Number(eventoEdicao.tb_real.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, tb_real: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.tb_real)}
                      </div>
                        )}
                    </div>
                      <div>
                                                <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ticket Médio</Label>
                        {modoEdicao ? (
                        <Input
                          type="number"
                            value={eventoEdicao?.t_medio ? Number(eventoEdicao.t_medio.toFixed(2)) : 0}
                            onChange={(e) => setEventoEdicao(prev => prev ? {...prev, t_medio: parseFloat(e.target.value) || 0} : null)}
                            className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                            {formatarMoeda(eventoEdicao?.t_medio)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custos e Análises Reais */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Performance
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Custo Artístico</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.c_art ? Number(eventoEdicao.c_art.toFixed(2)) : 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, c_art: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarMoeda(eventoEdicao?.c_art)}
                            </div>
                          )}
                      </div>
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Custo Produção</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.c_prod ? Number(eventoEdicao.c_prod.toFixed(2)) : 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, c_prod: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarMoeda(eventoEdicao?.c_prod)}
                      </div>
                          )}
                    </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">% Bebidas</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.percent_b || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, percent_b: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                              step="0.01"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarPercentual(eventoEdicao?.percent_b)}
                            </div>
                          )}
                      </div>
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">% Comidas</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.percent_c || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, percent_c: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                              step="0.01"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarPercentual(eventoEdicao?.percent_c)}
                            </div>
                          )}
                      </div>
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">% Drinks</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.percent_d || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, percent_d: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                              step="0.01"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarPercentual(eventoEdicao?.percent_d)}
                      </div>
                          )}
                    </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tempo Cozinha</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.t_coz || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, t_coz: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                              step="0.01"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarTempo(eventoEdicao?.t_coz)}
                            </div>
                          )}
                      </div>
                      <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tempo Bar</Label>
                          {modoEdicao ? (
                        <Input
                          type="number"
                              value={eventoEdicao?.t_bar || 0}
                              onChange={(e) => setEventoEdicao(prev => prev ? {...prev, t_bar: parseFloat(e.target.value) || 0} : null)}
                              className="mt-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm h-9"
                              placeholder="0.00"
                              step="0.01"
                            />
                          ) : (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-medium text-sm">
                              {formatarTempo(eventoEdicao?.t_bar)}
                      </div>
                          )}
                    </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE ANÁLISE DE PERFORMANCE */}
              {!modoEdicao && eventoEdicao && (
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Análise de Performance
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Receita */}
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Receita</div>
                      <div className={`text-2xl font-bold ${
                        (eventoEdicao.real_r || 0) >= (eventoEdicao.m1_r || 0) 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(eventoEdicao.real_r || 0) >= (eventoEdicao.m1_r || 0) ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {eventoEdicao.m1_r > 0 
                          ? `${(((eventoEdicao.real_r || 0) / eventoEdicao.m1_r) * 100).toFixed(1)}% da meta`
                          : 'Meta não definida'
                        }
                      </div>
                    </div>

                    {/* Público */}
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Público</div>
                      <div className={`text-2xl font-bold ${
                        (eventoEdicao.cl_real || 0) >= (eventoEdicao.cl_plan || 0) 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(eventoEdicao.cl_real || 0) >= (eventoEdicao.cl_plan || 0) ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {eventoEdicao.cl_plan > 0 
                          ? `${(((eventoEdicao.cl_real || 0) / eventoEdicao.cl_plan) * 100).toFixed(1)}% da meta`
                          : 'Meta não definida'
                        }
                      </div>
                    </div>

                    {/* Ticket Médio */}
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ticket Médio</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {eventoEdicao.cl_real > 0 
                          ? ((eventoEdicao.real_r || 0) / eventoEdicao.cl_real).toFixed(2)
                          : '0.00'
                        }
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        por cliente
                      </div>
                    </div>
                  </div>
              </div>
            )}
            </div>
            
            <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={() => setModalOpen(false)}
                variant="outline" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                {modoEdicao ? 'Cancelar' : 'Fechar'}
              </Button>
              {modoEdicao && (
              <Button 
                  onClick={salvarEdicao}
                disabled={salvando} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6"
              >
                {salvando ? (
                  <>
                      <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> Salvando...
                  </>
                ) : (
                  <>
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                  </>
                )}
              </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
