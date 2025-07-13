'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  Loader2
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
  valor_diario: number | null;
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
  marketing: Meta[];
}

// Mapeamento de ícones
const IconMap: { [key: string]: any } = {
  TrendingUp, Users, Star, Coffee, DollarSign, Target, Activity,
  CheckCircle2, AlertCircle
};

// Função para formatar valores
const formatarValor = (valor: number | null, tipo: string): string => {
  if (valor === null || valor === undefined || valor === 0) return '-';
  
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
const MetaCard = ({ meta, isEditing, onEdit, onSave, onCancel, isSaving }: {
  meta: Meta;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (valores: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [valores, setValores] = useState({
    valor_semanal: meta.valor_semanal?.toString() || '',
    valor_mensal: meta.valor_mensal?.toString() || '',
    valor_unico: meta.valor_unico?.toString() || ''
  });

  useEffect(() => {
    if (isEditing) {
      setValores({
        valor_semanal: meta.valor_semanal?.toString() || '',
        valor_mensal: meta.valor_mensal?.toString() || '',
        valor_unico: meta.valor_unico?.toString() || ''
      });
    }
  }, [isEditing, meta]);

  const IconComponent = IconMap[meta.icone_categoria] || Target;

  // Determinar se é uma meta única ou por períodos
  const isMetaUnica = meta.valor_unico !== null && meta.valor_unico !== undefined;
  const isMetaPeriodos = (meta.valor_semanal !== null && meta.valor_semanal !== undefined) || 
                         (meta.valor_mensal !== null && meta.valor_mensal !== undefined);

  const handleSave = () => {
    if (isMetaUnica) {
      const valoresLimpos = {
        valor_unico: valores.valor_unico ? parseFloat(valores.valor_unico.replace(/[^\d.,]/g, '').replace(',', '.')) : null
      };
      onSave(valoresLimpos);
    } else {
      const valoresLimpos = {
        valor_semanal: valores.valor_semanal ? parseFloat(valores.valor_semanal.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        valor_mensal: valores.valor_mensal ? parseFloat(valores.valor_mensal.replace(/[^\d.,]/g, '').replace(',', '.')) : null
      };
      onSave(valoresLimpos);
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md bg-white border-l-4 shadow-sm"
          style={{ borderLeftColor: meta.cor_categoria }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-opacity-10"
                 style={{ backgroundColor: `${meta.cor_categoria}20` }}>
              <IconComponent 
                className="h-5 w-5" 
                style={{ color: meta.cor_categoria }} 
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
                {meta.nome_meta}
              </CardTitle>
              {meta.subcategoria && (
                <p className="text-sm text-gray-500 mt-1">{meta.subcategoria}</p>
              )}
            </div>
          </div>
          
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0 hover:bg-green-100 text-green-600"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Meta Única - para metas como Ticket Médio */}
          {isMetaUnica && (
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-gray-700 w-20">
                Meta
              </Label>
              {isEditing ? (
                <input
                  type="text"
                  value={valores.valor_unico}
                  onChange={(e) => setValores(prev => ({ ...prev, valor_unico: e.target.value }))}
                  placeholder="0,00"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="flex-1 text-sm font-medium text-gray-900">
                  {formatarValor(meta.valor_unico, meta.tipo_valor)}
                </div>
              )}
            </div>
          )}

          {/* Metas por Períodos - para metas como Faturamento */}
          {isMetaPeriodos && (
            <>
              {/* Valor Semanal */}
              {(meta.valor_semanal !== null || isEditing) && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-gray-700 w-20">
                    Semanal
                  </Label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={valores.valor_semanal}
                      onChange={(e) => setValores(prev => ({ ...prev, valor_semanal: e.target.value }))}
                      placeholder="0,00"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex-1 text-sm font-medium text-gray-900">
                      {formatarValor(meta.valor_semanal, meta.tipo_valor)}
                    </div>
                  )}
                </div>
              )}

              {/* Valor Mensal */}
              {(meta.valor_mensal !== null || isEditing) && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-gray-700 w-20">
                    Mensal
                  </Label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={valores.valor_mensal}
                      onChange={(e) => setValores(prev => ({ ...prev, valor_mensal: e.target.value }))}
                      placeholder="0,00"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex-1 text-sm font-medium text-gray-900">
                      {formatarValor(meta.valor_mensal, meta.tipo_valor)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal
export default function MetasPage() {
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
  const router = useRouter();

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
        description: "Erro ao carregar metas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar meta
  const salvarMeta = async (metaId: number, valores: any) => {
    try {
      setSavingMeta(metaId);
      const response = await fetch(`/api/metas/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar meta');
      }

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso!",
      });

      await carregarMetas();
      setEditingMeta(null);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar meta",
        variant: "destructive",
      });
    } finally {
      setSavingMeta(null);
    }
  };



  // Carregar dados ao montar
  useEffect(() => {
    carregarMetas();
  }, []);

  const categorias = [
    { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'avaliacoes', label: 'Avaliações', icon: Star },
    { key: 'cockpit_produtos', label: 'Produtos', icon: Coffee },
    { key: 'marketing', label: 'Marketing', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/configuracoes')} 
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Configurações
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            Metas do Negócio
          </h1>
          <p className="text-gray-600 text-lg">
            Gerencie as metas financeiras, operacionais e de performance do seu bar
          </p>
        </div>
      </div>

      {/* Tabs por categoria */}
      <Tabs defaultValue="financeiro" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-gray-100 p-1 rounded-lg">
          {categorias.map(({ key, label, icon: Icon }) => (
            <TabsTrigger 
              key={key}
              value={key} 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo das abas */}
        {categorias.map(({ key, label }) => {
          const metasCategoria = metas[key as keyof MetasOrganizadas];
          
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-gray-900">{label}</h2>
                  <p className="text-sm text-gray-600">
                    {metasCategoria.length} metas configuradas
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {metasCategoria.length} total
                </Badge>
              </div>

              {metasCategoria.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {metasCategoria.map((meta) => (
                    <MetaCard
                      key={meta.id}
                      meta={meta}
                      isEditing={editingMeta === meta.id}
                      onEdit={() => setEditingMeta(meta.id)}
                      onSave={(valores) => salvarMeta(meta.id, valores)}
                      onCancel={() => setEditingMeta(null)}
                      isSaving={savingMeta === meta.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma meta encontrada
                  </h3>
                  <p className="text-gray-600">
                    Não há metas configuradas para a categoria {label.toLowerCase()}.
                  </p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
} 