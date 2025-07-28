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
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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

  const [dados, setDados] = useState<DadosDesempenho[]>([]);
  const [resumo, setResumo] = useState<ResumoDesempenho | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

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

      const response = await fetch(`/api/desempenho?${params.toString()}`, {
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

              const response = await fetch('/api/configuracoes/desempenho/sync-sheets-service', {
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
      const response = await fetch(`/api/desempenho?id=${id}`, {
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
              const response = await fetch('/api/configuracoes/desempenho/clear-all', {
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
      return 'bg-green-100 text-green-800 border-green-200';
    if (atingimento >= 75)
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const limparFiltros = () => {
    setAnoFiltro(new Date().getFullYear().toString());
    setMesFiltro('todos');
    setFiltroTexto('');
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredModule="7" errorMessage="sem_permissao_desempenho">
      <div className="space-y-6 p-6">
        {/* Filtros Expandir/Minimizar */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setFiltrosExpanded(!filtrosExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FilterIcon className="h-5 w-5" />
                  Filtros & Configurações
                </CardTitle>
                <CardDescription>
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
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                    />
                    Atualizar
                  </Button>
                  <Button
                    onClick={sincronizarComGoogleSheets}
                    disabled={syncing}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
                    onClick={limparTodosDados}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                  <Button
                    onClick={() =>
                      alert('🚧 Funcionalidade de criação em desenvolvimento')
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nova Semana
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Busca Geral
                  </label>
                  <Input
                    placeholder="Pesquisar..."
                    value={filtroTexto}
                    onChange={e => setFiltroTexto(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 shadow-sm"
                    style={{ colorScheme: 'light' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ano
                  </label>
                  <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 shadow-sm">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mês
                  </label>
                  <Select value={mesFiltro} onValueChange={setMesFiltro}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 shadow-sm">
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
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
                    className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabela com Ações */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Dados de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="table-responsive">
              <table className="table-mobile">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm">
                      Semana
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm hidden-mobile">
                      Período
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm">
                      Faturamento
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm hidden-mobile">
                      Clientes
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm hidden-mobile">
                      Ticket Médio
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm hidden-mobile">
                      Reservas
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm hidden-mobile">
                      Meta
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm">
                      Atingimento
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 text-xs sm:text-sm">
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
                        className="border-b border-slate-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 sm:px-4 text-slate-800">
                          <div className="font-medium text-sm sm:text-base">
                            Semana {item.numero_semana}
                          </div>
                          <div className="text-xs text-gray-500 visible-mobile">
                            {item.data_inicio} - {item.data_fim}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800 hidden-mobile">
                          <div className="text-sm">
                            <div>{item.data_inicio}</div>
                            <div className="text-gray-500">
                              até {item.data_fim}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800">
                          <div className="font-semibold text-sm sm:text-base">
                            {formatarMoeda(item.faturamento_total)}
                          </div>
                          <div className="text-xs text-gray-500 visible-mobile">
                            {item.clientes_atendidos} clientes
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800 hidden-mobile">
                          {item.clientes_atendidos}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800 hidden-mobile">
                          {formatarMoeda(item.ticket_medio)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800 hidden-mobile">
                          <div className="text-sm">
                            <div>
                              {item.reservas_presentes}/{item.reservas_totais}
                            </div>
                            <div className="text-gray-500">
                              {item.reservas_totais > 0
                                ? `${((item.reservas_presentes / item.reservas_totais) * 100).toFixed(0)}%`
                                : '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-slate-800 hidden-mobile">
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
                              onClick={() =>
                                alert('🚧 Modal de edição em desenvolvimento')
                              }
                              variant="outline"
                              size="sm"
                              className="btn-icon-touch sm:h-8 sm:w-8 sm:p-0"
                            >
                              <EditIcon className="h-4 w-4" />
                              <span className="visible-mobile ml-2">
                                Editar
                              </span>
                            </Button>
                            <Button
                              onClick={() =>
                                excluirSemana(item.id, item.numero_semana)
                              }
                              variant="destructive"
                              size="sm"
                              className="btn-icon-touch sm:h-8 sm:w-8 sm:p-0"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span className="visible-mobile ml-2">
                                Excluir
                              </span>
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
    </ProtectedRoute>
  );
}
