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
  Zap,
  Info
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { Separator } from '@/components/ui/separator';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CATEGORIAS = [
  { key: 'indicadores_estrategicos', label: 'Indicadores EstratÃ©gicos' },
  { key: 'cockpit_financeiro', label: 'Cockpit Financeiro' },
  { key: 'indicadores_qualidade', label: 'Indicadores de Qualidade' },
  { key: 'cockpit_produtos', label: 'Cockpit Produtos' },
  { key: 'cockpit_vendas', label: 'Cockpit Vendas' },
  { key: 'cockpit_marketing', label: 'Cockpit Marketing' },
];

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
  onSave: (valores: any) => void;
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
             { key: 'diario', label: 'DiÃ¡rio', valor: meta.valor_diario },
             { key: 'semanal', label: 'Semanal', valor: meta.valor_semanal },
             { key: 'mensal', label: 'Mensal', valor: meta.valor_mensal },
             { key: 'unico', label: 'Ãšnico', valor: meta.valor_unico }
           ]
           .filter((periodo: any) => {
             // Filtro inteligente baseado no tipo_valor
             if (meta.tipo_valor === 'unico') {
               return periodo.key === 'unico';
             } else {
               return periodo.key !== 'unico'; // Mostra diÃ¡rio, semanal e mensal
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

// Adicionar index signature em METAS_BASE para acesso dinÃ¢mico
const METAS_BASE: Record<string, Record<string, any>> = {
  indicadores_estrategicos: {
    faturamento_total: 222000,
    faturamento_couvert: 38000,
    faturamento_bar: 184000,
    faturamento_cmovel: 0,
    cmv_rs: 0,
    ticket_medio_contahub: 93,
    tm_entrada: 15.5,
    tm_bar: 77.5,
    cmv_global_real: 27,
    cmo_percent: 20,
    atracao_faturamento: 17,
    retencao: 0,
    clientes_atendidos: 2645,
    clientes_ativos: 3000,
    reservas_totais: 800,
    reservas_presentes: 650
  },
  cockpit_financeiro: {
    imposto: 0,
    comissao: 0,
    cmv: 0,
    cmo: 0,
    pro_labore: 0,
    ocupacao: 0,
    adm_fixo: 0,
    marketing_fixo: 0,
    escritorio_central: 0,
    adm_mkt_semana: 0,
    rh_estorno_outros_operacao: 0,
    materiais: 0,
    manutencao: 0,
    atracoes_eventos: 0,
    utensilios: 0,
    consumacao_sem_socio: 0,
    lucro_rs: 0
  },
  indicadores_qualidade: {
    avaliacoes_5_google_trip: 75,
    media_avaliacoes_google: 4.8,
    nps_geral: 0,
    nps_ambiente: 0,
    nps_atendimento: 0,
    nps_limpeza: 0,
    nps_musica: 0,
    nps_comida: 0,
    nps_drink: 0,
    nps_preco: 0,
    nps_reservas: 70,
    nps_felicidade_equipe: 60
  },
  cockpit_produtos: {
    cmv_teorico: 27,
    cmv_limpo_percent: 31,
    stockout_comidas: 3,
    stockout_drinks: 3,
    stockout_bar: 1,
    percent_bebidas: 0,
    percent_drinks: 0,
    percent_comida: 0,
    percent_happyhour: 0,
    qtde_itens_bar: 0,
    tempo_saida_bar: 3,
    qtde_itens_cozinha: 0,
    tempo_saida_cozinha: 10
  },
  cockpit_vendas: {
    percent_faturamento_ate_19h: 15,
    venda_balcao: 0,
    couvert_atracoes: 112,
    quisabdom: '141000/91000'
  },
  cockpit_marketing: {
    o_num_posts: 0,
    o_alcance: 0,
    o_interacao: 0,
    o_compartilhamento: 0,
    o_engajamento: 0,
    o_num_stories: 0,
    o_visu_stories: 0,
    m_valor_investido: 0,
    m_alcance: 0,
    m_frequencia: 0,
    m_cpm: 0,
    m_cliques: 0,
    m_ctr: 0,
    m_custo_por_clique: 0,
    m_conversas_iniciadas: 0
  }
};

function formatInputValue(key: string, value: any) {
  if (typeof value === 'number' && (key.includes('percent') || key.includes('cmv') || key.includes('nps') || key.includes('porcentagem'))) {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value ?? '';
}

// FunÃ§Ã£o para transformar snake_case em label amigÃ¡vel
function toLabel(str: string) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (m: string) => m.toUpperCase())
    .replace(/\b(rs|cmv|nps|tm|qtde|o|m)\b/gi, (m: string) => m.toUpperCase());
}

// FunÃ§Ã£o para sugerir tipo de input
function getInputType(key: string) {
  if (key.includes('percent') || key.includes('cmv') || key.includes('nps')) return 'number';
  if (key.includes('valor') || key.includes('faturamento') || key.includes('rs') || key.includes('ticket') || key.includes('lucro')) return 'number';
  if (key.includes('media') || key.includes('tempo')) return 'number';
  if (key.includes('quisabdom')) return 'text';
  return 'number';
}

// FunÃ§Ã£o para placeholder
function getPlaceholder(key: string) {
  if (key.includes('percent') || key.includes('cmv') || key.includes('nps')) return '%';
  if (key.includes('valor') || key.includes('faturamento') || key.includes('rs') || key.includes('ticket') || key.includes('lucro')) return 'R$';
  if (key.includes('media')) return '0.0';
  if (key.includes('tempo')) return 'min';
  if (key.includes('qtde')) return 'Qtd.';
  if (key.includes('quisabdom')) return 'Ex: 141000/91000';
  return '';
}

// DicionÃ¡rio de tooltips para cada mÃ©trica (exemplo, pode expandir)
const METRIC_TOOLTIPS: Record<string, string> = {
  faturamento_total: 'Faturamento bruto total do perÃ­odo.',
  faturamento_couvert: 'Faturamento apenas de couvert artÃ­stico.',
  faturamento_bar: 'Faturamento apenas do bar.',
  faturamento_cmovel: 'Faturamento de vendas mÃ³veis.',
  cmv_rs: 'Custo de mercadoria vendida em reais.',
  ticket_medio_contahub: 'Ticket mÃ©dio calculado pelo ContaHub.',
  tm_entrada: 'Ticket mÃ©dio de entrada.',
  tm_bar: 'Ticket mÃ©dio do bar.',
  cmv_global_real: 'CMV global realizado (%).',
  cmo_percent: 'CMO percentual.',
  atracao_faturamento: 'Percentual de faturamento vindo de atraÃ§Ãµes.',
  retencao: 'Percentual de retenÃ§Ã£o de clientes.',
  clientes_atendidos: 'Total de clientes atendidos.',
  clientes_ativos: 'Total de clientes ativos.',
  reservas_totais: 'Total de reservas realizadas.',
  reservas_presentes: 'Total de reservas presentes.'
  // ...adicione mais tooltips conforme necessÃ¡rio
};

function getBadgeUnit(key: string) {
  if (key.includes('percent') || key.includes('cmv') || key.includes('nps')) return '%';
  if (key.includes('valor') || key.includes('faturamento') || key.includes('rs') || key.includes('ticket') || key.includes('lucro')) return 'R$';
  if (key.includes('media')) return 'MÃ©dia';
  if (key.includes('tempo')) return 'min';
  if (key.includes('qtde')) return 'Qtd.';
  return '';
}

export default function MetasPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const [metas, setMetas] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<{[cat: string]: string | null}>({});
  const [editState, setEditState] = useState<any>({});
  const [activeTab, setActiveTab] = useState(CATEGORIAS[0].key);

  useEffect(() => {
    if (selectedBar) {
      fetchMetas();
    }
  }, [selectedBar]);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bars/metas?bar_id=${selectedBar?.id}`);
      const data = await res.json();
      let metasData = data.metas || {};
      if (!metasData || Object.keys(metasData).length === 0) {
        metasData = METAS_BASE;
      }
      setMetas(metasData);
      setEditState(metasData);
      setEditKey({});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erro ao buscar metas', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // MÃ¡scara e parse para moeda/percentual
  function getFormatProps(key: string) {
    if (key.includes('percent') || key.includes('cmv') || key.includes('nps')) {
      return { suffix: '%', decimalScale: 2, fixedDecimalScale: true, allowNegative: false };
    }
    if (key.includes('valor') || key.includes('faturamento') || key.includes('rs') || key.includes('ticket') || key.includes('lucro')) {
      return { prefix: 'R$ ', decimalScale: 2, fixedDecimalScale: true, thousandSeparator: '.', decimalSeparator: ',', allowNegative: false };
    }
    return { decimalScale: 2, fixedDecimalScale: false, allowNegative: false };
  }

  // Salvar individual
  const handleSaveField = async (cat: string, key: string) => {
    setSavingKey(`${cat}_${key}`);
    try {
      const newMetas = {
        ...metas,
        [cat]: {
          ...metas[cat],
          [key]: editState[cat][key]
        }
      };
      const res = await fetch(`/api/bars/metas?bar_id=${selectedBar?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metas: newMetas })
      });
      const data = await res.json();
      if (data.success) {
        setMetas(newMetas);
        setEditKey((prev) => ({ ...prev, [cat]: null }));
        toast({ title: 'Meta salva!', description: toLabel(key), variant: 'default' });
      } else {
        toast({ title: 'Erro ao salvar meta', description: data.error, variant: 'destructive' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erro ao salvar meta', description: msg, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  // Editar individual
  const handleEditField = (cat: string, key: string) => {
    setEditKey((prev) => ({ ...prev, [cat]: key }));
  };

  // Cancelar ediÃ§Ã£o
  const handleCancelEdit = (cat: string) => {
    setEditKey((prev) => ({ ...prev, [cat]: null }));
    setEditState((prev: any) => ({ ...prev, [cat]: { ...metas[cat] } }));
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
    const ativas = metasCategoria.filter((m: any) => m.meta_ativa).length;
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
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 max-w-7xl space-y-8">
          {/* Header Premium */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    ConfiguraÃ§Ã£o de Metas
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Edite as metas base do seu bar. Todos os campos sÃ£o editÃ¡veis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs de Categorias */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm">
              {CATEGORIAS.map((cat: any) => (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIAS.map((cat: any) => {
              const campos = Object.keys(METAS_BASE[cat.key] || {});
              return (
                <TabsContent key={cat.key} value={cat.key} className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300">
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-gray-900 dark:text-white">{cat.label}</CardTitle>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Metas da categoria {cat.label}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {campos.map((key) => {
                          const isEditing = editKey[cat.key] === key;
                          const value = editState?.[cat.key]?.[key];
                          const displayValue = metas?.[cat.key]?.[key];
                          const badgeUnit = getBadgeUnit(key);
                          return (
                            <div key={key} className={`card-dark p-6 flex flex-col gap-3 border-2 transition-all duration-200 shadow-md hover:shadow-xl ${isEditing ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-[1.03]' : 'border-transparent'} group`}> 
                              <div className="flex items-center gap-2 mb-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1 cursor-help">
                                      {toLabel(key)}
                                      <Info className="w-3 h-3 text-blue-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <span className="font-semibold">{toLabel(key)}</span><br />
                                    <span className="text-xs text-gray-500">{METRIC_TOOLTIPS[key] || 'Meta configurÃ¡vel.'}</span>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              {!isEditing ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {getFormatProps(key).prefix ?
                                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(displayValue ?? 0)) :
                                      getFormatProps(key).suffix ? `${displayValue ?? 0}%` :
                                      displayValue ?? '-'}
                                    {badgeUnit && <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ml-2 px-2 py-0.5 rounded text-xs font-semibold">{badgeUnit}</span>}
                                  </span>
                                  <Button size="sm" className="btn-primary-dark flex items-center gap-1 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg" onClick={() => handleEditField(cat.key, key)}>
                                    <Edit className="w-4 h-4 mr-1" /> Editar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <NumericFormat
                                    {...getFormatProps(key)}
                                    value={value}
                                    onValueChange={(vals: { floatValue: number | undefined }) => setEditState((prev: any) => ({
                                      ...prev,
                                      [cat.key]: {
                                        ...prev[cat.key],
                                        [key]: vals.floatValue ?? ''
                                      }
                                    }))}
                                    className="input-dark flex-1 text-lg"
                                    placeholder={getPlaceholder(key)}
                                    customInput={Input}
                                  />
                                  <Button size="sm" className="btn-primary-dark flex items-center gap-1" onClick={() => handleSaveField(cat.key, key)} disabled={savingKey === `${cat.key}_${key}`}> <Save className="w-4 h-4" /> Salvar</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleCancelEdit(cat.key)} disabled={savingKey === `${cat.key}_${key}`}>Cancelar</Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
} 
