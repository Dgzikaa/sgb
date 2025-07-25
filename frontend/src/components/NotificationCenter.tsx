'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useNotifications,
  getColorByType,
  getColorByPriority,
  formatarTempo,
} from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  User,
  Trash2,
  RefreshCw,
} from 'lucide-react';

// Interfaces para tipagem
interface NotificacaoAcao {
  action: 'redirect' | 'download';
  url?: string;
  label?: string;
}

interface Notificacao {
  id: string;
  titulo?: string;
  mensagem?: string;
  tipo?: string;
  prioridade?: string;
  status?: string;
  criada_em?: string;
  acoes?: NotificacaoAcao[];
}

// Type guard
function isNotificacaoAcao(obj: unknown): obj is NotificacaoAcao {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'action' in obj &&
    typeof (obj as NotificacaoAcao).action === 'string'
  );
}

// =====================================================
// NOTIFICATION CENTER COMPONENT
// =====================================================

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filtroTab, setFiltroTab] = useState<
    'todas' | 'nao_lidas' | 'importantes'
  >('todas');
  const [configuracoes, setConfiguracoes] = useState({
    autoRefresh: true,
    showBadge: true,
    playSound: false,
    refreshInterval: 30000, // 30 segundos
  });

  // =====================================================
  // HOOKS E REFS
  // =====================================================

  const {
    notificacoes,
    estatisticas,
    loading,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    recarregar,
  } = useNotifications();

  const hasInitializedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // =====================================================
  // CARREGAMENTO INICIAL (APENAS UMA VEZ)
  // =====================================================

  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Carregar notificações iniciais
      carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 });

      hasInitializedRef.current = true;
    }

    // Cleanup ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // DEPENDÊNCIAS VAZIAS - executar apenas uma vez

  // =====================================================
  // CONTROLE DE POLLING VIA CONFIGURAÇÕES
  // =====================================================

  useEffect(() => {
    if (configuracoes.autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        if (!loading) {
          carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 });
        }
      }, configuracoes.refreshInterval);
    }
  }, [carregarNotificacoes]);

  // =====================================================
  // FILTRAR NOTIFICAÇÕES
  // =====================================================

  const notificacoesFiltradas = notificacoes.filter(notificacao => {
    // Verificar se a notificação tem dados válidos
    if (!notificacao || !notificacao.id) return false;

    if (filtroTab === 'nao_lidas') {
      return ['pendente', 'enviada'].includes(notificacao.status || '');
    }
    if (filtroTab === 'importantes') {
      return ['alta', 'critica'].includes(notificacao.prioridade || '');
    }
    return true; // todas
  });

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleMarcarComoLida = async (notificacaoId: string) => {
    try {
      if (!notificacaoId) {
        console.error('❌ ID da notificação não fornecido');
        return;
      }

      await marcarComoLida(notificacaoId);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    try {
      await marcarTodasComoLidas();
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
    }
  };

  const handleExcluirNotificacao = async (notificacaoId: string) => {
    try {
      if (!notificacaoId) {
        console.error('❌ ID da notificação não fornecido');
        return;
      }

      await excluirNotificacao(notificacaoId);
    } catch (error) {
      console.error('❌ Erro ao excluir notificação:', error);
    }
  };

  const handleAcaoNotificacao = (acao: NotificacaoAcao) => {
    try {
      if (!acao) {
        console.error('❌ Ação não fornecida');
        return;
      }

      if (acao.action === 'redirect' && acao.url) {
        router.push(acao.url);
        setIsOpen(false);
      } else if (acao.action === 'download' && acao.url) {
        window.open(acao.url, '_blank');
      }
    } catch (error) {
      console.error('❌ Erro ao executar ação da notificação:', error);
    }
  };

  const handleRefreshManual = () => {
    carregarNotificacoes({ apenas_nao_lidas: false, limit: 20 });
  };

  const handleToggleAutoRefresh = (enabled: boolean) => {
    setConfiguracoes(prev => ({ ...prev, autoRefresh: enabled }));
  };

  const handleChangeInterval = (interval: number) => {
    setConfiguracoes(prev => ({ ...prev, refreshInterval: interval }));
  };

  // =====================================================
  // CONTADORES
  // =====================================================

  const totalNaoLidas = estatisticas?.nao_lidas || 0;
  const totalImportantes = estatisticas?.alta_prioridade || 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {configuracoes.showBadge && totalNaoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="card-dark w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="card-title-dark flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshManual}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>📬 {totalNaoLidas} não lidas</span>
              <span>🔥 {totalImportantes} importantes</span>
              <span>📊 {notificacoes.length} total</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Tabs de Filtro */}
            <Tabs
              value={filtroTab}
              onValueChange={(value: string) =>
                setFiltroTab(value as 'todas' | 'nao_lidas' | 'importantes')
              }
            >
              <TabsList className="tabs-list-dark w-full rounded-none">
                <TabsTrigger value="todas" className="tabs-trigger-dark">
                  Todas ({notificacoes.length})
                </TabsTrigger>
                <TabsTrigger value="nao_lidas" className="tabs-trigger-dark">
                  Não Lidas ({totalNaoLidas})
                </TabsTrigger>
                <TabsTrigger value="importantes" className="tabs-trigger-dark">
                  Importantes ({totalImportantes})
                </TabsTrigger>
              </TabsList>

              {/* Lista de Notificações */}
              <ScrollArea className="h-96">
                <div className="p-4 space-y-3">
                  {loading && notificacoes.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">
                        Carregando...
                      </span>
                    </div>
                  ) : notificacoesFiltradas.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {filtroTab === 'todas'
                          ? 'Nenhuma notificação'
                          : filtroTab === 'nao_lidas'
                            ? 'Todas as notificações foram lidas'
                            : 'Nenhuma notificação importante'}
                      </p>
                    </div>
                  ) : (
                    notificacoesFiltradas.map(notificacao => (
                      <Card
                        key={notificacao.id}
                        className="card-dark p-3 space-y-2"
                      >
                        {/* Header da Notificação */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${getColorByType(notificacao.tipo || 'info')} text-xs`}
                            >
                              {(notificacao.tipo || 'INFO').toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getColorByPriority(notificacao.prioridade || 'media')} text-xs`}
                            >
                              {(
                                notificacao.prioridade || 'MEDIA'
                              ).toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            {['pendente', 'enviada'].includes(
                              notificacao.status || ''
                            ) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarcarComoLida(notificacao.id)
                                }
                                className="h-6 w-6 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleExcluirNotificacao(notificacao.id)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Conteúdo da Notificação */}
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                            {notificacao.titulo || 'Notificação sem título'}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {notificacao.mensagem || 'Sem mensagem'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {notificacao.criada_em
                              ? formatarTempo(notificacao.criada_em)
                              : 'Sem data'}
                          </p>
                        </div>

                        {/* Ações da Notificação */}
                        {notificacao.acoes &&
                          Array.isArray(notificacao.acoes) &&
                          notificacao.acoes.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {notificacao.acoes.map((acao, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAcaoNotificacao(acao)}
                                  className="h-6 text-xs"
                                >
                                  {acao.action === 'redirect' && (
                                    <User className="h-3 w-3 mr-1" />
                                  )}
                                  {acao.action === 'download' && (
                                    <Info className="h-3 w-3 mr-1" />
                                  )}
                                  {acao.label || 'Ação'}
                                </Button>
                              ))}
                            </div>
                          )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Tabs>

            {/* Footer com Ações Rápidas */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {/* Ações Rápidas */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarcarTodasComoLidas}
                  disabled={totalNaoLidas === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar todas como lidas
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/usuarios/notifications')}
                >
                  Ver todas
                </Button>
              </div>

              {/* Configurações Rápidas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Atualização automática
                  </span>
                  <Switch
                    checked={configuracoes.autoRefresh}
                    onCheckedChange={handleToggleAutoRefresh}
                  />
                </div>

                {configuracoes.autoRefresh && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Intervalo:
                    </span>
                    <select
                      value={configuracoes.refreshInterval}
                      onChange={e =>
                        handleChangeInterval(parseInt(e.target.value))
                      }
                      className="input-dark text-xs h-6 px-2 py-0"
                    >
                      <option value={15000}>15s</option>
                      <option value={30000}>30s</option>
                      <option value={60000}>1min</option>
                      <option value={300000}>5min</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
