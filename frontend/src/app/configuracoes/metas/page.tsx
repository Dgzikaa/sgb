'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import { 
  TrendingUp, 
  Users, 
  Star, 
  Coffee, 
  Edit, 
  Save, 
  X,
  DollarSign,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
  Eye,
  Share2,
  MessageSquare
} from 'lucide-react';

// Interface da Meta (estrutura do banco)
interface Meta {
  id: number;
  categoria: string;
  nome: string;
  valor_atual: number;
  valor_meta: number;
  unidade: string;
  descricao: string;
  icone: string;
  meta_ativa: boolean;
  ordem_exibicao: number;
  bar_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Interface para organizar metas por categoria
interface MetasOrganizadas {
  financeiro: Meta[];
  clientes: Meta[];
  avaliacoes: Meta[];
  cockpit_produtos: Meta[];
  marketing: Meta[];
}

// Mapeamento de ícones do Lucide React
const IconMap: { [key: string]: any } = {
  TrendingUp, Users, Star, Coffee, DollarSign, Target, Activity,
  CheckCircle2, AlertCircle, Hash, Eye, Share2, MessageSquare
};

// Função para formatar valores conforme a unidade
const formatarValor = (valor: number, unidade: string): string => {
  if (valor === null || valor === undefined) return '-';
  
  switch (unidade) {
    case 'R$':
    case 'moeda':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    case '%':
    case 'percentual':
      return `${valor.toFixed(1)}%`;
    default:
      return `${valor.toLocaleString('pt-BR')} ${unidade}`;
  }
};

// Função para obter ícone da meta
const getMetaIcon = (icone: string) => {
  const IconComponent = IconMap[icone || 'Target'];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : <Target className="h-5 w-5" />;
};

// Função para calcular progresso da meta
const calcularProgresso = (valorAtual: number, valorMeta: number): number => {
  if (valorMeta === 0) return 0;
  return Math.min((valorAtual / valorMeta) * 100, 100);
};

// Componente de Card de Meta
const MetaCard = ({ meta, isEditing, onEdit, onSave, onCancel, isSaving }: {
  meta: Meta;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (valores: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [valores, setValores] = useState({
    valor_atual: meta.valor_atual.toString(),
    valor_meta: meta.valor_meta.toString()
  });

  useEffect(() => {
    if (isEditing) {
      setValores({
        valor_atual: meta.valor_atual.toString(),
        valor_meta: meta.valor_meta.toString()
      });
    }
  }, [isEditing, meta]);

  const progresso = calcularProgresso(meta.valor_atual, meta.valor_meta);

  const handleSave = () => {
    const novoValorAtual = parseFloat(valores.valor_atual) || 0;
    const novoValorMeta = parseFloat(valores.valor_meta) || 0;
    
    onSave({
      valor_atual: novoValorAtual,
      valor_meta: novoValorMeta
    });
  };

  return (
    <div>
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getMetaIcon(meta.icone)}
              </div>
              <div>
                <CardTitle className="text-lg">{meta.nome}</CardTitle>
                <CardDescription>{meta.descricao}</CardDescription>
              </div>
            </div>
            
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Valor Atual</label>
                <Input
                  type="number"
                  value={valores.valor_atual}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_atual: e.target.value }))}
                  placeholder="Valor atual"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meta</label>
                <Input
                  type="number"
                  value={valores.valor_meta}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_meta: e.target.value }))}
                  placeholder="Valor da meta"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">
                  {formatarValor(meta.valor_atual, meta.unidade)}
                </span>
                <span className="text-sm text-muted-foreground">
                  de {formatarValor(meta.valor_meta, meta.unidade)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{progresso.toFixed(1)}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>

              <div className="flex items-center gap-2">
                {progresso >= 100 ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Meta Atingida
                  </Badge>
                ) : progresso >= 80 ? (
                  <Badge variant="secondary" className="bg-yellow-500 text-white">
                    <Activity className="h-3 w-3 mr-1" />
                    Quase lá
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Em progresso
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente principal da página
export default function MetasPage() {
  const [activeTab, setActiveTab] = useState('financeiro');
  const [metas, setMetas] = useState<MetasOrganizadas>({
    financeiro: [],
    clientes: [],
    avaliacoes: [],
    cockpit_produtos: [],
    marketing: []
  });
  const [loading, setLoading] = useState(true);
  const [editingMeta, setEditingMeta] = useState<number | null>(null);
  const [savingMeta, setSavingMeta] = useState<number | null>(null);
  const { toast } = useToast();

  // Função para carregar metas da API
  const carregarMetas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metas');
      const data = await response.json();
      
      if (data.success) {
        // A API já retorna as metas organizadas por categoria
        setMetas(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar metas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar alterações na meta
  const salvarMeta = async (metaId: number, valores: any) => {
    try {
      setSavingMeta(metaId);
      
      const response = await fetch('/api/metas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: metaId,
          ...valores
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Meta atualizada com sucesso!'
        });
        
        setEditingMeta(null);
        await carregarMetas();
      } else {
        throw new Error(data.error || 'Erro ao salvar meta');
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar meta',
        variant: 'destructive'
      });
    } finally {
      setSavingMeta(null);
    }
  };

  // Carregar metas ao montar o componente
  useEffect(() => {
    carregarMetas();
  }, []);

  // Configuração das categorias
  const categorias = [
    { key: 'financeiro', label: '💰 Financeiro', color: 'bg-green-500' },
    { key: 'clientes', label: '👥 Clientes', color: 'bg-blue-500' },
    { key: 'avaliacoes', label: '⭐ Avaliações', color: 'bg-yellow-500' },
    { key: 'cockpit_produtos', label: '☕ Produtos', color: 'bg-purple-500' },
    { key: 'marketing', label: '📱 Marketing', color: 'bg-pink-500' }
  ];

  // Tela de loading
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando metas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render principal
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header da página */}
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Metas e Objetivos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie suas metas por categoria
          </p>
        </div>
      </div>

      {/* Tabs por categoria */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          {categorias.map(categoria => (
            <TabsTrigger 
              key={categoria.key} 
              value={categoria.key}
              className="text-sm"
            >
              {categoria.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo de cada categoria */}
        {categorias.map(categoria => (
          <TabsContent key={categoria.key} value={categoria.key} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {metas[categoria.key as keyof MetasOrganizadas]?.map((meta) => (
                <div key={meta.id} className="group">
                  <MetaCard
                    meta={meta}
                    isEditing={editingMeta === meta.id}
                    onEdit={() => setEditingMeta(meta.id)}
                    onSave={(valores) => salvarMeta(meta.id, valores)}
                    onCancel={() => setEditingMeta(null)}
                    isSaving={savingMeta === meta.id}
                  />
                </div>
              )) || (
                <Card className="col-span-full">
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">
                      Nenhuma meta encontrada para esta categoria
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 