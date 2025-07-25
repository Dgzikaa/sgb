'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  BookOpen,
  Settings,
  Trash2,
  Edit,
  Eye,
  Clock,
  Users,
  FileText,
  Grid3X3,
  List,
  Zap,
  Star,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// =====================================================
// TIPOS
// =====================================================

interface Template {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  setor: string;
  tipo: string;
  frequencia: string;
  tempo_estimado: number;
  publico: boolean;
  predefinido: boolean;
  criado_em: string;
  criado_por: {
    nome: string;
    email: string;
  };
  template_tags?: Array<{
    template_tags: {
      nome: string;
      cor: string;
    };
  }>;
  estatisticas?: {
    total_usos: number;
    usos_completados: number;
    usos_em_andamento: number;
  };
}

interface Estatisticas {
  total: number;
  por_categoria: Record<string, number>;
  publicos: number;
  predefinidos: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [templates, setTemplates] = useState<Template[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    por_categoria: {},
    publicos: 0,
    predefinidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instalandoPredefinidos, setInstalandoPredefinidos] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');
  const [tipoFiltro, setTipoFiltro] = useState('all');
  const [publicoFiltro, setPublicoFiltro] = useState('all');
  const [predefinidoFiltro, setPredefinidoFiltro] = useState('all');

  const carregarTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (categoriaFiltro && categoriaFiltro !== 'all')
        params.append('categoria', categoriaFiltro);
      if (tipoFiltro && tipoFiltro !== 'all') params.append('tipo', tipoFiltro);
      if (publicoFiltro && publicoFiltro !== 'all')
        params.append('publico', publicoFiltro);
      if (predefinidoFiltro && predefinidoFiltro !== 'all')
        params.append('predefinido', predefinidoFiltro);

      const response = await api.get(`/api/templates?${params.toString()}`);

      if (response.success) {
        setTemplates(response.data || []);
        setEstatisticas(
          response.estatisticas || {
            total: 0,
            por_categoria: {},
            publicos: 0,
            predefinidos: 0,
          }
        );
      } else {
        setError(response.error || 'Erro ao carregar templates');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar templates:', err);
      setError('Erro ao carregar templates');
      toast({
        title: '❌ Erro',
        description: 'Erro ao carregar templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    busca,
    categoriaFiltro,
    tipoFiltro,
    publicoFiltro,
    predefinidoFiltro,
    toast,
  ]);

  useEffect(() => {
    carregarTemplates();
  }, [carregarTemplates]);

  const instalarTemplatesPredefinidos = async () => {
    try {
      setInstalandoPredefinidos(true);

      const response = await api.post('/api/templates', {
        action: 'install_predefined',
      });

      if (response.success) {
        await carregarTemplates();
        toast({
          title: '✅ Sucesso',
          description: response.message || 'Templates predefinidos instalados!',
        });
      } else {
        toast({
          title: '❌ Erro',
          description: response.error || 'Erro ao instalar templates',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao instalar templates:', err);
      toast({
        title: '❌ Erro',
        description: 'Erro ao instalar templates predefinidos',
        variant: 'destructive',
      });
    } finally {
      setInstalandoPredefinidos(false);
    }
  };

  const deletarTemplate = async (template: Template) => {
    if (
      !confirm(`Tem certeza que deseja deletar o template "${template.nome}"?`)
    ) {
      return;
    }

    try {
      const response = await api.delete(`/api/templates/${template.id}`);

      if (response.success) {
        await carregarTemplates();
        toast({
          title: '✅ Sucesso',
          description: 'Template deletado com sucesso!',
        });
      } else {
        toast({
          title: '❌ Erro',
          description: response.error || 'Erro ao deletar template',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao deletar template:', err);
      toast({
        title: '❌ Erro',
        description: 'Erro ao deletar template',
        variant: 'destructive',
      });
    }
  };

  const criarChecklistAPartirDeTemplate = (template: Template) => {
    router.push(`/checklists/novo?template=${template.id}`);
  };

  const editarTemplate = (template: Template) => {
    router.push(`/configuracoes/templates/editor?id=${template.id}`);
  };

  const visualizarTemplate = (template: Template) => {
    router.push(`/configuracoes/templates/visualizar?id=${template.id}`);
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('all');
    setTipoFiltro('all');
    setPublicoFiltro('all');
    setPredefinidoFiltro('all');
  };

  const getCategoriaColor = (categoria: string) => {
    const cores: Record<string, string> = {
      operacional: 'from-blue-500 to-blue-600',
      qualidade: 'from-green-500 to-green-600',
      seguranca: 'from-red-500 to-red-600',
      manutencao: 'from-yellow-500 to-yellow-600',
      atendimento: 'from-purple-500 to-purple-600',
      administrativo: 'from-gray-500 to-gray-600',
    };
    return cores[categoria?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'abertura':
        return <CheckSquare className="w-4 h-4" />;
      case 'fechamento':
        return <Clock className="w-4 h-4" />;
      case 'diario':
        return <Star className="w-4 h-4" />;
      case 'semanal':
        return <TrendingUp className="w-4 h-4" />;
      case 'mensal':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Moderno */}
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-700 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/configuracoes')}
                    className="text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </Button>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        Templates de Checklists
                      </h1>
                      <p className="text-indigo-100 mt-1">
                        Gerencie e organize templates reutilizáveis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-indigo-200">
                      Total de Templates
                    </div>
                    <div className="text-2xl font-bold">
                      {estatisticas.total}
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <BookOpen className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Total
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {estatisticas.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Templates
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Públicos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {estatisticas.publicos}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Compartilhados
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Predefinidos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {estatisticas.predefinidos}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Sistema
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Categorias
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {Object.keys(estatisticas.por_categoria || {}).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Diferentes
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Grid3X3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles e Filtros */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Filtros e Busca
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-3"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() =>
                      router.push('/configuracoes/templates/editor')
                    }
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                <div className="col-span-1 md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar templates..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <Select
                  value={categoriaFiltro}
                  onValueChange={setCategoriaFiltro}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="qualidade">Qualidade</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="atendimento">Atendimento</SelectItem>
                    <SelectItem value="administrativo">
                      Administrativo
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="abertura">Abertura</SelectItem>
                    <SelectItem value="fechamento">Fechamento</SelectItem>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={publicoFiltro} onValueChange={setPublicoFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue placeholder="Visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Públicos</SelectItem>
                    <SelectItem value="false">Privados</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limparFiltros}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              </div>

              {estatisticas.predefinidos === 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                          Templates Predefinidos
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          Instale templates prontos para usar em seu
                          estabelecimento
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={instalarTemplatesPredefinidos}
                      disabled={instalandoPredefinidos}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {instalandoPredefinidos ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Instalando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Instalar Templates
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Templates */}
          {error ? (
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Erro ao Carregar
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={carregarTemplates} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : templates.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum Template Encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Não há templates que correspondem aos filtros aplicados
                </p>
                <div className="flex items-center gap-3 justify-center">
                  <Button onClick={limparFiltros} variant="outline">
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={() =>
                      router.push('/configuracoes/templates/editor')
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {templates.map(template => (
                <Card
                  key={template.id}
                  className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${getCategoriaColor(template.categoria)} text-white`}
                        >
                          {getTipoIcon(template.tipo)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {template.nome}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {template.categoria}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.tipo}
                            </Badge>
                            {template.publico && (
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Público
                              </Badge>
                            )}
                            {template.predefinido && (
                              <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                                Sistema
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => visualizarTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editarTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!template.predefinido && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletarTemplate(template)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {template.descricao && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {template.descricao}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {template.tempo_estimado}min
                        </div>
                        <div className="text-xs text-gray-500">Tempo</div>
                      </div>

                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {template.estatisticas?.total_usos || 0}
                        </div>
                        <div className="text-xs text-gray-500">Usos</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        por {template.criado_por?.nome || 'Sistema'}
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          criarChecklistAPartirDeTemplate(template)
                        }
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Usar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
