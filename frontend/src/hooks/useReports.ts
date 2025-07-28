import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';

// =====================================================
// TIPOS
// =====================================================

interface Template {
  id: string;
  nome: string;
  descricao?: string;
  categoria: 'checklist' | 'produtividade' | 'compliance' | 'custom';
  modulo: string;
  tipo_relatorio: 'tabular' | 'dashboard' | 'grafico' | 'calendario';
  configuracao_sql: string;
  configuracao_campos: Record<string, unknown>;
  configuracao_filtros: Record<string, unknown>;
  configuracao_visual?: Record<string, unknown>;
  formatos_suportados: string[];
  template_pdf?: string;
  configuracao_excel?: Record<string, unknown>;
  publico: boolean;
  roles_permitidas: string[];
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
  criado_por_usuario?: {
    nome: string;
    email: string;
  };
}

interface RelatorioPersonalizado {
  id: string;
  bar_id: string;
  nome: string;
  descricao?: string;
  template_base_id: string;
  criado_por: string;
  compartilhado_com?: string[];
  filtros_salvos: Record<string, unknown>;
  campos_selecionados: string[];
  configuracao_visual?: Record<string, unknown>;
  agendamento_ativo: boolean;
  agendamento_frequencia?: string;
  agendamento_configuracao?: Record<string, unknown>;
  proximo_agendamento?: string;
  notificar_conclusao: boolean;
  notificar_usuarios?: string[];
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
}

interface Execucao {
  id: string;
  bar_id: string;
  relatorio_personalizado_id?: string;
  template_id?: string;
  solicitado_por: string;
  tipo_execucao: 'manual' | 'agendada' | 'api';
  filtros_aplicados: Record<string, unknown>;
  campos_selecionados: string[];
  formato_exportacao: 'pdf' | 'excel' | 'csv';
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  iniciado_em: string;
  concluido_em?: string;
  total_registros?: number;
  tempo_execucao_ms?: number;
  tamanho_arquivo_kb?: number;
  arquivo_url?: string;
  dados_cache?: Record<string, unknown>[];
  erro_detalhes?: string;
  tentativas: number;
  notificacao_enviada: boolean;
  notificacao_id?: string;
  expires_at: string;

  // Relacionamentos
  template?: {
    nome: string;
    categoria: string;
    tipo_relatorio: string;
  };
  solicitado_por_usuario?: {
    nome: string;
    email: string;
  };
}

interface FiltrosTemplates {
  categoria?: string;
  modulo?: string;
  tipo_relatorio?: string;
  publico?: boolean;
  busca?: string;
  page?: number;
  limit?: number;
}

interface FiltrosExecucoes {
  status?: 'pendente' | 'processando' | 'concluido' | 'erro';
  formato?: string;
  data_inicio?: string;
  data_fim?: string;
  template_id?: string;
  page?: number;
  limit?: number;
}

interface NovoTemplate {
  nome: string;
  descricao?: string;
  categoria: 'checklist' | 'produtividade' | 'compliance' | 'custom';
  modulo?: string;
  tipo_relatorio: 'tabular' | 'dashboard' | 'grafico' | 'calendario';
  configuracao_sql: string;
  configuracao_campos: Record<string, unknown>;
  configuracao_filtros: Record<string, unknown>;
  configuracao_visual?: Record<string, unknown>;
  formatos_suportados?: string[];
  template_pdf?: string;
  configuracao_excel?: Record<string, unknown>;
  publico?: boolean;
  roles_permitidas?: string[];
}

interface ExecutarRelatorio {
  template_id: string;
  formato?: 'pdf' | 'excel' | 'csv';
  filtros?: Record<string, unknown>;
  campos_selecionados?: string[];
  notificar_conclusao?: boolean;
  salvar_como_personalizado?: boolean;
  nome_personalizado?: string;
}

interface UseReportsResult {
  // Estados principais
  templates: Template[];
  execucoes: Execucao[];
  relatoriosPersonalizados: RelatorioPersonalizado[];
  templateAtual: Template | null;
  execucaoAtual: Execucao | null;

  // Estados de carregamento
  loading: boolean;
  loadingTemplates: boolean;
  loadingExecucoes: boolean;
  executing: boolean;
  creating: boolean;
  error: string | null;

  // Dados auxiliares
  estatisticasTemplates: Record<string, unknown> | null;
  estatisticasExecucoes: Record<string, unknown> | null;
  paginacaoTemplates: Record<string, unknown> | null;
  paginacaoExecucoes: Record<string, unknown> | null;

  // Ações para templates
  carregarTemplates: (filtros?: FiltrosTemplates) => Promise<void>;
  carregarTemplate: (id: string) => Promise<void>;
  criarTemplate: (dados: NovoTemplate) => Promise<boolean>;
  atualizarTemplate: (
    id: string,
    dados: Partial<NovoTemplate>
  ) => Promise<boolean>;
  excluirTemplate: (id: string) => Promise<boolean>;

  // Ações para execuções
  carregarExecucoes: (filtros?: FiltrosExecucoes) => Promise<void>;
  carregarExecucao: (id: string) => Promise<void>;
  executarRelatorio: (dados: ExecutarRelatorio) => Promise<string | null>;
  cancelarExecucao: (id: string) => Promise<boolean>;
  baixarRelatorio: (execucaoId: string) => Promise<void>;

  // Ações para relatórios personalizados
  carregarRelatoriosPersonalizados: () => Promise<void>;
  salvarRelatorioPersonalizado: (
    dados: Record<string, unknown>
  ) => Promise<boolean>;
  excluirRelatorioPersonalizado: (id: string) => Promise<boolean>;

  // Utilitários
  obterTemplatesPorCategoria: (categoria: string) => Template[];
  formatarDadosParaExportacao: (
    dados: Record<string, unknown>[],
    template: Template
  ) => Record<string, unknown>[];
  validarFiltrosTemplate: (
    template: Template,
    filtros: Record<string, unknown>
  ) => { valido: boolean; erros: string[] };
  recarregar: () => Promise<void>;
  limparErro: () => void;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useReports(): UseReportsResult {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [relatoriosPersonalizados, setRelatoriosPersonalizados] = useState<
    RelatorioPersonalizado[]
  >([]);
  const [templateAtual, setTemplateAtual] = useState<Template | null>(null);
  const [execucaoAtual, setExecucaoAtual] = useState<Execucao | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingExecucoes, setLoadingExecucoes] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estatisticasTemplates, setEstatisticasTemplates] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [estatisticasExecucoes, setEstatisticasExecucoes] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [paginacaoTemplates, setPaginacaoTemplates] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [paginacaoExecucoes, setPaginacaoExecucoes] = useState<Record<
    string,
    unknown
  > | null>(null);

  // =====================================================
  // AÇÕES PARA TEMPLATES
  // =====================================================

  const carregarTemplates = useCallback(
    async (filtros: FiltrosTemplates = {}) => {
      try {
        setLoadingTemplates(true);
        setError(null);

        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const response = await api.get(
          `/api/configuracoes/reports/templates?${params.toString()}`
        );

        if (response.success) {
          setTemplates(response.data.templates || []);
          setEstatisticasTemplates(response.data.estatisticas);
          setPaginacaoTemplates(response.data.paginacao);
        } else {
          setError(response.error || 'Erro ao carregar templates');
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar templates:', err);
        setError('Erro ao carregar templates');
      } finally {
        setLoadingTemplates(false);
      }
    },
    []
  );

  const carregarTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/configuracoes/reports/templates/${id}`);

      if (response.success) {
        setTemplateAtual(response.data);
      } else {
        setError(response.error || 'Erro ao carregar template');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar template:', err);
      setError('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  }, []);

  const criarTemplate = useCallback(
    async (dados: NovoTemplate): Promise<boolean> => {
      try {
        setCreating(true);
        setError(null);

        const response = await api.post('/api/configuracoes/reports/templates', dados);

        if (response.success) {
          console.log('📊 Template criado com sucesso!');
          await carregarTemplates();
          return true;
        } else {
          setError(response.error || 'Erro ao criar template');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao criar template:', err);
        setError('Erro ao criar template');
        return false;
      } finally {
        setCreating(false);
      }
    },
    [carregarTemplates]
  );

  const atualizarTemplate = useCallback(
    async (id: string, dados: Partial<NovoTemplate>): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.put(`/api/configuracoes/reports/templates/${id}`, dados);

        if (response.success) {
          console.log('📊 Template atualizado com sucesso!');
          await carregarTemplates();
          if (templateAtual?.id === id) {
            await carregarTemplate(id);
          }
          return true;
        } else {
          setError(response.error || 'Erro ao atualizar template');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao atualizar template:', err);
        setError('Erro ao atualizar template');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [carregarTemplates, carregarTemplate, templateAtual]
  );

  const excluirTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.delete(`/api/configuracoes/reports/templates/${id}`);

        if (response.success) {
          console.log('🗑️ Template excluído com sucesso!');
          setTemplates(prev => prev.filter(t => t.id !== id));
          if (templateAtual?.id === id) {
            setTemplateAtual(null);
          }
          return true;
        } else {
          setError(response.error || 'Erro ao excluir template');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao excluir template:', err);
        setError('Erro ao excluir template');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [templateAtual]
  );

  // =====================================================
  // AÇÕES PARA EXECUÇÕES
  // =====================================================

  const carregarExecucoes = useCallback(
    async (filtros: FiltrosExecucoes = {}) => {
      try {
        setLoadingExecucoes(true);
        setError(null);

        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const response = await api.get(
          `/api/configuracoes/reports/execute?${params.toString()}`
        );

        if (response.success) {
          setExecucoes(response.data.execucoes || []);
          setEstatisticasExecucoes(response.data.estatisticas);
          setPaginacaoExecucoes(response.data.paginacao);
        } else {
          setError(response.error || 'Erro ao carregar execuções');
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar execuções:', err);
        setError('Erro ao carregar execuções');
      } finally {
        setLoadingExecucoes(false);
      }
    },
    []
  );

  const carregarExecucao = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/configuracoes/reports/execute/${id}`);

      if (response.success) {
        setExecucaoAtual(response.data);
      } else {
        setError(response.error || 'Erro ao carregar execução');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar execução:', err);
      setError('Erro ao carregar execução');
    } finally {
      setLoading(false);
    }
  }, []);

  const executarRelatorio = useCallback(
    async (dados: ExecutarRelatorio): Promise<string | null> => {
      try {
        setExecuting(true);
        setError(null);

        const response = await api.post('/api/configuracoes/reports/execute', dados);

        if (response.success) {
          console.log('🚀 Relatório enviado para processamento!');

          // Recarregar execuções para mostrar a nova
          await carregarExecucoes();

          return response.data.execucao_id;
        } else {
          setError(response.error || 'Erro ao executar relatório');
          return null;
        }
      } catch (err: unknown) {
        console.error('Erro ao executar relatório:', err);
        setError('Erro ao executar relatório');
        return null;
      } finally {
        setExecuting(false);
      }
    },
    [carregarExecucoes]
  );

  const cancelarExecucao = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.put(`/api/configuracoes/reports/execute/${id}`, {
          action: 'cancel',
        });

        if (response.success) {
          console.log('⏹️ Execução cancelada!');
          await carregarExecucoes();
          return true;
        } else {
          setError(response.error || 'Erro ao cancelar execução');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao cancelar execução:', err);
        setError('Erro ao cancelar execução');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [carregarExecucoes]
  );

  const baixarRelatorio = useCallback(
    async (execucaoId: string) => {
      try {
        const execucao = execucoes.find(e => e.id === execucaoId);
        if (!execucao || !execucao.arquivo_url) {
          setError('Arquivo do relatório não encontrado');
          return;
        }

        // Simular download (em produção seria redirect ou fetch do arquivo)
        const link = document.createElement('a');
        link.href = execucao.arquivo_url;
        link.download = `relatorio_${execucao.template?.nome?.toLowerCase().replace(/\s+/g, '_')}.${execucao.formato_exportacao}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`📥 Download iniciado: ${execucao.template?.nome}`);
      } catch (err: unknown) {
        console.error('Erro ao baixar relatório:', err);
        setError('Erro ao baixar relatório');
      }
    },
    [execucoes]
  );

  // =====================================================
  // AÇÕES PARA RELATÓRIOS PERSONALIZADOS
  // =====================================================

  const carregarRelatoriosPersonalizados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/configuracoes/reports/personalized');

      if (response.success) {
        setRelatoriosPersonalizados(response.data.relatorios || []);
      } else {
        setError(
          response.error || 'Erro ao carregar relatórios personalizados'
        );
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar relatórios personalizados:', err);
      setError('Erro ao carregar relatórios personalizados');
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarRelatorioPersonalizado = useCallback(
    async (dados: unknown): Promise<boolean> => {
      try {
        setCreating(true);
        setError(null);

        const response = await api.post('/api/configuracoes/reports/personalized', dados);

        if (response.success) {
          console.log('💾 Relatório personalizado salvo!');
          await carregarRelatoriosPersonalizados();
          return true;
        } else {
          setError(response.error || 'Erro ao salvar relatório personalizado');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao salvar relatório personalizado:', err);
        setError('Erro ao salvar relatório personalizado');
        return false;
      } finally {
        setCreating(false);
      }
    },
    [carregarRelatoriosPersonalizados]
  );

  const excluirRelatorioPersonalizado = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.delete(`/api/configuracoes/reports/personalized/${id}`);

        if (response.success) {
          console.log('🗑️ Relatório personalizado excluído!');
          setRelatoriosPersonalizados(prev => prev.filter(r => r.id !== id));
          return true;
        } else {
          setError(response.error || 'Erro ao excluir relatório personalizado');
          return false;
        }
      } catch (err: unknown) {
        console.error('Erro ao excluir relatório personalizado:', err);
        setError('Erro ao excluir relatório personalizado');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const obterTemplatesPorCategoria = useCallback(
    (categoria: string): Template[] => {
      return templates.filter(t => t.categoria === categoria && t.ativo);
    },
    [templates]
  );

  const formatarDadosParaExportacao = useCallback(
    (
      dados: Record<string, unknown>[],
      template: Template
    ): Record<string, unknown>[] => {
      const campos = template.configuracao_campos || {};

      return dados.map((item: Record<string, unknown>) => {
        const itemFormatado: Record<string, unknown> = {};

        Object.entries(campos).forEach(
          ([campo, config]: [string, any]) => {
            const valor = item[campo];

            switch (config.tipo as string) {
              case 'percentual':
                itemFormatado[(config.label as string) || campo] = `${valor}%`;
                break;
              case 'numero':
                itemFormatado[(config.label as string) || campo] =
                  config.decimais
                    ? parseFloat(String(valor)).toFixed(
                        config.decimais as number
                      )
                    : parseInt(String(valor));
                break;
              case 'data_hora':
                itemFormatado[(config.label as string) || campo] = valor
                  ? new Date(String(valor)).toLocaleString('pt-BR')
                  : '';
                break;
              default:
                itemFormatado[(config.label as string) || campo] = valor || '';
            }
          }
        );

        return itemFormatado;
      });
    },
    []
  );

  const validarFiltrosTemplate = useCallback(
    (
      template: Template,
      filtros: Record<string, unknown>
    ): { valido: boolean; erros: string[] } => {
      const erros: string[] = [];
      const configFiltros = template.configuracao_filtros || {};

      // Validar campos obrigatórios
      Object.entries(configFiltros).forEach(([campo, config]) => {
        const configFiltro = config as Record<string, unknown>;
        if (configFiltro.obrigatorio && !filtros[campo]) {
          erros.push(`Campo "${campo}" é obrigatório`);
        }
      });

      return {
        valido: erros.length === 0,
        erros,
      };
    },
    []
  );

  const recarregar = useCallback(async () => {
    await Promise.all([
      carregarTemplates(),
      carregarExecucoes(),
      carregarRelatoriosPersonalizados(),
    ]);
  }, [carregarTemplates, carregarExecucoes, carregarRelatoriosPersonalizados]);

  const limparErro = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados principais
    templates,
    execucoes,
    relatoriosPersonalizados,
    templateAtual,
    execucaoAtual,

    // Estados de carregamento
    loading,
    loadingTemplates,
    loadingExecucoes,
    executing,
    creating,
    error,

    // Dados auxiliares
    estatisticasTemplates,
    estatisticasExecucoes,
    paginacaoTemplates,
    paginacaoExecucoes,

    // Ações para templates
    carregarTemplates,
    carregarTemplate,
    criarTemplate,
    atualizarTemplate,
    excluirTemplate,

    // Ações para execuções
    carregarExecucoes,
    carregarExecucao,
    executarRelatorio,
    cancelarExecucao,
    baixarRelatorio,

    // Ações para relatórios personalizados
    carregarRelatoriosPersonalizados,
    salvarRelatorioPersonalizado,
    excluirRelatorioPersonalizado,

    // Utilitários
    obterTemplatesPorCategoria,
    formatarDadosParaExportacao,
    validarFiltrosTemplate,
    recarregar,
    limparErro,
  };
}

// =====================================================
// HOOKS ESPECIALIZADOS
// =====================================================

export function useReportTemplates() {
  const {
    templates,
    templateAtual,
    loadingTemplates,
    creating,
    error,
    estatisticasTemplates,
    carregarTemplates,
    carregarTemplate,
    criarTemplate,
    atualizarTemplate,
    excluirTemplate,
    obterTemplatesPorCategoria,
    limparErro,
  } = useReports();

  return {
    templates,
    templateAtual,
    loading: loadingTemplates,
    creating,
    error,
    estatisticas: estatisticasTemplates,
    carregar: carregarTemplates,
    carregarPorId: carregarTemplate,
    criar: criarTemplate,
    atualizar: atualizarTemplate,
    excluir: excluirTemplate,
    porCategoria: obterTemplatesPorCategoria,
    limparErro,
  };
}

export function useReportExecutions() {
  const {
    execucoes,
    execucaoAtual,
    loadingExecucoes,
    executing,
    error,
    estatisticasExecucoes,
    carregarExecucoes,
    carregarExecucao,
    executarRelatorio,
    cancelarExecucao,
    baixarRelatorio,
    limparErro,
  } = useReports();

  return {
    execucoes,
    execucaoAtual,
    loading: loadingExecucoes,
    executing,
    error,
    estatisticas: estatisticasExecucoes,
    carregar: carregarExecucoes,
    carregarPorId: carregarExecucao,
    executar: executarRelatorio,
    cancelar: cancelarExecucao,
    baixar: baixarRelatorio,
    limparErro,
  };
}

// =====================================================
// UTILITÁRIOS EXPORTADOS
// =====================================================

export function formatarStatusExecucao(status: string): {
  label: string;
  cor: string;
  icone: string;
} {
  switch (status) {
    case 'pendente':
      return { label: 'Pendente', cor: 'gray', icone: 'Clock' };
    case 'processando':
      return { label: 'Processando', cor: 'blue', icone: 'Loader' };
    case 'concluido':
      return { label: 'Concluído', cor: 'green', icone: 'CheckCircle' };
    case 'erro':
      return { label: 'Erro', cor: 'red', icone: 'XCircle' };
    default:
      return { label: status, cor: 'gray', icone: 'Circle' };
  }
}

export function formatarTamanhoArquivo(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
}

export function formatarTempoExecucao(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}min`;
}
