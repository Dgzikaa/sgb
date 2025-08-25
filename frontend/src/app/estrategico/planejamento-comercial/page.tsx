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
  Database
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

interface EventoEdicao {
  id: number;
  nome: string;
  m1_r: number;
  cl_plan: number;
  te_plan: number;
  tb_plan: number;
  c_artistico_plan: number;
  observacoes: string;
}

interface EventoEdicaoReal {
  id: number;
  nome: string;
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
  
  // Estados principais
  const [dados, setDados] = useState<PlanejamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRealOpen, setModalRealOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<PlanejamentoData | null>(null);
  const [eventoEdicao, setEventoEdicao] = useState<EventoEdicao | null>(null);
  const [eventoEdicaoReal, setEventoEdicaoReal] = useState<EventoEdicaoReal | null>(null);
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

  // Carregar dados iniciais
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

  // Abrir modal de edição
  const abrirModal = (evento: PlanejamentoData) => {
    setEventoSelecionado(evento);
    setEventoEdicao({
      id: evento.evento_id,
      nome: evento.evento_nome,
      m1_r: evento.m1_receita,
      cl_plan: evento.clientes_plan,
      te_plan: evento.te_plan,
      tb_plan: evento.tb_plan,
      c_artistico_plan: evento.c_art || 0,
      observacoes: ''
    });
    setModalOpen(true);
  };

  // Abrir modal de edição dos valores reais
  const abrirModalReal = (evento: PlanejamentoData) => {
    setEventoSelecionado(evento);
    setEventoEdicaoReal({
      id: evento.evento_id,
      nome: evento.evento_nome,
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
    });
    setModalRealOpen(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalOpen(false);
    setEventoSelecionado(null);
    setEventoEdicao(null);
  };

  // Fechar modal real
  const fecharModalReal = () => {
    setModalRealOpen(false);
    setEventoSelecionado(null);
    setEventoEdicaoReal(null);
  };

  // Salvar edição
  const salvarEdicao = async () => {
    if (!eventoEdicao) return;

    try {
      setSalvando(true);
      
      const response = await apiCall(`/api/eventos/${eventoEdicao.id}`, {
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

      if (response.success) {
        console.log('✅ Evento atualizado com sucesso');
        fecharModal();
        // Recarregar dados
        await buscarDados();
      } else {
        throw new Error(response.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      alert('Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  };

  // Salvar edição dos valores reais
  const salvarEdicaoReal = async () => {
    if (!eventoEdicaoReal) return;

    try {
      setSalvando(true);
      
      const response = await apiCall(`/api/eventos/${eventoEdicaoReal.id}/valores-reais`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          real_r: eventoEdicaoReal.real_r,
          cl_real: eventoEdicaoReal.cl_real,
          te_real: eventoEdicaoReal.te_real,
          tb_real: eventoEdicaoReal.tb_real,
          t_medio: eventoEdicaoReal.t_medio,
          res_tot: eventoEdicaoReal.res_tot,
          res_p: eventoEdicaoReal.res_p,
          c_art: eventoEdicaoReal.c_art,
          c_prod: eventoEdicaoReal.c_prod,
          percent_b: eventoEdicaoReal.percent_b,
          percent_d: eventoEdicaoReal.percent_d,
          percent_c: eventoEdicaoReal.percent_c,
          t_coz: eventoEdicaoReal.t_coz,
          t_bar: eventoEdicaoReal.t_bar,
          observacoes: eventoEdicaoReal.observacoes
        })
      });

      if (response.success) {
        console.log('✅ Valores reais atualizados com sucesso');
        fecharModalReal();
        // Recarregar dados
        await buscarDados();
      } else {
        throw new Error(response.error || 'Erro ao salvar valores reais');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar valores reais:', err);
      alert('Erro ao salvar valores reais');
    } finally {
      setSalvando(false);
    }
  };

  // Formatação de valores
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
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
  const anos = [2024, 2025, 2026];

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header simplificado */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-blue-600" />
                Planejamento Comercial
              </h1>
          <p className="text-gray-600 dark:text-gray-400">
                Gestão completa de metas e resultados dos eventos
              </p>
            </div>
            
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
          <div className="flex gap-4">
            {/* Tabela principal */}
            <Card className="card-dark flex-1">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <CardTitle className="card-title-dark text-lg">
                {meses.find(m => m.value === filtroMes)?.label} {filtroAno} - {dados.length} eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Data</th>
                      <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Dia</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Real</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">M1</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Cl.P</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Cl.R</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">R.Tot</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">R.P</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">Lot</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TE.P</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TE.R</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TB.P</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">TB.R</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Med</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">C.Art</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">C.Prod</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%Art</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%B</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%D</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">%C</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Coz</th>
                      <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight border-r border-gray-200 dark:border-gray-700">T.Bar</th>
                      <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dados.map((evento) => (
                      <tr key={evento.evento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50" title={evento.evento_nome}>
                        <td className="px-1 py-1 text-xs font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          {evento.data_curta}
                        </td>
                        <td className="px-1 py-1 text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.dia_semana?.substring(0, 3).toUpperCase()}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.real_vs_m1_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.real_receita > 0 ? formatarMoeda(evento.real_receita) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.m1_receita > 0 ? formatarMoeda(evento.m1_receita) : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.clientes_plan || '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.ci_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.clientes_real || '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.res_tot || '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.res_p || '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.lot_max || '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.te_plan > 0 ? formatarMoeda(evento.te_plan) : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.te_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.te_real > 0 ? formatarMoeda(evento.te_real) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.tb_plan > 0 ? formatarMoeda(evento.tb_plan) : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.tb_real_vs_plan_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.tb_real > 0 ? formatarMoeda(evento.tb_real) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_medio_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_medio > 0 ? formatarMoeda(evento.t_medio) : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.c_art > 0 ? formatarMoeda(evento.c_art) : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.c_prod > 0 ? formatarMoeda(evento.c_prod) : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.percent_art_fat_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.percent_art_fat > 0 ? evento.percent_art_fat.toFixed(1) + '%' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_b > 0 ? evento.percent_b.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_d > 0 ? evento.percent_d.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {evento.percent_c > 0 ? evento.percent_c.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_coz_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_coz > 0 ? evento.t_coz.toFixed(1) + 'min' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-right text-xs border-r border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${evento.t_bar_green ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {evento.t_bar > 0 ? evento.t_bar.toFixed(1) + 'min' : '-'}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              onClick={() => abrirModal(evento)}
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar planejamento"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => abrirModalReal(evento)}
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700 text-blue-600 dark:text-blue-400"
                              title="Editar valores reais"
                            >
                              <Database className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
            
            {/* Painel lateral com controles */}
            <div className="w-64 flex-shrink-0">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 sticky top-4">
                <div className="space-y-4">
                  {/* Título do painel */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-600" />
                      Controles
                    </h3>
                  </div>
                  
                  {/* Filtros de período */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Mês
                      </label>
                      <Select value={filtroMes.toString()} onValueChange={(value) => alterarPeriodo(parseInt(value), filtroAno)}>
                        <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white flex items-center justify-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          {meses.map((mes) => (
                            <SelectItem 
                              key={mes.value} 
                              value={mes.value.toString()}
                              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {mes.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Ano
                      </label>
                      <Select value={filtroAno.toString()} onValueChange={(value) => alterarPeriodo(filtroMes, parseInt(value))}>
                        <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white flex items-center justify-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          {anos.map((ano) => (
                            <SelectItem 
                              key={ano} 
                              value={ano.toString()}
                              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      {recalculandoEventos ? '⏳ Recalculando...' : '🔄 Atualizar Eventos'}
                    </button>
                    
                    <button 
                      onClick={sincronizarGetin} 
                      disabled={sincronizandoGetin}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      title="Sincronizar dados do Getin (reservas)"
                    >
                      {sincronizandoGetin ? '⏳ Sincronizando...' : '💾 Sync Getin'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
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
                              ? '📈' : '📉'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Modal de edição */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 backdrop-blur-sm">
            <DialogHeader className="bg-gradient-to-r from-blue-700 to-purple-600 p-6 text-white shadow-lg">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <Edit className="h-7 w-7 text-blue-200" />
                Editar Planejamento - {eventoSelecionado?.dia_formatado}/{filtroMes}/{filtroAno}
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">Ajuste os dados de planejamento e orçamentação para este evento.</p>
            </DialogHeader>
            
            {eventoEdicao && eventoSelecionado && (
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Seção de Planejamento */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Dados de Planejamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Evento</label>
                        <Input
                          value={eventoEdicao.nome}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, nome: e.target.value})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Meta Receita (M1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.m1_r}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, m1_r: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Clientes Planejados</label>
                        <Input
                          type="number"
                          value={eventoEdicao.cl_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, cl_plan: parseInt(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Entrada Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.te_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, te_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Bar Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.tb_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, tb_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custo Artístico Plan.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicao.c_artistico_plan}
                          onChange={(e) => setEventoEdicao({...eventoEdicao, c_artistico_plan: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Observações */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-300 flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={eventoEdicao.observacoes}
                      onChange={(e) => setEventoEdicao({...eventoEdicao, observacoes: e.target.value})}
                      placeholder="Observações sobre o evento, ajustes, particularidades..."
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {/* Seção de Dados Atuais (Read-only) */}
                <Card className="bg-gray-800/30 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Dados Atuais do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">Receita Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.real_receita)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">Clientes Real</div>
                        <div className="text-white font-semibold">{eventoSelecionado.clientes_real}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">TE Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.te_real)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">TB Real</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.tb_real)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">T. Médio</div>
                        <div className="text-white font-semibold">{formatarMoeda(eventoSelecionado.t_medio)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Bebidas</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_b)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Drinks</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_d)}</div>
                      </div>
                      <div className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="text-gray-400">% Comidas</div>
                        <div className="text-white font-semibold">{formatarPercentual(eventoSelecionado.percent_c)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="bg-gray-900/50 p-4 border-t border-gray-700 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={fecharModal} 
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button 
                onClick={salvarEdicao} 
                disabled={salvando} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de edição dos valores reais */}
        <Dialog open={modalRealOpen} onOpenChange={setModalRealOpen}>
          <DialogContent className="max-w-6xl p-0 overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 backdrop-blur-sm">
            <DialogHeader className="bg-gradient-to-r from-green-700 to-blue-600 p-6 text-white shadow-lg">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <Database className="h-7 w-7 text-green-200" />
                Editar Valores Reais - {eventoSelecionado?.dia_formatado}/{filtroMes}/{filtroAno}
              </DialogTitle>
              <p className="text-green-100 text-sm mt-1">Edite manualmente os valores reais quando há problemas com as APIs externas.</p>
            </DialogHeader>
            
            {eventoEdicaoReal && eventoSelecionado && (
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Seção de Receitas e Clientes */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-300 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Receitas e Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Receita Real (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.real_r}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, real_r: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Clientes Real</label>
                        <Input
                          type="number"
                          value={eventoEdicaoReal.cl_real}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, cl_real: parseInt(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Médio (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.t_medio}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, t_medio: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Tickets */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
                      <Wine className="h-5 w-5" />
                      Tickets Entrada e Bar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Entrada Real (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.te_real}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, te_real: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Bar Real (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.tb_real}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, tb_real: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Reservas */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Reservas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reservas Totais</label>
                        <Input
                          type="number"
                          value={eventoEdicaoReal.res_tot}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, res_tot: parseInt(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reservas Presentes</label>
                        <Input
                          type="number"
                          value={eventoEdicaoReal.res_p}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, res_p: parseInt(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Custos */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-red-300 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Custos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custo Artístico (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.c_art}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, c_art: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custo Produção (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={eventoEdicaoReal.c_prod}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, c_prod: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Percentuais */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Percentuais de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">% Bebidas</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={eventoEdicaoReal.percent_b}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, percent_b: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">% Drinks</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={eventoEdicaoReal.percent_d}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, percent_d: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">% Comidas</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={eventoEdicaoReal.percent_c}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, percent_c: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Tempos */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-300 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Tempos de Atendimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tempo Cozinha (min)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={eventoEdicaoReal.t_coz}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, t_coz: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tempo Bar (min)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={eventoEdicaoReal.t_bar}
                          onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, t_bar: parseFloat(e.target.value) || 0})}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Observações */}
                <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-300 flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Observações sobre os Valores Reais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={eventoEdicaoReal.observacoes}
                      onChange={(e) => setEventoEdicaoReal({...eventoEdicaoReal, observacoes: e.target.value})}
                      placeholder="Observações sobre os valores reais editados, motivos, ajustes..."
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="bg-gray-900/50 p-4 border-t border-gray-700 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={fecharModalReal} 
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button 
                onClick={salvarEdicaoReal} 
                disabled={salvando} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Valores Reais
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
