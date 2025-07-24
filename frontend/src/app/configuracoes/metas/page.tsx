'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Target, 
  TrendingUp, 
  Users, 
  Star, 
  Coffee, 
  Edit, 
  Save, 
  X,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Award,
  Zap
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

const formatarValor = (valor: number | null, tipo: string): string => {
  if (valor === null || valor === undefined) return '-';
  
  switch (tipo) {
    case 'moeda':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    case 'porcentagem':
      return `${valor}%`;
    case 'numero':
    default:
      return valor.toString();
  }
};

const MetaCard = ({ meta, isEditing, onEdit, onSave, onCancel, isSaving }: {
  meta: Meta;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (valores: Record<string, number | null>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [valores, setValores] = useState({
    valor_diario: meta.valor_diario || '',
    valor_semanal: meta.valor_semanal || '',
    valor_mensal: meta.valor_mensal || '',
    valor_unico: meta.valor_unico || ''
  });

  const handleSave = () => {
    const valoresParaSalvar = {
      valor_diario: valores.valor_diario ? parseFloat(valores.valor_diario.toString()) : null,
      valor_semanal: valores.valor_semanal ? parseFloat(valores.valor_semanal.toString()) : null,
      valor_mensal: valores.valor_mensal ? parseFloat(valores.valor_mensal.toString()) : null,
      valor_unico: valores.valor_unico ? parseFloat(valores.valor_unico.toString()) : null
    };
    onSave(valoresParaSalvar);
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'financeiro':
        return <DollarSign className="w-5 h-5" />
      case 'avaliacoes':
        return <Star className="w-5 h-5" />
      case 'cockpit_produtos':
        return <Coffee className="w-5 h-5" />
      case 'marketing':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'financeiro':
        return 'from-green-500 to-green-600'
      case 'avaliacoes':
        return 'from-yellow-500 to-yellow-600'
      case 'cockpit_produtos':
        return 'from-purple-500 to-purple-600'
      case 'marketing':
        return 'from-blue-500 to-blue-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(meta.categoria)} text-white`}>
              {getCategoryIcon(meta.categoria)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {meta.nome_meta}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meta.subcategoria}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={meta.meta_ativa ? "default" : "secondary"}
              className={meta.meta_ativa ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
            >
              {meta.meta_ativa ? 'Ativa' : 'Inativa'}
            </Badge>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {meta.descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            {meta.descricao}
          </p>
        )}

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { key: 'diario', label: 'Diário', valor: meta.valor_diario },
             { key: 'semanal', label: 'Semanal', valor: meta.valor_semanal },
             { key: 'mensal', label: 'Mensal', valor: meta.valor_mensal },
             { key: 'unico', label: 'Único', valor: meta.valor_unico }
           ]
           .filter(periodo => {
             // Filtro inteligente baseado no tipo_valor
             if (meta.tipo_valor === 'unico') {
               return periodo.key === 'unico';
             } else {
               return periodo.key !== 'unico'; // Mostra diário, semanal e mensal
             }
           })
           .map((periodo) => {
             const chaveValor = `valor_${periodo.key}` as keyof typeof valores;
             
             return (
               <div key={periodo.key} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                 <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                   {periodo.label}
                 </Label>
                 {isEditing ? (
                   <Input
                     type="number"
                     step="0.01"
                     value={valores[chaveValor]}
                     onChange={(e) => setValores(prev => ({
                       ...prev,
                       [chaveValor]: e.target.value
                     }))}
                     placeholder="0.00"
                     className="mt-2 bg-white dark:bg-gray-800"
                   />
                 ) : (
                   <div className="mt-2">
                     <span className="text-xl font-bold text-gray-900 dark:text-white">
                       {formatarValor(periodo.valor, meta.tipo_valor)}
                     </span>
                     <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                       {meta.unidade === 'porcentagem' ? '%' : meta.unidade}
                     </span>
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MetasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState<MetasOrganizadas>({
    financeiro: [],
    clientes: [],
    avaliacoes: [],
    cockpit_produtos: [],
    marketing: []
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const carregarMetas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metas');
      const data = await response.json();
      
      if (data.success) {
        setMetas(data.data);
      } else {
        toast({
          title: "❌ Erro",
          description: "Erro ao carregar metas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao carregar metas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarMetas();
  }, [carregarMetas]);

  const salvarMeta = async (metaId: number, valores: Record<string, number | null>) => {
    try {
      setSavingId(metaId);
      
      const response = await fetch('/api/metas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ id: metaId }, valores))
      });

      const data = await response.json();
      
      if (data.success) {
        await carregarMetas();
        setEditingId(null);
        toast({
          title: "✅ Sucesso",
          description: "Meta atualizada com sucesso!",
        });
      } else {
        toast({
          title: "❌ Erro",
          description: data.error || "Erro ao atualizar meta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao salvar meta",
        variant: "destructive"
      });
    } finally {
      setSavingId(null);
    }
  };

  const getTabIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'financeiro':
        return <DollarSign className="w-4 h-4" />
      case 'clientes':
        return <Users className="w-4 h-4" />
      case 'avaliacoes':
        return <Star className="w-4 h-4" />
      case 'cockpit_produtos':
        return <Coffee className="w-4 h-4" />
      case 'marketing':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  };

  const getCategoryStats = (categoria: keyof MetasOrganizadas) => {
    const metasCategoria = metas[categoria];
    const total = metasCategoria.length;
    const ativas = metasCategoria.filter(m => m.meta_ativa).length;
    return { total, ativas };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando metas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Moderno */}
        <div className="relative">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
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
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Configuração de Metas</h1>
                    <p className="text-orange-100 mt-1">Defina e acompanhe os KPIs do seu negócio</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-orange-200">Total de Metas</div>
                  <div className="text-2xl font-bold">
                    {metas && typeof metas === 'object' ? Object.values(metas).reduce((acc, curr) => acc + curr.length, 0) : 0}
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Overview Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
           {metas && typeof metas === 'object' ? (Object.entries(metas) as [keyof MetasOrganizadas, Meta[]][]).map(([categoria, metasCategoria]) => {
             const stats = getCategoryStats(categoria);
             return (
               <Card key={categoria} className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                         {categoria.replace('_', ' ')}
                       </p>
                       <p className="text-2xl font-bold text-gray-900 dark:text-white">
                         {stats.ativas}/{stats.total}
                       </p>
                       <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Metas ativas</p>
                     </div>
                     <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                       {getTabIcon(categoria)}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           }) : null}
        </div>

        {/* Tabs de Categorias */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <Tabs defaultValue="financeiro" className="w-full">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Gerenciar Metas por Categoria
                </CardTitle>
              </div>
              
                             <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-700">
                 {metas && typeof metas === 'object' ? (Object.entries(metas) as [keyof MetasOrganizadas, Meta[]][]).map(([categoria, metasCategoria]) => (
                   <TabsTrigger 
                     key={categoria}
                     value={categoria}
                     className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"
                   >
                     {getTabIcon(categoria)}
                     <span className="capitalize">{categoria.replace('_', ' ')}</span>
                     <Badge variant="outline" className="ml-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                       {metasCategoria.length}
                     </Badge>
                   </TabsTrigger>
                 )) : null}
              </TabsList>
            </CardHeader>

                         <CardContent className="p-6">
               {metas && typeof metas === 'object' ? (Object.entries(metas) as [keyof MetasOrganizadas, Meta[]][]).map(([categoria, metasCategoria]) => (
                 <TabsContent key={categoria} value={categoria} className="space-y-6 mt-0">
                   {metasCategoria.length === 0 ? (
                     <div className="text-center py-12">
                       <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                         {getTabIcon(categoria)}
                       </div>
                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                         Nenhuma meta encontrada
                       </h3>
                       <p className="text-gray-600 dark:text-gray-400">
                         Não há metas configuradas para a categoria {categoria.replace('_', ' ')}.
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-6">
                       {metasCategoria.map((meta: Meta) => (
                         <MetaCard
                           key={meta.id}
                           meta={meta}
                           isEditing={editingId === meta.id}
                           onEdit={() => setEditingId(meta.id)}
                           onSave={(valores) => salvarMeta(meta.id, valores)}
                           onCancel={() => setEditingId(null)}
                           isSaving={savingId === meta.id}
                         />
                       ))}
                     </div>
                   )}
                 </TabsContent>
               )) : null}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 
