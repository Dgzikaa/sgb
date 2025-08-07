'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FilterIcon,
  BarChart3Icon,
  RefreshCw,
  Upload,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  Calculator,
  Calendar,
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EditarDesempenhoModal } from '@/components/gestao/EditarDesempenhoModal';
import { useToast } from '@/hooks/use-toast';

interface DadosDesempenho {
  id: number;
  bar_id: number;
  ano: number;
  numero_semana: number;
  data_inicio: string;
  data_fim: string;
  faturamento_total: number;
  faturamento_entrada: number;
  faturamento_bar: number;
  clientes_atendidos: number;
  reservas_totais: number;
  reservas_presentes: number;
  ticket_medio: number;
  cmv_teorico: number;
  cmv_limpo: number;
  meta_semanal: number;
  atingimento?: number;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

interface ResumoDesempenho {
  total_semanas: number;
  faturamento_medio: number;
  faturamento_total_ano: number;
  clientes_medio: number;
  clientes_total_ano: number;
  ticket_medio_geral: number;
  atingimento_medio: number;
  cmv_medio: number;
}

export default function TabelaDesempenhoPage() {
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();
  const { toast } = useToast();

  const [dados, setDados] = useState<DadosDesempenho[]>([]);
  const [resumo, setResumo] = useState<ResumoDesempenho | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [creatingWeeks, setCreatingWeeks] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<DadosDesempenho | null>(null);

  // Filtros
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);
  const [anoFiltro, setAnoFiltro] = useState(
    new Date().getFullYear().toString()
  );
  const [mesFiltro, setMesFiltro] = useState('todos');
  const [filtroTexto, setFiltroTexto] = useState('');

  // URL da planilha fixa
  const URL_PLANILHA =
    'https://docs.google.com/spreadsheets/d/1WRnwl_F_tgqvQmHIyQUFtiWQVujTBk2TDL-ii0JjfAY/edit?gid=972882162#gid=972882162';

  useEffect(() => {
    setPageTitle('📈 Tabela de Desempenho');

    return () => {
      setPageTitle('');
    };
  }, [setPageTitle]);

  const carregarDados = useCallback(async () => {
    if (!selectedBar?.id) return;

    setLoading(true);
    console.log('🔄 Carregando dados de desempenho...');

    try {
      const params = new URLSearchParams({
        ano: anoFiltro,
      });

      if (mesFiltro && mesFiltro !== 'todos') {
        params.append('mes', mesFiltro);
      }

      const response = await fetch(`/api/gestao/desempenho?${params.toString()}`, {
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
      });

      const data = await response.json();

      if (data.success) {
        setDados(data.data || []);
        setResumo(data.resumo || null);
        console.log('✅ Dados carregados:', data.data?.length || 0, 'semanas');
      } else {
        console.error('❌ Erro ao carregar dados:', data.error);
        setDados([]);
        setResumo(null);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      setDados([]);
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, anoFiltro, mesFiltro]);

  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados();
    }
  }, [carregarDados, selectedBar?.id]);

  const sincronizarComGoogleSheets = async () => {
    if (!selectedBar?.id) {
      alert('Nenhum bar selecionado');
      return;
    }

    setSyncing(true);

    try {
      console.log('🔄 Iniciando sincronização com Google Sheets...');

      const response = await fetch('/api/gestao/desempenho/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
        body: JSON.stringify({
          planilha_url: URL_PLANILHA,
          substituir_existentes: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Sincronização concluída!\n\n` +
            `📥 Importados: ${result.resultados.dados_importados}\n` +
            `🔄 Atualizados: ${result.resultados.dados_atualizados}\n` +
            `📊 Total processados: ${result.resultados.total_processados}\n` +
            `❌ Erros: ${result.resultados.erros}`
        );

        // Recarregar dados após sincronização
        await carregarDados();
      } else {
        alert(`❌ Erro na sincronização:\n\n${result.error}`);
      }
    } catch (error: unknown) {
      console.error('❌ Erro na sincronização:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro na sincronização:\n\n${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  const excluirSemana = async (id: number, semana: number) => {
    if (
      !confirm(`Tem certeza que deseja excluir os dados da Semana ${semana}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/gestao/desempenho?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-data': JSON.stringify({
            bar_id: selectedBar?.id,
            permissao: 'admin',
          }),
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Semana excluída com sucesso!');
        await carregarDados();
      } else {
        alert(`❌ Erro ao excluir: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao excluir:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao excluir: ${errorMessage}`);
    }
  };

  const limparTodosDados = async () => {
    if (
      !confirm(
        '⚠️ ATENÇÃO: Isso irá excluir TODOS os dados de desempenho deste bar. Esta ação não pode ser desfeita!\n\nTem certeza que deseja continuar?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/gestao/desempenho/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar?.id,
            permissao: 'admin',
          }),
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Todos os dados foram excluídos!');
        await carregarDados();
      } else {
        alert(`❌ Erro ao limpar dados: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao limpar dados:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao limpar dados: ${errorMessage}`);
    }
  };

  const recalcularAutomatico = async () => {
    if (!selectedBar?.id) return;

    if (!confirm('🧮 Deseja recalcular TODOS os dados automaticamente com base nas fontes reais (ContaHub, Yuzer, Sympla)?\n\n⚠️ Esta ação irá sobrescrever os cálculos atuais mantendo apenas os valores manuais (CMV R$, Reservas).')) {
      return;
    }

    setRecalculating(true);

    try {
      const response = await fetch('/api/gestao/desempenho/recalcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
        body: JSON.stringify({
          recalcular_todas: true
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Recálculo Concluído!',
          description: `${result.data?.length || 0} semana(s) foram recalculadas automaticamente.`,
        });
        await carregarDados();
      } else {
        toast({
          title: '❌ Erro no Recálculo',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao recalcular:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: '❌ Erro no Recálculo',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setRecalculating(false);
    }
  };

  const criarSemanasFaltantes = async () => {
    if (!selectedBar?.id) return;

    if (!confirm('📅 Deseja criar as semanas faltantes até a semana atual (32)?\n\nIsso criará semanas da 27 até a 32 com dados zerados, prontos para serem recalculados.')) {
      return;
    }

    setCreatingWeeks(true);

    try {
      const response = await fetch('/api/gestao/desempenho/criar-semanas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
        body: JSON.stringify({
          ate_semana: 32 // Semana atual
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Semanas Criadas!',
          description: `${result.detalhes?.total_criadas || 0} semana(s) criada(s). Semanas ${result.detalhes?.semana_inicial}-${result.detalhes?.semana_final}.`,
        });
        await carregarDados();
      } else {
        toast({
          title: '❌ Erro ao Criar Semanas',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao criar semanas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: '❌ Erro ao Criar Semanas',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCreatingWeeks(false);
    }
  };

  const dadosFiltrados = dados
    .filter(item => {
      const matchTexto =
        !filtroTexto ||
        item.numero_semana.toString().includes(filtroTexto) ||
        item.data_inicio.includes(filtroTexto) ||
        item.observacoes?.toLowerCase().includes(filtroTexto.toLowerCase());

      return matchTexto;
    })
    .sort((a, b) => b.numero_semana - a.numero_semana); // Ordenação decrescente por semana

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getAtingimentoColor = (atingimento: number) => {
    if (atingimento >= 90)
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
    if (atingimento >= 75)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
  };

  const limparFiltros = () => {
    setAnoFiltro(new Date().getFullYear().toString());
    setMesFiltro('todos');
    setFiltroTexto('');
  };

  const handleEdit = (item: DadosDesempenho) => {
    setSelectedData(item);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (dados: Partial<DadosDesempenho>) => {
    if (!selectedData || !selectedBar) return;

    try {
      const response = await fetch('/api/gestao/desempenho', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify({
            bar_id: selectedBar.id,
            permissao: 'admin',
          }),
        },
        body: JSON.stringify({
          id: selectedData.id,
          ...dados,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Dados atualizados com sucesso!',
        });
        
        // Recarregar dados
        await carregarDados();
        setEditModalOpen(false);
        setSelectedData(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredModule="gestao">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Filtros Expandir/Minimizar */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setFiltrosExpanded(!filtrosExpanded)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FilterIcon className="h-5 w-5" />
                    Filtros & Configurações
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {filtrosExpanded
                      ? 'Clique para minimizar filtros'
                      : 'Clique para expandir filtros de busca'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {dadosFiltrados.length} registros
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      onClick={carregarDados}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                      />
                      Atualizar
                    </Button>
                    <Button
                      onClick={sincronizarComGoogleSheets}
                      disabled={syncing}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                      size="sm"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={recalcularAutomatico}
                      disabled={recalculating}
                      className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
                      size="sm"
                    >
                      {recalculating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Recalculando...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Recalcular
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={limparTodosDados}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Limpar Tudo
                    </Button>
                    <Button
                      onClick={criarSemanasFaltantes}
                      disabled={creatingWeeks}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      {creatingWeeks ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Criar Semanas
                        </>
                      )}
                    </Button>
                  </div>
                  {filtrosExpanded ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>
            {filtrosExpanded && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Busca Geral
                    </label>
                    <Input
                      placeholder="Pesquisar..."
                      value={filtroTexto}
                      onChange={e => setFiltroTexto(e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ano
                    </label>
                    <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white shadow-sm">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mês
                    </label>
                    <Select value={mesFiltro} onValueChange={setMesFiltro}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white shadow-sm">
                        <SelectValue placeholder="Todos os meses" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <SelectItem value="todos">Todos os meses</SelectItem>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={limparFiltros}
                      className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tabela com Ações */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Dados de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        Semana
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden sm:table-cell">
                        Período
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        Faturamento
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden lg:table-cell">
                        Clientes
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden lg:table-cell">
                        Ticket Médio
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden xl:table-cell">
                        Reservas
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden md:table-cell">
                        Meta
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        Atingimento
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltrados.map(item => {
                      const atingimento =
                        item.meta_semanal > 0
                          ? (item.faturamento_total / item.meta_semanal) * 100
                          : 0;

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200">
                            <div className="font-medium text-sm sm:text-base">
                              Semana {item.numero_semana}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 sm:hidden">
                              {item.data_inicio} - {item.data_fim}
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200 hidden sm:table-cell">
                            <div className="text-sm">
                              <div>{item.data_inicio}</div>
                              <div className="text-gray-500 dark:text-gray-500">
                                até {item.data_fim}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200">
                            <div className="font-semibold text-sm sm:text-base">
                              {formatarMoeda(item.faturamento_total)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 lg:hidden">
                              {item.clientes_atendidos} clientes
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                            {item.clientes_atendidos}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                            {formatarMoeda(item.ticket_medio)}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200 hidden xl:table-cell">
                            <div className="text-sm">
                              <div>
                                {item.reservas_presentes}/{item.reservas_totais}
                              </div>
                              <div className="text-gray-500 dark:text-gray-500">
                                {item.reservas_totais > 0
                                  ? `${((item.reservas_presentes / item.reservas_totais) * 100).toFixed(0)}%`
                                  : '-'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-gray-800 dark:text-gray-200 hidden md:table-cell">
                            {formatarMoeda(item.meta_semanal)}
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <Badge
                              className={`${getAtingimentoColor(atingimento)} text-xs`}
                            >
                              {atingimento.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                              <Button
                                onClick={() => handleEdit(item)}
                                variant="outline"
                                size="sm"
                                className="text-gray-700 dark:text-gray-300 h-8"
                              >
                                <EditIcon className="h-4 w-4 sm:mr-0 mr-2" />
                                <span className="sm:hidden">Editar</span>
                              </Button>
                              <Button
                                onClick={() =>
                                  excluirSemana(item.id, item.numero_semana)
                                }
                                variant="destructive"
                                size="sm"
                                className="h-8"
                              >
                                <TrashIcon className="h-4 w-4 sm:mr-0 mr-2" />
                                <span className="sm:hidden">Excluir</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Edição */}
      <EditarDesempenhoModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedData(null);
        }}
        dados={selectedData}
        onSave={handleSaveEdit}
      />
    </ProtectedRoute>
  );
}
