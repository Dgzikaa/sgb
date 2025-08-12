'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layouts/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  BellRing,
  Search,
  Filter,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  RefreshCw,
  Calendar,
  Clock,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FiltrosNotificacao {
  status?: 'pendente' | 'enviada' | 'lida' | 'descartada';
  modulo?: string;
  tipo?: string;
  prioridade?: string;
  apenas_nao_lidas?: boolean;
}

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criada_em: string;
  dados?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    notificacoes,
    loading,
    error,
    estatisticas,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    recarregar,
    limparErro,
  } = useNotifications();

  // Estados
  const [filtros, setFiltros] = useState<FiltrosNotificacao>({});
  const [busca, setBusca] = useState('');
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    carregarNotificacoes(filtros);
  }, [carregarNotificacoes, filtros]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        recarregar();
      }, 30000); // Auto-refresh a cada 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, recarregar]);

  // Handlers
  const handleMarcarComoLida = async (id: string) => {
    try {
      await marcarComoLida(id);
      await carregarNotificacoes();
    } catch (error: unknown) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    const sucesso = await marcarTodasComoLidas();
    if (sucesso) {
      setSelecionadas([]);
    }
  };

  const handleExcluirNotificacao = async (id: string) => {
    const sucesso = await excluirNotificacao(id);
    if (sucesso) {
      setSelecionadas(prev => prev.filter(item => item !== id));
    }
  };

  const handleExcluirSelecionadas = async () => {
    for (const id of selecionadas) {
      await excluirNotificacao(id);
    }
    setSelecionadas([]);
  };

  const handleBusca = (termo: string) => {
    setBusca(termo);
    carregarNotificacoes({ ...filtros });
  };

  const handleFiltros = (novosFiltros: FiltrosNotificacao) => {
    setFiltros(novosFiltros);
    carregarNotificacoes(novosFiltros);
  };

  const handleRefresh = () => {
    recarregar();
  };

  const handleSelecionarTodos = () => {
    if (selecionadas.length === notificacoes.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(notificacoes.map(n => n.id));
    }
  };

  const limparFiltros = () => {
    setFiltros({});
    setBusca('');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'erro':
        return <X className="w-4 h-4" />;
      case 'alerta':
        return <AlertTriangle className="w-4 h-4" />;
      case 'sucesso':
        return <CheckCircle className="w-4 h-4" />;
      case 'info':
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'erro':
        return 'from-red-500 to-red-600';
      case 'alerta':
        return 'from-yellow-500 to-yellow-600';
      case 'sucesso':
        return 'from-green-500 to-green-600';
      case 'info':
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getModuloColor = (modulo: string) => {
    switch (modulo) {
      case 'checklists':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'metas':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'relatorios':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'dashboard':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100';
      case 'sistema':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const notificacoesFiltradas = notificacoes.filter(notificacao => {
    if (
      busca &&
      !notificacao.titulo.toLowerCase().includes(busca.toLowerCase()) &&
      !notificacao.mensagem.toLowerCase().includes(busca.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (loading && notificacoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando notificações...
          </p>
        </div>
      </div>
    );
  }

  const handleNotificacaoClick = (notificacao: Record<string, unknown>) => {
    // Marcar como lida
    marcarComoLida(notificacao.id as string);

    // Navegar para a página correspondente
    const tipo = notificacao.tipo as string;
    const dados = notificacao.dados as Record<string, unknown>;

    switch (tipo) {
      case 'checklist':
        router.push(`/funcionario/checklists/${dados.checklist_id}`);
        break;
      case 'relatorio':
        router.push(`/relatorios/${dados.relatorio_id}`);
        break;
      case 'sistema':
        router.push('/configuracoes');
        break;
      default:
        router.push('/usuarios/notifications');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        <PageHeader
          title="Central de Notificações"
          description="Gerencie todas as suas notificações e alertas"
          actions={
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Não Lidas</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {estatisticas?.nao_lidas || 0}
                </div>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <BellRing className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
          }
        />

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total da Semana
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {estatisticas?.total_semana || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Últimos 7 dias
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Não Lidas
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {estatisticas?.nao_lidas || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Requer atenção
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <BellRing className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Alta Prioridade
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {estatisticas?.alta_prioridade || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Urgente
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Notificações Browser
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    Ativas
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Funcionando
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles e Filtros */}
        <Card className="card-dark shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Filtros e Ações
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh
                  </Label>
                </div>
                <Button
                  onClick={recarregar}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                  />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar notificações..."
                  value={busca}
                  onChange={e => handleBusca(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700"
                />
              </div>

              <Select
                value={filtros.status || ''}
                onValueChange={value =>
                  handleFiltros({
                    ...filtros,
                    status:
                      (value as
                        | 'pendente'
                        | 'enviada'
                        | 'lida'
                        | 'descartada') || undefined,
                  })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="lida">Lidas</SelectItem>
                  <SelectItem value="pendente">Não Lidas</SelectItem>
                  <SelectItem value="descartada">Descartadas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.modulo || ''}
                onValueChange={value =>
                  handleFiltros({ ...filtros, modulo: value || undefined })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-700">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="checklists">Checklists</SelectItem>
                  <SelectItem value="metas">Metas</SelectItem>
                  <SelectItem value="relatorios">Relatórios</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.prioridade || ''}
                onValueChange={value =>
                  handleFiltros({ ...filtros, prioridade: value || undefined })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-700">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={limparFiltros} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"></div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleMarcarTodasComoLidas}
                  variant="outline"
                  size="sm"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar Todas como Lidas
                </Button>
                <Button
                  onClick={handleExcluirSelecionadas}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Selecionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        {error ? (
          <Card className="card-dark shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Erro ao Carregar
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={recarregar} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : notificacoesFiltradas.length === 0 ? (
          <Card className="card-dark shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma Notificação
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {busca || Object.keys(filtros).length > 0
                  ? 'Não há notificações que correspondem aos filtros aplicados'
                  : 'Você está em dia! Não há notificações no momento'}
              </p>
              {(busca || Object.keys(filtros).length > 0) && (
                <Button onClick={limparFiltros} variant="outline">
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notificacoesFiltradas.map(notificacao => (
              <Card
                key={notificacao.id}
                className={`card-dark border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                  notificacao.status === 'pendente'
                    ? 'ring-2 ring-blue-200 dark:ring-blue-800'
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${getTipoColor(notificacao.tipo)} text-white flex-shrink-0`}
                      >
                        {getTipoIcon(notificacao.tipo)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {notificacao.titulo}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {notificacao.mensagem}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={getModuloColor(notificacao.modulo)}>
                            {notificacao.modulo}
                          </Badge>
                          <Badge
                            className={getPrioridadeColor(
                              notificacao.prioridade
                            )}
                          >
                            {notificacao.prioridade}
                          </Badge>
                          {notificacao.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {notificacao.categoria}
                            </Badge>
                          )}
                          {notificacao.status === 'pendente' && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              Não lida
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(
                                new Date(notificacao.criada_em),
                                {
                                  addSuffix: true,
                                  locale: ptBR,
                                }
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notificacao.acoes?.map((acao, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (acao.action === 'redirect' && acao.url) {
                                    router.push(acao.url);
                                  }
                                }}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {acao.label}
                              </Button>
                            ))}

                            {notificacao.status === 'pendente' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleMarcarComoLida(notificacao.id as string)
                                }
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleExcluirNotificacao(
                                  notificacao.id as string
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
