'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Send, 
  Mail, 
  MessageCircle, 
  Ticket,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Trash2
} from 'lucide-react';

interface Campanha {
  id: string;
  nome: string;
  tipo: 'whatsapp' | 'email' | 'cupom';
  segmento_alvo: string[];
  template_mensagem: string;
  cupom_desconto?: number;
  cupom_codigo?: string;
  cupom_validade?: string;
  agendamento?: string;
  status: 'rascunho' | 'agendada' | 'em_execucao' | 'concluida' | 'cancelada';
  criado_em: string;
  enviados: number;
  abertos: number;
  cliques: number;
  conversoes: number;
}

interface Template {
  nome: string;
  tipo: 'whatsapp' | 'email';
  conteudo: string;
  variaveis: string[];
  categoria: string;
}

const SEGMENTOS = [
  { value: 'VIP Champions', label: '⭐ VIP Champions', cor: 'purple' },
  { value: 'Clientes Fiéis', label: '💎 Clientes Fiéis', cor: 'blue' },
  { value: 'Grande Potencial', label: '🚀 Grande Potencial', cor: 'green' },
  { value: 'Em Risco (Churn)', label: '⚠️ Em Risco (Churn)', cor: 'orange' },
  { value: 'Novos Promissores', label: '✨ Novos Promissores', cor: 'cyan' },
  { value: 'Regulares', label: '📊 Regulares', cor: 'gray' },
  { value: 'Inativos', label: '💤 Inativos', cor: 'red' },
];

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [templates, setTemplates] = useState<{ whatsapp: Template[]; email: Template[] }>({ whatsapp: [], email: [] });
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [criandoCampanha, setCriandoCampanha] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'whatsapp' | 'email'>('whatsapp');
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [mensagemCustom, setMensagemCustom] = useState('');
  const [cupomDesconto, setCupomDesconto] = useState(20);
  const [cupomValidade, setCupomValidade] = useState(7);
  const [executarAgora, setExecutarAgora] = useState(true);

  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/campanhas');
      const result = await response.json();

      if (result.success) {
        setCampanhas(result.data);
        setTemplates({
          whatsapp: result.templates_whatsapp || [],
          email: result.templates_email || []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const criarCampanha = async () => {
    if (!nome || segmentosSelecionados.length === 0) {
      alert('Preencha o nome e selecione pelo menos um segmento');
      return;
    }

    setCriandoCampanha(true);
    try {
      const response = await fetch('/api/crm/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          tipo,
          segmento_alvo: segmentosSelecionados,
          template_id: templateSelecionado || undefined,
          template_custom: mensagemCustom || undefined,
          cupom_desconto: cupomDesconto,
          cupom_validade_dias: cupomValidade,
          executar_agora: executarAgora
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.mensagem);
        setModalAberto(false);
        resetForm();
        fetchCampanhas();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      alert('Erro ao criar campanha');
    } finally {
      setCriandoCampanha(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setTipo('whatsapp');
    setSegmentosSelecionados([]);
    setTemplateSelecionado('');
    setMensagemCustom('');
    setCupomDesconto(20);
    setCupomValidade(7);
    setExecutarAgora(true);
  };

  const cancelarCampanha = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta campanha?')) return;

    try {
      const response = await fetch(`/api/crm/campanhas?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Campanha cancelada com sucesso!');
        fetchCampanhas();
      }
    } catch (error) {
      console.error('Erro ao cancelar campanha:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge className="bg-gray-500">📝 Rascunho</Badge>;
      case 'agendada':
        return <Badge className="bg-blue-600">📅 Agendada</Badge>;
      case 'em_execucao':
        return <Badge className="bg-yellow-600">⚡ Executando</Badge>;
      case 'concluida':
        return <Badge className="bg-green-600">✅ Concluída</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-600">❌ Cancelada</Badge>;
      default:
        return <Badge>-</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return <Badge className="bg-green-600"><MessageCircle className="w-3 h-3 mr-1" /> WhatsApp</Badge>;
      case 'email':
        return <Badge className="bg-blue-600"><Mail className="w-3 h-3 mr-1" /> Email</Badge>;
      case 'cupom':
        return <Badge className="bg-purple-600"><Ticket className="w-3 h-3 mr-1" /> Cupom</Badge>;
      default:
        return <Badge>-</Badge>;
    }
  };

  const toggleSegmento = (segmento: string) => {
    if (segmentosSelecionados.includes(segmento)) {
      setSegmentosSelecionados(segmentosSelecionados.filter(s => s !== segmento));
    } else {
      setSegmentosSelecionados([...segmentosSelecionados, segmento]);
    }
  };

  // Estatísticas gerais
  const stats = {
    total: campanhas.length,
    ativas: campanhas.filter(c => c.status === 'concluida').length,
    total_enviados: campanhas.reduce((sum, c) => sum + (c.enviados || 0), 0),
    taxa_abertura: campanhas.length > 0
      ? ((campanhas.reduce((sum, c) => sum + (c.abertos || 0), 0) / Math.max(campanhas.reduce((sum, c) => sum + (c.enviados || 0), 0), 1)) * 100).toFixed(1)
      : '0',
    taxa_conversao: campanhas.length > 0
      ? ((campanhas.reduce((sum, c) => sum + (c.conversoes || 0), 0) / Math.max(campanhas.reduce((sum, c) => sum + (c.enviados || 0), 0), 1)) * 100).toFixed(1)
      : '0'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📢 Campanhas Automáticas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              WhatsApp, Email e Cupons de Desconto Personalizados
            </p>
          </div>

          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Criar Nova Campanha</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Configure sua campanha de marketing personalizada
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Nome */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    Nome da Campanha
                  </label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Reengajamento Black Friday"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    Tipo de Campanha
                  </label>
                  <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Segmentos */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    Segmentos Alvo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEGMENTOS.map(seg => (
                      <Button
                        key={seg.value}
                        type="button"
                        variant={segmentosSelecionados.includes(seg.value) ? "default" : "outline"}
                        className={`justify-start ${
                          segmentosSelecionados.includes(seg.value)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-white dark:bg-gray-700'
                        }`}
                        onClick={() => toggleSegmento(seg.value)}
                      >
                        {seg.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Template */}
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    Template de Mensagem
                  </label>
                  <Select value={templateSelecionado} onValueChange={setTemplateSelecionado}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Selecione um template ou personalize" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Mensagem Personalizada</SelectItem>
                      {(tipo === 'whatsapp' ? templates.whatsapp : templates.email).map(t => (
                        <SelectItem key={t.nome} value={t.nome}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview do Template */}
                {templateSelecionado && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {(tipo === 'whatsapp' ? templates.whatsapp : templates.email)
                        .find(t => t.nome === templateSelecionado)?.conteudo}
                    </div>
                  </div>
                )}

                {/* Mensagem Custom */}
                {!templateSelecionado && (
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                      Mensagem Personalizada
                    </label>
                    <Textarea
                      value={mensagemCustom}
                      onChange={(e) => setMensagemCustom(e.target.value)}
                      placeholder="Digite sua mensagem... Use {nome}, {cupom_desconto}, {cupom_codigo}, {cupom_validade}"
                      rows={6}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}

                {/* Cupom */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                      Desconto (%)
                    </label>
                    <Input
                      type="number"
                      value={cupomDesconto}
                      onChange={(e) => setCupomDesconto(parseInt(e.target.value))}
                      min={0}
                      max={100}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                      Validade (dias)
                    </label>
                    <Input
                      type="number"
                      value={cupomValidade}
                      onChange={(e) => setCupomValidade(parseInt(e.target.value))}
                      min={1}
                      max={365}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* Executar */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="executar_agora"
                    checked={executarAgora}
                    onChange={(e) => setExecutarAgora(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="executar_agora" className="text-sm text-gray-900 dark:text-white">
                    Executar campanha imediatamente
                  </label>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={criarCampanha}
                    disabled={criandoCampanha}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {criandoCampanha ? (
                      <>Criando...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {executarAgora ? 'Criar e Enviar' : 'Criar Campanha'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setModalAberto(false)}
                    variant="outline"
                    className="bg-white dark:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Campanhas</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Concluídas</div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.ativas}</div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Mensagens Enviadas</div>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total_enviados}</div>
                  </div>
                  <Send className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Taxa Abertura</div>
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.taxa_abertura}%</div>
                  </div>
                  <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Taxa Conversão</div>
                    <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.taxa_conversao}%</div>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Campanhas */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Histórico de Campanhas</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Todas as campanhas criadas e seus resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : campanhas.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhuma campanha criada ainda. Crie sua primeira campanha!
              </div>
            ) : (
              <div className="space-y-4">
                {campanhas.map((campanha) => (
                  <Card key={campanha.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {campanha.nome}
                          </h3>
                          <div className="flex gap-2 flex-wrap">
                            {getTipoBadge(campanha.tipo)}
                            {getStatusBadge(campanha.status)}
                            {campanha.segmento_alvo.map(seg => (
                              <Badge key={seg} variant="outline" className="text-xs">
                                {seg}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {campanha.status === 'agendada' && (
                          <Button
                            onClick={() => cancelarCampanha(campanha.id)}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </div>

                      {/* Cupom Info */}
                      {campanha.cupom_codigo && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                              {campanha.cupom_codigo}
                            </span>
                            <span className="text-purple-600 dark:text-purple-400">
                              {campanha.cupom_desconto}% OFF
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              até {new Date(campanha.cupom_validade!).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Métricas */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {campanha.enviados || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Enviados</div>
                        </div>

                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {campanha.abertos || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Abertos</div>
                        </div>

                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {campanha.cliques || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Cliques</div>
                        </div>

                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {campanha.conversoes || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Conversões</div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        Criada em: {new Date(campanha.criado_em).toLocaleString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

