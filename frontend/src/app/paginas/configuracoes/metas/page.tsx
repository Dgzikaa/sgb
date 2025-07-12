'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NumericInput } from '@/components/ui/numeric-input';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Star, 
  Coffee, 
  Edit3, 
  Save, 
  X,
  DollarSign,
  Calendar,
  Target,
  Activity,
  BarChart3,
  Clock,
  Music,
  Wine,
  Receipt,
  LogIn,
  Calculator,
  Percent,
  CheckCircle,
  UserPlus,
  Heart,
  Smile,
  UtensilsCrossed,
  ChefHat
} from 'lucide-react';

// Tipos
interface Meta {
  id: number;
  categoria: string;
  subcategoria: string;
  nome_meta: string;
  tipo_valor: string;
  valor_semanal: number | null;
  valor_mensal: number | null;
  valor_unico: number | null;
  unidade: string;
  meta_ativa: boolean;
  descricao: string;
  ordem_exibicao: number;
  cor_categoria: string;
  icone_categoria: string;
}

interface MetasOrganizadas {
  financeiro: Meta[];
  clientes: Meta[];
  avaliacoes: Meta[];
  cockpit_produtos: Meta[];
}

// Mapeamento de ícones
const IconMap: { [key: string]: any } = {
  TrendingUp, Users, Star, Coffee, DollarSign, Calendar, Target, Activity,
  BarChart3, Clock, Music, Wine, Receipt, LogIn, Calculator, Percent,
  CheckCircle, UserPlus, Heart, Smile, UtensilsCrossed, ChefHat
};

// Função para formatar valores
const formatarValor = (valor: number | null, tipo: string, unidade: string): string => {
  if (valor === null || valor === undefined) return 'N/A';
  
  switch (tipo) {
    case 'moeda':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    case 'percentual':
      return `${valor.toFixed(1)}%`;
    case 'tempo_minutos':
      return `${valor.toFixed(0)} min`;
    case 'nota':
      return `${valor.toFixed(1)}★`;
    case 'numero':
      return new Intl.NumberFormat('pt-BR').format(valor);
    default:
      return valor.toString();
  }
};

// Componente de Card de Meta
const MetaCard = ({ meta, isEditing, onEdit, onSave, onCancel, onToggleActive }: {
  meta: Meta;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (valores: any) => void;
  onCancel: () => void;
  onToggleActive: (ativa: boolean) => void;
}) => {
  const [valores, setValores] = useState({
    valor_semanal: meta.valor_semanal?.toString() || '',
    valor_mensal: meta.valor_mensal?.toString() || '',
    valor_unico: meta.valor_unico?.toString() || ''
  });

  const IconComponent = IconMap[meta.icone_categoria] || Target;

  const handleSave = () => {
    onSave({
      valor_semanal: valores.valor_semanal ? parseFloat(valores.valor_semanal) : null,
      valor_mensal: valores.valor_mensal ? parseFloat(valores.valor_mensal) : null,
      valor_unico: valores.valor_unico ? parseFloat(valores.valor_unico) : null
    });
  };

  return (
    <Card className={`transition-all duration-200 ${meta.meta_ativa ? 'border-l-4' : 'opacity-60'}`}
          style={{ borderLeftColor: meta.meta_ativa ? meta.cor_categoria : '#e5e7eb' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${meta.cor_categoria}15` }}>
              <IconComponent className="h-4 w-4" style={{ color: meta.cor_categoria }} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{meta.nome_meta}</CardTitle>
              {meta.subcategoria && (
                <p className="text-xs text-muted-foreground mt-1">{meta.subcategoria}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={meta.meta_ativa}
              onCheckedChange={onToggleActive}
            />
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Valor Semanal */}
          {(meta.valor_semanal !== null || isEditing) && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Semanal</Label>
              {isEditing ? (
                <NumericInput
                  value={valores.valor_semanal}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_semanal: e.target.value }))}
                  allowDecimals={true}
                  maxDecimals={meta.tipo_valor === 'percentual' ? 1 : 2}
                  className="h-8"
                />
              ) : (
                <div className="font-medium">
                  {formatarValor(meta.valor_semanal, meta.tipo_valor, meta.unidade)}
                </div>
              )}
            </div>
          )}

          {/* Valor Mensal */}
          {(meta.valor_mensal !== null || isEditing) && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mensal</Label>
              {isEditing ? (
                <NumericInput
                  value={valores.valor_mensal}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_mensal: e.target.value }))}
                  allowDecimals={true}
                  maxDecimals={meta.tipo_valor === 'percentual' ? 1 : 2}
                  className="h-8"
                />
              ) : (
                <div className="font-medium">
                  {formatarValor(meta.valor_mensal, meta.tipo_valor, meta.unidade)}
                </div>
              )}
            </div>
          )}

          {/* Valor Único */}
          {(meta.valor_unico !== null || isEditing) && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Meta</Label>
              {isEditing ? (
                <NumericInput
                  value={valores.valor_unico}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_unico: e.target.value }))}
                  allowDecimals={true}
                  maxDecimals={meta.tipo_valor === 'percentual' ? 1 : 2}
                  className="h-8"
                />
              ) : (
                <div className="font-medium">
                  {formatarValor(meta.valor_unico, meta.tipo_valor, meta.unidade)}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton Loading
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

// Componente principal
export default function MetasPage() {
  const [metas, setMetas] = useState<MetasOrganizadas>({
    financeiro: [],
    clientes: [],
    avaliacoes: [],
    cockpit_produtos: []
  });
  const [loading, setLoading] = useState(true);
  const [editingMeta, setEditingMeta] = useState<number | null>(null);
  const [salvandoMetas, setSalvandoMetas] = useState(false);
  const { toast } = useToast();

  // Carregar metas
  const carregarMetas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metas');
      if (!response.ok) throw new Error('Erro ao carregar metas');
      
      const data = await response.json();
      setMetas(data.data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar metas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar meta
  const salvarMeta = async (metaId: number, valores: any) => {
    try {
      setSalvandoMetas(true);
      const response = await fetch(`/api/metas/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });

      if (!response.ok) throw new Error('Erro ao salvar meta');

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso",
      });

      await carregarMetas();
      setEditingMeta(null);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar meta",
        variant: "destructive",
      });
    } finally {
      setSalvandoMetas(false);
    }
  };

  // Toggle ativo/inativo
  const toggleMetaAtiva = async (metaId: number, ativa: boolean) => {
    try {
      const response = await fetch(`/api/metas/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_ativa: ativa })
      });

      if (!response.ok) throw new Error('Erro ao atualizar meta');

      await carregarMetas();
      toast({
        title: "Sucesso",
        description: `Meta ${ativa ? 'ativada' : 'desativada'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta",
        variant: "destructive",
      });
    }
  };

  // Carregar dados ao montar
  useEffect(() => {
    carregarMetas();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6" />
          Metas do Negócio
        </h1>
        <p className="text-muted-foreground">
          Gerencie as metas financeiras, operacionais e de performance do seu bar
        </p>
      </div>

      {/* Tabs por categoria */}
      <Tabs defaultValue="financeiro" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="financeiro" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Avaliações</span>
          </TabsTrigger>
          <TabsTrigger value="cockpit_produtos" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das abas */}
        {Object.entries(metas).map(([categoria, metasCategoria]) => (
          <TabsContent key={categoria} value={categoria} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold capitalize">{categoria.replace('_', ' ')}</h2>
                <p className="text-sm text-muted-foreground">
                  {metasCategoria.filter((m: Meta) => m.meta_ativa).length} metas ativas
                </p>
              </div>
              <Badge variant="outline">
                {metasCategoria.length} total
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metasCategoria.map((meta: Meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  isEditing={editingMeta === meta.id}
                  onEdit={() => setEditingMeta(meta.id)}
                  onSave={(valores) => salvarMeta(meta.id, valores)}
                  onCancel={() => setEditingMeta(null)}
                  onToggleActive={(ativa) => toggleMetaAtiva(meta.id, ativa)}
                />
              ))}
            </div>

            {metasCategoria.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma meta encontrada para esta categoria
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Loading overlay */}
      {salvandoMetas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Salvando metas...</span>
          </div>
        </div>
      )}
    </div>
  );
} 