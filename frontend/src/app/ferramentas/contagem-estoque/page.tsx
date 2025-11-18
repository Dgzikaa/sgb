'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  History,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw,
  Filter,
  Search,
  MapPin,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Alerta {
  tipo: string;
  severidade: 'critico' | 'alto' | 'medio' | 'info';
  mensagem: string;
  sugestao?: string;
  dados?: any;
}

interface ContagemData {
  id: number;
  categoria: string;
  descricao: string;
  estoque_fechado: number;
  estoque_flutuante: number;
  estoque_total: number;
  preco: number;
  valor_total: number;
  data_contagem: string;
  variacao_percentual: number | null;
  alerta_variacao: boolean;
  alerta_preenchimento: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  area_id: number | null;
}

interface Area {
  id: number;
  nome: string;
  tipo: string;
  ativo: boolean;
}

const CATEGORIAS = [
  'Bebidas',
  'Alimentos',
  'Insumos',
  'Descartáveis',
  'Limpeza',
  'Outros'
];

export default function ContagemEstoquePage() {
  // Estados do formulário
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoqueFechado, setEstoqueFechado] = useState('');
  const [estoqueFlutuante, setEstoqueFlutuante] = useState('');
  const [preco, setPreco] = useState('');
  const [dataContagem, setDataContagem] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [areaId, setAreaId] = useState<string>('');

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [contagens, setContagens] = useState<ContagemData[]>([]);
  const [loadingContagens, setLoadingContagens] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState(false);
  const [filtroArea, setFiltroArea] = useState('');
  const [busca, setBusca] = useState('');

  // Tab ativa
  const [activeTab, setActiveTab] = useState('registrar');

  // Buscar áreas ao carregar
  useEffect(() => {
    buscarAreas();
  }, []);

  // Carregar contagens ao mudar de tab
  useEffect(() => {
    if (activeTab === 'lista') {
      buscarContagens();
    }
  }, [activeTab, filtroCategoria, filtroAlerta, filtroArea]);

  const buscarAreas = async () => {
    try {
      const response = await fetch('/api/operacoes/areas-contagem?ativas=true');
      const result = await response.json();
      if (result.success) {
        setAreas(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
    }
  };

  const buscarContagens = async () => {
    setLoadingContagens(true);
    try {
      const params = new URLSearchParams({
        limit: '50'
      });
      
      if (filtroCategoria) {
        params.append('categoria', filtroCategoria);
      }
      
      if (filtroAlerta) {
        params.append('alertas', 'true');
      }

      const response = await fetch(`/api/operacoes/contagem-estoque?${params}`);
      const result = await response.json();

      if (result.success) {
        setContagens(result.data || []);
      } else {
        toast.error('Erro ao buscar contagens');
      }
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
      toast.error('Erro ao buscar contagens');
    } finally {
      setLoadingContagens(false);
    }
  };

  const validarPreenchimento = () => {
    const alertasTemp: Alerta[] = [];

    // Validação 1: Campos obrigatórios
    if (!categoria) {
      alertasTemp.push({
        tipo: 'campo_obrigatorio',
        severidade: 'critico',
        mensagem: 'Categoria é obrigatória'
      });
    }

    if (!descricao) {
      alertasTemp.push({
        tipo: 'campo_obrigatorio',
        severidade: 'critico',
        mensagem: 'Descrição é obrigatória'
      });
    }

    // Validação 2: Valores numéricos
    const fechado = parseFloat(estoqueFechado) || 0;
    const flutuante = parseFloat(estoqueFlutuante) || 0;
    const precoNum = parseFloat(preco) || 0;
    const total = fechado + flutuante;

    // Validação 3: Detectar possível erro de digitação (muitos zeros)
    const totalStr = total.toString();
    if (totalStr.length > 4 && /0{3,}/.test(totalStr)) {
      alertasTemp.push({
        tipo: 'erro_digitacao',
        severidade: 'alto',
        mensagem: '⚠️ Valor suspeito: muitos zeros consecutivos',
        sugestao: `Você quis dizer ${(total / 1000).toFixed(2)}?`
      });
    }

    // Validação 4: Número muito alto
    if (total > 10000) {
      alertasTemp.push({
        tipo: 'valor_alto',
        severidade: 'medio',
        mensagem: '⚠️ Estoque muito alto',
        sugestao: 'Confirme se o valor está correto'
      });
    }

    // Validação 5: Preço zerado com estoque
    if (total > 0 && precoNum === 0) {
      alertasTemp.push({
        tipo: 'preco_zerado',
        severidade: 'medio',
        mensagem: 'Produto com estoque mas sem preço',
        sugestao: 'Considere informar o preço'
      });
    }

    setAlertas(alertasTemp);
    return alertasTemp.filter(a => a.severidade === 'critico').length === 0;
  };

  const salvarContagem = async () => {
    // Validar antes de enviar
    if (!validarPreenchimento()) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/operacoes/contagem-estoque', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoria,
          descricao,
          estoque_fechado: parseFloat(estoqueFechado) || 0,
          estoque_flutuante: parseFloat(estoqueFlutuante) || 0,
          preco: parseFloat(preco) || 0,
          data_contagem: dataContagem,
          area_id: areaId ? parseInt(areaId) : null,
          observacoes: observacoes || null,
          usuario_nome: 'Usuário Sistema'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Mostrar alertas da API se houver
        if (result.alertas && result.alertas.length > 0) {
          setAlertas(result.alertas);
          
          const alertasCriticos = result.alertas.filter((a: Alerta) => a.severidade === 'critico');
          if (alertasCriticos.length > 0) {
            toast.warning(`Contagem salva com ${alertasCriticos.length} alerta(s) crítico(s)`, {
              description: 'Verifique os alertas abaixo'
            });
          } else {
            toast.success('Contagem salva com sucesso!');
          }
        } else {
          toast.success('Contagem salva com sucesso!');
          limparFormulario();
        }
      } else {
        toast.error(result.error || 'Erro ao salvar contagem');
      }
    } catch (error) {
      console.error('Erro ao salvar contagem:', error);
      toast.error('Erro ao salvar contagem');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setCategoria('');
    setDescricao('');
    setEstoqueFechado('');
    setEstoqueFlutuante('');
    setPreco('');
    setAreaId('');
    setObservacoes('');
    setAlertas([]);
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const contagensFiltradas = contagens.filter(c => {
    if (busca) {
      const buscaLower = busca.toLowerCase();
      return (
        c.descricao.toLowerCase().includes(buscaLower) ||
        c.categoria.toLowerCase().includes(buscaLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="card-title-dark flex items-center gap-2">
                <Package className="h-6 w-6" />
                Contagem de Estoque
              </h1>
              <p className="card-description-dark">
                Registre e acompanhe a contagem de estoque com validações inteligentes
              </p>
            </div>
            <Link href="/ferramentas/areas-contagem">
              <Button variant="outline" className="btn-outline-dark">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Áreas
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="tabs-list-dark">
                <TabsTrigger value="registrar" className="tabs-trigger-dark">
                  <Package className="h-4 w-4 mr-2" />
                  Registrar Contagem
                </TabsTrigger>
                <TabsTrigger value="lista" className="tabs-trigger-dark">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </TabsTrigger>
              </TabsList>
              
              <Link href="/ferramentas/contagem-estoque/consolidado">
                <Button className="btn-primary-dark">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Consolidado por Área
                </Button>
              </Link>
            </div>

            {/* TAB: REGISTRAR CONTAGEM */}
            <TabsContent value="registrar" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário */}
                <div className="lg:col-span-2">
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark">Dados da Contagem</CardTitle>
                      <CardDescription className="card-description-dark">
                        Preencha os dados do produto e estoque
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Categoria */}
                        <div className="space-y-2">
                          <Label htmlFor="categoria" className="text-gray-700 dark:text-gray-300">
                            Categoria *
                          </Label>
                          <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger className="input-dark">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Área */}
                        <div className="space-y-2">
                          <Label htmlFor="area" className="text-gray-700 dark:text-gray-300">
                            Área
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              (Opcional)
                            </span>
                          </Label>
                          <Select value={areaId} onValueChange={setAreaId}>
                            <SelectTrigger className="input-dark">
                              <SelectValue placeholder="Sem área específica" />
                            </SelectTrigger>
                            <SelectContent>
                              {areas.map(area => (
                                <SelectItem key={area.id} value={area.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {area.nome}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Data */}
                        <div className="space-y-2">
                          <Label htmlFor="data" className="text-gray-700 dark:text-gray-300">
                            Data da Contagem
                          </Label>
                          <Input
                            type="date"
                            value={dataContagem}
                            onChange={(e) => setDataContagem(e.target.value)}
                            className="input-dark"
                          />
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-gray-700 dark:text-gray-300">
                          Descrição do Produto *
                        </Label>
                        <Input
                          id="descricao"
                          placeholder="Ex: Coca-Cola 2L, Cerveja Heineken..."
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          className="input-dark"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Estoque Fechado */}
                        <div className="space-y-2">
                          <Label htmlFor="fechado" className="text-gray-700 dark:text-gray-300">
                            Estoque Fechado
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              (Depósito)
                            </span>
                          </Label>
                          <Input
                            id="fechado"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={estoqueFechado}
                            onChange={(e) => {
                              setEstoqueFechado(e.target.value);
                              setTimeout(validarPreenchimento, 300);
                            }}
                            className="input-dark"
                          />
                        </div>

                        {/* Estoque Flutuante */}
                        <div className="space-y-2">
                          <Label htmlFor="flutuante" className="text-gray-700 dark:text-gray-300">
                            Estoque Flutuante
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              (Bar/Salão)
                            </span>
                          </Label>
                          <Input
                            id="flutuante"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={estoqueFlutuante}
                            onChange={(e) => {
                              setEstoqueFlutuante(e.target.value);
                              setTimeout(validarPreenchimento, 300);
                            }}
                            className="input-dark"
                          />
                        </div>

                        {/* Preço */}
                        <div className="space-y-2">
                          <Label htmlFor="preco" className="text-gray-700 dark:text-gray-300">
                            Preço Unitário (R$)
                          </Label>
                          <Input
                            id="preco"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={preco}
                            onChange={(e) => {
                              setPreco(e.target.value);
                              setTimeout(validarPreenchimento, 300);
                            }}
                            className="input-dark"
                          />
                        </div>
                      </div>

                      {/* Total Calculado */}
                      {(estoqueFechado || estoqueFlutuante || preco) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Estoque Total:</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {((parseFloat(estoqueFechado) || 0) + (parseFloat(estoqueFlutuante) || 0)).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Preço:</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatarValor(parseFloat(preco) || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Valor Total:</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatarValor(
                                  ((parseFloat(estoqueFechado) || 0) + (parseFloat(estoqueFlutuante) || 0)) * 
                                  (parseFloat(preco) || 0)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      <div className="space-y-2">
                        <Label htmlFor="observacoes" className="text-gray-700 dark:text-gray-300">
                          Observações
                        </Label>
                        <Textarea
                          id="observacoes"
                          placeholder="Informações adicionais sobre a contagem..."
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          className="textarea-dark min-h-[80px]"
                        />
                      </div>

                      {/* Botões */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={salvarContagem}
                          disabled={loading}
                          className="btn-primary-dark flex-1"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Contagem
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={limparFormulario}
                          variant="outline"
                          className="btn-outline-dark"
                        >
                          Limpar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alertas */}
                <div className="space-y-4">
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark text-base flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Validações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {alertas.length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Nenhum alerta no momento
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {alertas.map((alerta, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-l-4 ${
                                alerta.severidade === 'critico'
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                  : alerta.severidade === 'alto'
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                                  : alerta.severidade === 'medio'
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {alerta.mensagem}
                              </p>
                              {alerta.sugestao && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  💡 {alerta.sugestao}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Legenda */}
                  <Card className="card-dark">
                    <CardHeader>
                      <CardTitle className="card-title-dark text-sm">
                        Severidade dos Alertas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Crítico - Revisar obrigatoriamente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Alto - Atenção especial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Médio - Verificar se possível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Info - Apenas informativo</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: HISTÓRICO */}
            <TabsContent value="lista" className="space-y-6">
              {/* Filtros */}
              <Card className="card-dark">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar por descrição ou categoria..."
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          className="input-dark pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="input-dark w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Todas categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant={filtroAlerta ? 'default' : 'outline'}
                      onClick={() => setFiltroAlerta(!filtroAlerta)}
                      className={filtroAlerta ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'btn-outline-dark'}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Apenas com Alertas
                    </Button>

                    <Button
                      onClick={buscarContagens}
                      disabled={loadingContagens}
                      className="btn-primary-dark"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingContagens ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Contagens */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico de Contagens
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    {contagensFiltradas.length} contagen{contagensFiltradas.length !== 1 ? 's' : ''} encontrada{contagensFiltradas.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingContagens ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Carregando contagens...</p>
                    </div>
                  ) : contagensFiltradas.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Nenhuma contagem encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contagensFiltradas.map((contagem) => (
                        <div
                          key={contagem.id}
                          className={`p-4 rounded-lg border ${
                            contagem.alerta_variacao || contagem.alerta_preenchimento
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {contagem.descricao}
                                </h4>
                                <Badge className="badge-secondary text-xs">
                                  {contagem.categoria}
                                </Badge>
                                {(contagem.alerta_variacao || contagem.alerta_preenchimento) && (
                                  <Badge className="badge-warning text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Alerta
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Fechado:</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {Number(contagem.estoque_fechado).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Flutuante:</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {Number(contagem.estoque_flutuante).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Total:</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {Number(contagem.estoque_total).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Valor:</p>
                                  <p className="font-medium text-green-600 dark:text-green-400">
                                    {formatarValor(Number(contagem.valor_total))}
                                  </p>
                                </div>
                              </div>

                              {contagem.variacao_percentual !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  {contagem.variacao_percentual > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={`text-sm font-medium ${
                                    contagem.variacao_percentual > 0 
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {contagem.variacao_percentual > 0 ? '+' : ''}{contagem.variacao_percentual.toFixed(1)}% vs última contagem
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="text-right ml-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <Calendar className="h-4 w-4" />
                                {formatarData(contagem.data_contagem)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(contagem.created_at).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(contagem.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>

                          {contagem.observacoes && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                📝 {contagem.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

