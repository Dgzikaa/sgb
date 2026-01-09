'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Bell, 
  CheckCircle, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Calendar,
  Clock,
  Info,
  Target,
  DollarSign,
  Users,
  ChefHat,
  Package,
  RefreshCcw,
  Copy,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

interface NotificacaoDetalhes {
  id: string;
  tipo: 'critico' | 'erro' | 'aviso' | 'info' | 'sucesso';
  categoria: string;
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  acoes_sugeridas?: string[];
  url?: string;
  created_at: string;
  lido: boolean;
  // Dados específicos para contexto
  referencia_tipo?: string; // 'receita' | 'reserva' | 'evento' | 'checklist' | etc
  referencia_id?: string;
  referencia_nome?: string;
}

export default function NotificacaoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const { setPageTitle } = usePageTitle();
  const [notificacao, setNotificacao] = useState<NotificacaoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    setPageTitle('📋 Detalhes da Notificação');
  }, [setPageTitle]);

  useEffect(() => {
    if (id) {
      fetchNotificacao();
    }
  }, [id]);

  const fetchNotificacao = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notificacoes/${id}`);
      if (!response.ok) {
        throw new Error('Notificação não encontrada');
      }
      const data = await response.json();
      setNotificacao(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoLido = async () => {
    if (!notificacao) return;
    try {
      await fetch(`/api/notificacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lido: true })
      });
      setNotificacao({ ...notificacao, lido: true });
      toast.success('Marcado como lido');
    } catch {
      toast.error('Erro ao marcar como lido');
    }
  };

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado!');
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'erro':
        return <TrendingDown className="w-6 h-6 text-orange-500" />;
      case 'aviso':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'sucesso':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      default:
        return <Bell className="w-6 h-6 text-blue-500" />;
    }
  };

  const getIconByCategoria = (categoria: string) => {
    switch (categoria) {
      case 'faturamento':
      case 'ticket':
        return <DollarSign className="w-5 h-5" />;
      case 'cmv':
        return <Target className="w-5 h-5" />;
      case 'clientes':
        return <Users className="w-5 h-5" />;
      case 'receitas':
      case 'estoque':
        return <ChefHat className="w-5 h-5" />;
      case 'reservas':
        return <Calendar className="w-5 h-5" />;
      case 'checklist':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'erro':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'aviso':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'sucesso':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrlPorCategoria = (categoria: string): string => {
    const urlMap: Record<string, string> = {
      'faturamento': '/estrategico/visao-geral',
      'meta': '/estrategico/visao-geral',
      'cmv': '/ferramentas/cmv-semanal',
      'ticket': '/analitico',
      'checklist': '/configuracoes/checklists',
      'estoque': '/configuracoes/fichas-tecnicas',
      'receitas': '/configuracoes/fichas-tecnicas',
      'reservas': '/ferramentas/calendario',
      'clientes': '/analitico/clientes',
    };
    return urlMap[categoria] || '/alertas';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !notificacao) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Notificação não encontrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {error || 'A notificação que você está procurando não existe ou foi removida.'}
              </p>
              <Button onClick={() => router.push('/alertas')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Alertas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        
        {/* Navegação */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => router.push('/alertas')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Central de Alertas
          </Button>
        </motion.div>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
            !notificacao.lido ? 'border-l-4 border-l-blue-500' : ''
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getBadgeClass(notificacao.tipo)}`}>
                    {getIconByTipo(notificacao.tipo)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={getBadgeClass(notificacao.tipo)}>
                        {notificacao.tipo.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getIconByCategoria(notificacao.categoria)}
                        {notificacao.categoria}
                      </Badge>
                      {!notificacao.lido && (
                        <Badge className="bg-blue-500 text-white">
                          Não lido
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {notificacao.titulo}
                    </CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopiarLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Mensagem Principal */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {notificacao.mensagem}
                </p>
              </div>

              {/* Data e Hora */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {formatarData(notificacao.created_at)}
              </div>

              {/* Dados do Contexto */}
              {notificacao.dados && Object.keys(notificacao.dados).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Dados do Alerta
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(notificacao.dados).map(([key, value]) => (
                      <div 
                        key={key}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {typeof value === 'number' && (key.includes('faturamento') || key.includes('meta') || key.includes('ticket'))
                            ? (value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : typeof value === 'number' && key.includes('percentual')
                              ? `${(value as number).toFixed(1)}%`
                              : String(value)
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações Sugeridas */}
              {notificacao.acoes_sugeridas && notificacao.acoes_sugeridas.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Ações Sugeridas
                  </h4>
                  <ul className="space-y-2">
                    {notificacao.acoes_sugeridas.map((acao, i) => (
                      <li 
                        key={i}
                        className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {acao}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Referência Específica (se houver) */}
              {notificacao.referencia_nome && (
                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Item Relacionado
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Este alerta está relacionado a:
                  </p>
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {notificacao.referencia_tipo}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {notificacao.referencia_nome}
                      </p>
                    </div>
                    {notificacao.referencia_id && (
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visualizar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!notificacao.lido && (
                  <Button onClick={handleMarcarComoLido}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Lido
                  </Button>
                )}
                
                <Link href={notificacao.url || getUrlPorCategoria(notificacao.categoria)}>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir para {notificacao.categoria}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
