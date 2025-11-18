'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  MapPin, 
  Package, 
  RefreshCw, 
  Calendar,
  DollarSign,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProdutoConsolidado {
  categoria: string;
  descricao: string;
  preco: number;
  areas: Array<{
    area_id: number;
    area_nome: string;
    area_tipo: string;
    estoque_fechado: number;
    estoque_flutuante: number;
    estoque_total: number;
    valor_total: number;
  }>;
  estoque_fechado_total: number;
  estoque_flutuante_total: number;
  estoque_total: number;
  valor_total: number;
  total_areas: number;
}

interface Estatisticas {
  total_produtos: number;
  total_areas_utilizadas: number;
  estoque_total_geral: number;
  valor_total_geral: number;
  categorias: string[];
}

const CATEGORIAS = [
  'Bebidas',
  'Alimentos',
  'Insumos',
  'Descartáveis',
  'Limpeza',
  'Outros'
];

export default function ConsolidadoContagemPage() {
  const [dataContagem, setDataContagem] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('');
  const [produtos, setProdutos] = useState<ProdutoConsolidado[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarConsolidado = async () => {
    if (!dataContagem) {
      toast.error('Selecione uma data');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        data: dataContagem
      });

      if (categoria) {
        params.append('categoria', categoria);
      }

      const response = await fetch(`/api/operacoes/contagem-estoque/consolidado?${params}`);
      const result = await response.json();

      if (result.success) {
        setProdutos(result.data || []);
        setEstatisticas(result.estatisticas);
        toast.success(`${result.data.length} produtos encontrados`);
      } else {
        toast.error(result.error || 'Erro ao buscar dados');
      }
    } catch (error) {
      console.error('Erro ao buscar consolidado:', error);
      toast.error('Erro ao buscar dados consolidados');
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="card-title-dark flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Visão Consolidada por Área
              </h1>
              <p className="card-description-dark">
                Visualize os produtos somados de todas as áreas de contagem
              </p>
            </div>
            <Link href="/ferramentas/contagem-estoque">
              <Button variant="outline" className="btn-outline-dark">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Filtros */}
          <Card className="card-dark mb-6">
            <CardHeader>
              <CardTitle className="card-title-dark text-base">
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Data da Contagem</Label>
                  <Input
                    type="date"
                    value={dataContagem}
                    onChange={(e) => setDataContagem(e.target.value)}
                    className="input-dark"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Categoria (Opcional)</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="input-dark">
                      <SelectValue placeholder="Todas categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={buscarConsolidado}
                    disabled={loading}
                    className="btn-primary-dark w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Buscar Consolidado
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {estatisticas.total_produtos}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {estatisticas.categorias.length} categorias
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Áreas Utilizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {estatisticas.total_areas_utilizadas}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Diferentes locais
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Estoque Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {estatisticas.estoque_total_geral.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Unidades totais
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Valor Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatarValor(estatisticas.valor_total_geral)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Produtos Consolidados */}
          {produtos.length > 0 && (
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">
                  Produtos Consolidados - {formatarData(dataContagem)}
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Totais agrupados por produto, somando todas as áreas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {produtos.map((produto, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                    >
                      {/* Cabeçalho do Produto */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {produto.descricao}
                            </h3>
                            <Badge className="badge-secondary text-xs">
                              {produto.categoria}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Preço unitário: {formatarValor(produto.preco)} • {produto.total_areas} área(s)
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatarValor(produto.valor_total)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {produto.estoque_total.toFixed(2)} un total
                          </p>
                        </div>
                      </div>

                      {/* Detalhamento por Área */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Distribuição por Área:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {produto.areas.map((area, areaIndex) => (
                            <div
                              key={areaIndex}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {area.area_nome}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Fechado:</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {area.estoque_fechado.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Flutuante:</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {area.estoque_flutuante.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Total:</p>
                                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    {area.estoque_total.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">Valor:</p>
                                  <p className="font-semibold text-green-600 dark:text-green-400">
                                    {formatarValor(area.valor_total)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totais do Produto */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Total Fechado:</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {produto.estoque_fechado_total.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Total Flutuante:</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {produto.estoque_flutuante_total.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Estoque Total:</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {produto.estoque_total.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Valor Total:</p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                              {formatarValor(produto.valor_total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há dados */}
          {!loading && produtos.length === 0 && estatisticas && (
            <Card className="card-dark">
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma contagem encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há contagens registradas para esta data
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

