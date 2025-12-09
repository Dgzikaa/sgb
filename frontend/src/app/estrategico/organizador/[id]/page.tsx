'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBar } from '@/contexts/BarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  Save,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  GripVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OKR {
  id?: number;
  epico: string;
  historia: string;
  responsavel: string;
  observacoes: string;
  status: string;
}

interface OrganizadorData {
  id?: number;
  bar_id: number;
  ano: number;
  trimestre: number | null;
  tipo: string;
  // Metas
  meta_clientes_ativos: number | null;
  meta_visitas: number | null;
  meta_cmv_limpo: number | null;
  meta_cmo: number | null;
  meta_artistica: number | null;
  // Imagem de 1 ano
  faturamento_meta: number | null;
  pessoas_meta: number | null;
  reputacao_meta: number | null;
  ebitda_meta: number | null;
  // Foco Central
  missao: string;
  nicho: string;
  valores_centrais: string[];
  // Marketing
  mercado_alvo: string;
  posicionamento: string;
  singularidades: string[];
  // Problemas e Visões
  principais_problemas: string[];
  meta_10_anos: string;
  imagem_3_anos: string;
  imagem_1_ano: string;
}

const statusOptions = [
  { value: 'verde', label: 'Concluído', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'amarelo', label: 'Em Progresso', color: 'bg-yellow-500', icon: Clock },
  { value: 'vermelho', label: 'Bloqueado', color: 'bg-red-500', icon: XCircle },
  { value: 'cinza', label: 'Não Iniciado', color: 'bg-gray-400', icon: AlertTriangle },
];

const defaultOrganizador: OrganizadorData = {
  bar_id: 0,
  ano: new Date().getFullYear(),
  trimestre: 4,
  tipo: 'trimestral',
  meta_clientes_ativos: 4000,
  meta_visitas: 15000,
  meta_cmv_limpo: 34,
  meta_cmo: 20,
  meta_artistica: 20,
  faturamento_meta: 10000000,
  pessoas_meta: 12000,
  reputacao_meta: 4.8,
  ebitda_meta: 1000000,
  missao: '',
  nicho: '',
  valores_centrais: ['', '', ''],
  mercado_alvo: '',
  posicionamento: '',
  singularidades: ['', '', ''],
  principais_problemas: ['', '', ''],
  meta_10_anos: '',
  imagem_3_anos: '',
  imagem_1_ano: '',
};

const defaultOKRs: OKR[] = [
  { epico: 'Faturamento', historia: '', responsavel: '', observacoes: '', status: 'cinza' },
  { epico: '[NSM] Nº de Clientes Ativos', historia: '', responsavel: '', observacoes: '', status: 'cinza' },
  { epico: 'Diligência Financeira', historia: '', responsavel: '', observacoes: '', status: 'cinza' },
];

export default function OrganizadorEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const isNovo = params.id === 'novo';
  const [loading, setLoading] = useState(!isNovo);
  const [saving, setSaving] = useState(false);
  const [organizador, setOrganizador] = useState<OrganizadorData>({
    ...defaultOrganizador,
    ano: parseInt(searchParams.get('ano') || String(new Date().getFullYear())),
    trimestre: parseInt(searchParams.get('trimestre') || '4'),
  });
  const [okrs, setOkrs] = useState<OKR[]>(defaultOKRs);

  const carregarDados = useCallback(async () => {
    if (!selectedBar || isNovo) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/organizador?bar_id=${selectedBar.id}&id=${params.id}`);
      const data = await response.json();
      
      if (data.organizador) {
        setOrganizador({
          ...defaultOrganizador,
          ...data.organizador,
          valores_centrais: data.organizador.valores_centrais || ['', '', ''],
          singularidades: data.organizador.singularidades || ['', '', ''],
          principais_problemas: data.organizador.principais_problemas || ['', '', ''],
        });
        setOkrs(data.okrs?.length > 0 ? data.okrs : defaultOKRs);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o organizador',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, params.id, isNovo, toast]);

  useEffect(() => {
    if (selectedBar) {
      if (isNovo) {
        setOrganizador(prev => ({ ...prev, bar_id: selectedBar.id }));
      } else {
        carregarDados();
      }
    }
  }, [selectedBar, isNovo, carregarDados]);

  const handleSalvar = async () => {
    if (!selectedBar) return;
    
    setSaving(true);
    try {
      const method = isNovo ? 'POST' : 'PUT';
      const body = {
        ...organizador,
        bar_id: selectedBar.id,
        okrs: okrs.filter(o => o.epico.trim() !== '')
      };

      const response = await fetch('/api/organizador', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso!',
          description: isNovo ? 'Organizador criado com sucesso' : 'Alterações salvas'
        });
        router.push('/estrategico/organizador');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateOrganizador = (field: keyof OrganizadorData, value: any) => {
    setOrganizador(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: 'valores_centrais' | 'singularidades' | 'principais_problemas', index: number, value: string) => {
    setOrganizador(prev => {
      const arr = [...(prev[field] || [])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const updateOKR = (index: number, field: keyof OKR, value: string) => {
    setOkrs(prev => {
      const newOkrs = [...prev];
      newOkrs[index] = { ...newOkrs[index], [field]: value };
      return newOkrs;
    });
  };

  const addOKR = () => {
    setOkrs(prev => [...prev, { epico: '', historia: '', responsavel: '', observacoes: '', status: 'cinza' }]);
  };

  const removeOKR = (index: number) => {
    setOkrs(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-400';
  };

  const getNomePeriodo = () => {
    if (organizador.tipo === 'anual' || !organizador.trimestre) {
      return `Visão Anual ${organizador.ano}`;
    }
    return `${organizador.trimestre}º Trimestre ${organizador.ano}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="container mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/estrategico/organizador')}
              className="text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isNovo ? 'Novo Organizador' : getNomePeriodo()}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Planejamento estratégico - Tração
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSalvar} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Header do Organizador - Estilo Planilha */}
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
            ORGANIZADOR VISÃO - TRAÇÃO - {getNomePeriodo().toUpperCase()}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Valores e Foco */}
          <div className="space-y-6">
            {/* Valores Centrais */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  VALORES CENTRAIS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    placeholder={`Valor ${i + 1}`}
                    value={organizador.valores_centrais?.[i] || ''}
                    onChange={(e) => updateArrayField('valores_centrais', i, e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                ))}
              </CardContent>
            </Card>

            {/* Foco Central */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  FOCO CENTRAL
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Missão</Label>
                  <Textarea
                    placeholder="Entregar o novo entretenimento"
                    value={organizador.missao || ''}
                    onChange={(e) => updateOrganizador('missao', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Nicho</Label>
                  <Textarea
                    placeholder="Bares Musicais (Contexto - Responsa...)"
                    value={organizador.nicho || ''}
                    onChange={(e) => updateOrganizador('nicho', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estratégia de Marketing */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  ESTRATÉGIA DE MARKETING
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Mercado Alvo</Label>
                  <Textarea
                    placeholder="Adulto com Espírito Jovem de 28 a 48..."
                    value={organizador.mercado_alvo || ''}
                    onChange={(e) => updateOrganizador('mercado_alvo', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Posicionamento</Label>
                  <Input
                    placeholder="Para o Sambagodeiro, o Ordi é o Bar..."
                    value={organizador.posicionamento || ''}
                    onChange={(e) => updateOrganizador('posicionamento', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">3 Singularidades</Label>
                  <div className="space-y-2 mt-1">
                    {[0, 1, 2].map((i) => (
                      <Textarea
                        key={i}
                        placeholder={`Singularidade ${i + 1}`}
                        value={organizador.singularidades?.[i] || ''}
                        onChange={(e) => updateArrayField('singularidades', i, e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        rows={2}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Metas e Visões */}
          <div className="space-y-6">
            {/* Metas do Trimestre */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas do {organizador.trimestre}º Tri
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">[NSM] Nº de Clientes Ativos</Label>
                    <Input
                      type="number"
                      value={organizador.meta_clientes_ativos || ''}
                      onChange={(e) => updateOrganizador('meta_clientes_ativos', parseInt(e.target.value) || null)}
                      className="w-28 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">[NSM INPUT] Nº Visitas</Label>
                    <Input
                      type="number"
                      value={organizador.meta_visitas || ''}
                      onChange={(e) => updateOrganizador('meta_visitas', parseInt(e.target.value) || null)}
                      className="w-28 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">[BP] CMV Limpo</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={organizador.meta_cmv_limpo || ''}
                        onChange={(e) => updateOrganizador('meta_cmv_limpo', parseFloat(e.target.value) || null)}
                        className="w-20 bg-white dark:bg-gray-700 text-right"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">[BP] CMO</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={organizador.meta_cmo || ''}
                        onChange={(e) => updateOrganizador('meta_cmo', parseFloat(e.target.value) || null)}
                        className="w-20 bg-white dark:bg-gray-700 text-right"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">[BP] % Artístico</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={organizador.meta_artistica || ''}
                        onChange={(e) => updateOrganizador('meta_artistica', parseFloat(e.target.value) || null)}
                        className="w-20 bg-white dark:bg-gray-700 text-right"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Imagem de 1 Ano */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Imagem de 1 Ano
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Textarea
                  placeholder="Ser um dos Principais Bares da Cidade"
                  value={organizador.imagem_1_ano || ''}
                  onChange={(e) => updateOrganizador('imagem_1_ano', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mb-4"
                  rows={2}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      Faturamento {organizador.ano}
                    </Label>
                    <Input
                      type="number"
                      value={organizador.faturamento_meta || ''}
                      onChange={(e) => updateOrganizador('faturamento_meta', parseFloat(e.target.value) || null)}
                      className="w-36 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Nº de Pessoas (mensal)
                    </Label>
                    <Input
                      type="number"
                      value={organizador.pessoas_meta || ''}
                      onChange={(e) => updateOrganizador('pessoas_meta', parseInt(e.target.value) || null)}
                      className="w-28 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">Reputação (Google)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={organizador.reputacao_meta || ''}
                      onChange={(e) => updateOrganizador('reputacao_meta', parseFloat(e.target.value) || null)}
                      className="w-20 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      EBITDA {organizador.ano}
                    </Label>
                    <Input
                      type="number"
                      value={organizador.ebitda_meta || ''}
                      onChange={(e) => updateOrganizador('ebitda_meta', parseFloat(e.target.value) || null)}
                      className="w-36 bg-white dark:bg-gray-700 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visões de Longo Prazo */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Visões de Longo Prazo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Meta de 10 anos</Label>
                  <Textarea
                    placeholder="Onde queremos estar em 10 anos?"
                    value={organizador.meta_10_anos || ''}
                    onChange={(e) => updateOrganizador('meta_10_anos', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Imagem de 3 anos</Label>
                  <Textarea
                    placeholder="Onde queremos estar em 3 anos?"
                    value={organizador.imagem_3_anos || ''}
                    onChange={(e) => updateOrganizador('imagem_3_anos', e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Problemas */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Principais Problemas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    placeholder={`Problema ${i + 1}`}
                    value={organizador.principais_problemas?.[i] || ''}
                    onChange={(e) => updateArrayField('principais_problemas', i, e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* OKRs / Épicos */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
          <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                OKRs (Épicos) / Histórias
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addOKR}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar OKR
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Header da Tabela */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              <div className="col-span-2">Épico</div>
              <div className="col-span-3">História / BigBet</div>
              <div className="col-span-1">Resp.</div>
              <div className="col-span-4">Observações</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Linhas de OKRs */}
            <div className="space-y-2">
              {okrs.map((okr, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${
                    okr.status === 'verde' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                    okr.status === 'amarelo' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' :
                    okr.status === 'vermelho' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                    'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="col-span-2">
                    <Input
                      placeholder="Épico"
                      value={okr.epico}
                      onChange={(e) => updateOKR(index, 'epico', e.target.value)}
                      className="bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Textarea
                      placeholder="História / BigBet"
                      value={okr.historia}
                      onChange={(e) => updateOKR(index, 'historia', e.target.value)}
                      className="bg-white dark:bg-gray-700 text-sm min-h-[60px]"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      placeholder="Nome"
                      value={okr.responsavel}
                      onChange={(e) => updateOKR(index, 'responsavel', e.target.value)}
                      className="bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <Textarea
                      placeholder="Observações e status"
                      value={okr.observacoes}
                      onChange={(e) => updateOKR(index, 'observacoes', e.target.value)}
                      className="bg-white dark:bg-gray-700 text-sm min-h-[60px]"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={okr.status}
                      onValueChange={(value) => updateOKR(index, 'status', value)}
                    >
                      <SelectTrigger className={`${getStatusColor(okr.status)} text-white border-0`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOKR(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar no Final */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSalvar} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Organizador'}
          </Button>
        </div>
      </div>
    </div>
  );
}

