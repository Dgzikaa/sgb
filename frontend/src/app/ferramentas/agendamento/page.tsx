'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
  Play,
  Plus,
  Save,
  RotateCcw,
  Search,
  Edit,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PagamentoAgendamento {
  id: string;
  cpf_cnpj: string;
  nome_beneficiario: string;
  chave_pix: string;
  valor: string;
  descricao: string;
  data_pagamento: string;
  data_competencia: string;
  categoria_id: string;
  centro_custo_id: string;
  codigo_solic?: string;
  status:
    | 'pendente'
    | 'agendado'
    | 'aguardando_aprovacao'
    | 'aprovado'
    | 'erro';
  stakeholder_id?: string;
  nibo_agendamento_id?: string;
  inter_aprovacao_id?: string;
  created_at: string;
  updated_at: string;
}

interface Stakeholder {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  type: 'fornecedor' | 'socio' | 'funcionario';
  pixKey?: string; // Adicionado para verificar a chave PIX
}

// Chaves para localStorage
const STORAGE_KEYS = {
  PAGAMENTOS: 'sgb_financeiro_pagamentos',
  BACKUP: 'sgb_financeiro_backup',
  LAST_SAVE: 'sgb_financeiro_last_save',
};

export default function AgendamentoPage() {
  const router = useRouter();
  const { setPageTitle } = usePageTitle();
  const { showToast } = useToast();

  // Helper function para toast
  const toast = useCallback((options: {
    title: string;
    description?: string;
    variant?: 'destructive';
  }) => {
    // Implementação do toast
    console.log('Toast:', options);
  }, []);

  // Estados principais
  const [pagamentos, setPagamentos] = useState<PagamentoAgendamento[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSave, setLastSave] = useState<string>('');

  // Modal de edição
  const [modalEdicao, setModalEdicao] = useState(false);
  const [pagamentoEmEdicao, setPagamentoEmEdicao] =
    useState<PagamentoAgendamento | null>(null);

  // Modal de cadastro de stakeholder
  const [modalStakeholder, setModalStakeholder] = useState(false);
  const [stakeholderEmCadastro, setStakeholderEmCadastro] = useState({
    document: '',
    name: '',
  });
  const [isCadastrandoStakeholder, setIsCadastrandoStakeholder] =
    useState(false);

  // Modal de atualização de chave PIX
  const [modalPixKey, setModalPixKey] = useState(false);
  const [stakeholderParaPix, setStakeholderParaPix] =
    useState<Stakeholder | null>(null);
  const [pixKeyData, setPixKeyData] = useState({
    pixKey: '',
    pixKeyType: 3, // 3 = CPF/CNPJ por padrão
    isSameAsDocument: false,
  });
  const [isAtualizandoPix, setIsAtualizandoPix] = useState(false);

  // Input manual
  const [novoPagamento, setNovoPagamento] = useState({
    cpf_cnpj: '',
    nome_beneficiario: '',
    chave_pix: '',
    valor: '',
    descricao: '',
    data_pagamento: '',
    data_competencia: '',
    categoria_id: '',
    centro_custo_id: '',
  });

  // Estados para categorias e centros de custo
  const [categorias, setCategorias] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Função para carregar categorias e centros de custo
  const loadCategoriasECentrosCusto = useCallback(async () => {
    setIsLoadingOptions(true);
    try {
      // Carregar categorias
      const categoriasResponse = await fetch('/api/financeiro/nibo/categorias');
      const categoriasData = await categoriasResponse.json();
      if (categoriasData.categorias) {
        setCategorias(categoriasData.categorias);
      }

      // Carregar centros de custo
      const centrosCustoResponse = await fetch(
        '/api/financeiro/nibo/centros-custo'
      );
      const centrosCustoData = await centrosCustoResponse.json();
      if (centrosCustoData.centrosCusto) {
        setCentrosCusto(centrosCustoData.centrosCusto);
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
      toast({
        title: 'Erro ao carregar opções',
        description: 'Não foi possível carregar categorias e centros de custo',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOptions(false);
    }
  }, [toast]);

  // Funções de persistência
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        pagamentos,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      localStorage.setItem(STORAGE_KEYS.PAGAMENTOS, JSON.stringify(dataToSave));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
      setLastSave(new Date().toLocaleString('pt-BR'));

      // Criar backup a cada 10 alterações
      const backupCount = localStorage.getItem('sgb_backup_count') || '0';
      if (parseInt(backupCount) % 10 === 0) {
        // TODO: Implementar createBackup quando disponível
      }
      localStorage.setItem(
        'sgb_backup_count',
        (parseInt(backupCount) + 1).toString()
      );
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados localmente',
        variant: 'destructive',
      });
    }
  }, [pagamentos, toast]);

  // Salvar automaticamente quando pagamentos mudarem
  useEffect(() => {
    if (pagamentos.length > 0) {
      saveToLocalStorage();
    }
  }, [pagamentos, saveToLocalStorage]);

  const loadSavedData = useCallback(() => {
    try {
      // Verificar se é primeira vez
      const isFirstLoad = !sessionStorage.getItem('sgb_data_loaded');

      // Primeiro, tentar carregar da chave atual
      let savedData = localStorage.getItem(STORAGE_KEYS.PAGAMENTOS);
      let parsed: any = null;
      let isMigration = false;

      if (savedData) {
        parsed = JSON.parse(savedData);
      } else {
        // Se não encontrar, tentar migrar da chave antiga
        const oldData = localStorage.getItem('pagamentos_agendamento');
        if (oldData) {
          const oldParsed = JSON.parse(oldData);

          // Migrar para o novo formato
          const migratedData = {
            pagamentos: oldParsed.pagamentos || [],
            timestamp: oldParsed.lastSave || new Date().toISOString(),
          };

          // Salvar no novo formato
          localStorage.setItem(
            STORAGE_KEYS.PAGAMENTOS,
            JSON.stringify(migratedData)
          );
          localStorage.setItem(STORAGE_KEYS.LAST_SAVE, migratedData.timestamp);

          // Remover dados antigos
          localStorage.removeItem('pagamentos_agendamento');

          parsed = migratedData;
          isMigration = true;
        }
      }

      if (parsed && parsed.pagamentos && Array.isArray(parsed.pagamentos)) {
        setPagamentos(parsed.pagamentos);
        setLastSave(new Date(parsed.timestamp).toLocaleString('pt-BR'));

        // Mostrar toast se houver pagamentos E for primeira vez
        if (parsed.pagamentos.length > 0 && isFirstLoad) {
          if (isMigration) {
            toast({
              title: '🔄 Dados migrados com sucesso!',
              description: `${parsed.pagamentos.length} pagamento(s) migrado(s) do formato antigo`,
            });
          } else {
            toast({
              title: '📋 Dados carregados!',
              description: `${parsed.pagamentos.length} pagamento(s) restaurado(s)`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
      // Tentar carregar backup se dados principais estiverem corrompidos
      // loadBackup(); // Removido para evitar dependência circular
    }
      }, [toast]);

  // Carregar dados salvos ao inicializar
  useEffect(() => {
    loadCategoriasECentrosCusto();
    loadSavedData();
  }, [loadCategoriasECentrosCusto, loadSavedData]);

  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  const createBackup = useCallback(() => {
    try {
      const backupData = {
        pagamentos,
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'backup',
      };

      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupData));
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  }, [pagamentos]);

  const loadBackup = useCallback(() => {
    try {
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (backupData) {
        const parsed: any = JSON.parse(backupData);
        if (parsed.pagamentos && Array.isArray(parsed.pagamentos)) {
          setPagamentos(parsed.pagamentos);
          setLastSave(new Date(parsed.timestamp).toLocaleString('pt-BR'));

          toast({
            title: '🔄 Backup restaurado com sucesso!',
            description: `${parsed.pagamentos.length} pagamento(s) carregado(s) do backup`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar backup:', error);
    }
  }, [toast]);

  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PAGAMENTOS);
      localStorage.removeItem(STORAGE_KEYS.BACKUP);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVE);
      localStorage.removeItem('sgb_backup_count');
      sessionStorage.removeItem('sgb_data_loaded');
      setPagamentos([]);
      setLastSave('');

      toast({
        title: '🧹 Dados limpos com sucesso!',
        description: 'Todos os dados locais foram removidos',
      });
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }, [toast]);

  // Métricas
  const getMetricas = () => {
    const total = pagamentos.length;
    const pendentes = pagamentos.filter(p => p.status === 'pendente').length;
    const agendados = pagamentos.filter(p => p.status === 'agendado').length;
    const aguardandoAprovacao = pagamentos.filter(
      p => p.status === 'aguardando_aprovacao'
    ).length;
    const aprovados = pagamentos.filter(p => p.status === 'aprovado').length;
    const erros = pagamentos.filter(p => p.status === 'erro').length;

    return {
      total,
      pendentes,
      agendados,
      aguardandoAprovacao,
      aprovados,
      erros,
    };
  };

  const metricas = getMetricas();

  // Funções de manipulação
  const adicionarPagamento = () => {
    if (
      !novoPagamento.cpf_cnpj ||
      !novoPagamento.nome_beneficiario ||
      !novoPagamento.valor ||
      !novoPagamento.data_pagamento ||
      !novoPagamento.categoria_id ||
      !novoPagamento.centro_custo_id
    ) {
      toast({
        title: '❌ Campos obrigatórios',
        description:
          'Preencha CPF/CNPJ, nome, valor, data de pagamento, categoria e centro de custo',
        variant: 'destructive',
      });
      return;
    }

    // Validar valor (pode ser negativo para categorias de saída no NIBO)
    const valorLimpo = novoPagamento.valor
      .replace('R$', '')
      .replace('.', '')
      .replace(',', '.')
      .trim();
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico === 0) {
      toast({
        title: '❌ Valor inválido',
        description: 'O valor deve ser um número diferente de zero',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const novo: PagamentoAgendamento = {
      id: Date.now().toString(),
      cpf_cnpj: removerFormatacao(novoPagamento.cpf_cnpj), // Salvar sem formatação
      nome_beneficiario: novoPagamento.nome_beneficiario,
      chave_pix: novoPagamento.chave_pix,
      valor: novoPagamento.valor,
      descricao: novoPagamento.descricao,
      data_pagamento: novoPagamento.data_pagamento,
      data_competencia: novoPagamento.data_competencia,
      categoria_id: novoPagamento.categoria_id,
      centro_custo_id: novoPagamento.centro_custo_id,
      status: 'pendente',
      created_at: now,
      updated_at: now,
    };

    setPagamentos(prev => [...prev, novo]);
    setNovoPagamento({
      cpf_cnpj: '',
      nome_beneficiario: '',
      chave_pix: '',
      valor: '',
      descricao: '',
      data_pagamento: '',
      data_competencia: '',
      categoria_id: '',
      centro_custo_id: '',
    });

    toast({
      title: '✅ Pagamento adicionado com sucesso!',
      description: `${novoPagamento.nome_beneficiario} foi adicionado à lista de pagamentos`,
    });
  };

  const agendarPagamentos = async () => {
    if (pagamentos.length === 0) {
      toast({
        title: '❌ Lista vazia',
        description: 'Adicione pagamentos antes de agendar',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    let sucessos = 0;
    let erros = 0;

    try {
      for (const pagamento of pagamentos) {
        if (pagamento.status === 'pendente') {
          try {
            // 1. Verificar/criar stakeholder no NIBO
            const stakeholder = await verificarStakeholder(pagamento);

            // 2. Agendar no NIBO
            await agendarNoNibo(pagamento, stakeholder);

            // 3. Atualizar status para agendado
            setPagamentos(prev =>
              prev.map(p =>
                p.id === pagamento.id
                  ? {
                      ...p,
                      status: 'agendado',
                      stakeholder_id: stakeholder.id,
                      updated_at: new Date().toISOString(),
                    }
                  : p
              )
            );

            sucessos++;
          } catch (pagamentoError) {
            console.error(
              `Erro no pagamento ${pagamento.nome_beneficiario}:`,
              pagamentoError
            );
            erros++;
            continue;
          }
        }
      }

      // Mostrar resultado final
      if (sucessos > 0 && erros === 0) {
        toast({
          title: '🎯 Agendamento concluído com sucesso!',
          description: `${sucessos} pagamento(s) foram agendados no NIBO`,
        });
      } else if (sucessos > 0 && erros > 0) {
        toast({
          title: '⚠️ Agendamento parcial',
          description: `${sucessos} agendados com sucesso, ${erros} com erro`,
        });
      } else if (erros > 0) {
        toast({
          title: '❌ Erro no agendamento',
          description: `${erros} pagamento(s) falharam no agendamento`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro geral ao agendar pagamentos:', error);
      toast({
        title: '❌ Erro no agendamento',
        description: 'Erro geral ao processar agendamentos no NIBO',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const verificarStakeholder = async (
    pagamento: PagamentoAgendamento
  ): Promise<Stakeholder> => {
    try {
      // Buscar stakeholder existente por CPF/CNPJ
      const cpfCnpj =
        pagamento.cpf_cnpj || pagamento.chave_pix || '00000000000';
      const response = await fetch(
        `/api/financeiro/nibo/stakeholders?q=${cpfCnpj}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        return data.data[0];
      }

      // Criar novo stakeholder
      const novoStakeholder = {
        name: pagamento.nome_beneficiario,
        document: cpfCnpj,
        type: 'fornecedor' as const,
      };

      const createResponse = await fetch('/api/financeiro/nibo/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoStakeholder),
      });

      const createData = await createResponse.json();
      return createData.data;
    } catch (error) {
      console.error('Erro ao verificar stakeholder:', error);
      throw error;
    }
  };

  const agendarNoNibo = async (
    pagamento: PagamentoAgendamento,
    stakeholder: Stakeholder
  ) => {
    try {
      // Formatar valor corretamente
      const valorNumerico = parseFloat(
        pagamento.valor.replace('R$', '').replace(',', '.').trim()
      );

      // Formatar datas no formato ISO
      const dataPagamento = new Date(pagamento.data_pagamento)
        .toISOString()
        .split('T')[0];
      const dataCompetencia = pagamento.data_competencia
        ? new Date(pagamento.data_competencia).toISOString().split('T')[0]
        : dataPagamento;

      const agendamento = {
        stakeholderId: stakeholder.id,
        dueDate: dataPagamento,
        scheduleDate: dataPagamento,
        categoria_id: pagamento.categoria_id || '',
        centro_custo_id: pagamento.centro_custo_id || '',
        categories: [{ description: pagamento.descricao || 'Pagamento PIX' }],
        accrualDate: dataCompetencia,
        value: valorNumerico,
        description:
          pagamento.descricao ||
          `Pagamento PIX para ${pagamento.nome_beneficiario}`,
        reference: pagamento.codigo_solic || undefined,
      };

      const response = await fetch('/api/financeiro/nibo/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendamento),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setPagamentos(prev =>
          prev.map(p =>
            p.id === pagamento.id
              ? {
                  ...p,
                  nibo_agendamento_id: data.data.id,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );

        // Toast individual removido - apenas a mensagem geral será exibida
      } else {
        throw new Error(data.error || 'Erro desconhecido na resposta do NIBO');
      }
    } catch (error) {
      console.error('Erro ao agendar no NIBO:', error);

      // Atualizar status do pagamento para erro
      setPagamentos(prev =>
        prev.map(p =>
          p.id === pagamento.id
            ? {
                ...p,
                status: 'erro',
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      toast({
        title: '❌ Erro no agendamento NIBO',
        description: `Erro ao agendar ${pagamento.nome_beneficiario}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });

      throw error;
    }
  };

  // Funções utilitárias
  const formatarDocumento = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, '');

    if (apenasDigitos.length <= 11) {
      return apenasDigitos
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return apenasDigitos
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const removerFormatacao = (valor: string): string => valor.replace(/\D/g, '');

  const buscarStakeholder = async (document: string) => {
    // Remover formatação antes de validar e buscar
    const documentoLimpo = removerFormatacao(document);

    if (!documentoLimpo || documentoLimpo.length < 11) {
      toast({
        title: 'CPF/CNPJ inválido',
        description: 'Digite um CPF ou CNPJ válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/financeiro/nibo/stakeholders?q=${documentoLimpo}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const stakeholder = data.data[0];

        // Stakeholder encontrado
        setNovoPagamento(prev => ({
          ...prev,
          nome_beneficiario: stakeholder.name,
          cpf_cnpj: formatarDocumento(stakeholder.document), // Formatar para exibição
          chave_pix: stakeholder.pixKey || '',
        }));

        toast({
          title: '✅ Stakeholder encontrado!',
          description: `${stakeholder.name} foi encontrado no sistema`,
        });
      } else {
        // Stakeholder não encontrado
        toast({
          title: '❌ Stakeholder não encontrado',
          description: 'Preencha manualmente ou cadastre um novo stakeholder',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar stakeholder:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao buscar stakeholder',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            Pendente
          </Badge>
        );
      case 'agendado':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Agendado
          </Badge>
        );
      case 'aguardando_aprovacao':
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
          >
            Aguardando Aprovação
          </Badge>
        );
      case 'aprovado':
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          >
            Aprovado
          </Badge>
        );
      case 'erro':
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          >
            Erro
          </Badge>
        );
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const limparLista = () => {
    const quantidade = pagamentos.length;
    setPagamentos([]);
    toast({
      title: '🧹 Lista limpa!',
      description: `${quantidade} pagamento(s) foram removidos da lista`,
    });
  };

  const removerPagamento = (id: string) => {
    const pagamento = pagamentos.find(p => p.id === id);
    setPagamentos(prev => prev.filter(p => p.id !== id));
    toast({
      title: '🗑️ Pagamento excluído!',
      description: `${pagamento?.nome_beneficiario || 'Pagamento'} foi removido da lista`,
    });
  };

  return (
    <ProtectedRoute requiredModule="financeiro">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl w-fit">
                <Wrench className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ferramenta de Agendamento
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie agendamentos de pagamentos PIX com integração NIBO e Inter
                </p>
                {lastSave && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Último salvamento: {lastSave}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar com Métricas */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <Card className="card-dark border-0 shadow-lg lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {metricas.total}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        Pendentes
                      </span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {metricas.pendentes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Agendados
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {metricas.agendados}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Aprovados
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {metricas.aprovados}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Erros
                      </span>
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {metricas.erros}
                    </span>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button
                      onClick={agendarPagamentos}
                      disabled={isProcessing || metricas.pendentes === 0}
                      className="w-full btn-primary"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Agendar no NIBO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1">
              {/* Tabs de Funcionalidades */}
              <Tabs defaultValue="manual" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md"
                  >
                    Adicionar Manual
                  </TabsTrigger>
                  <TabsTrigger
                    value="lista"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md"
                  >
                    Lista de Pagamentos
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Adicionar Manual */}
                <TabsContent value="manual">
                  <Card className="card-dark border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Adicionar Pagamento Manual
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Preencha os dados do pagamento para agendamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="cpf_cnpj"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            CPF/CNPJ *
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="cpf_cnpj"
                              value={novoPagamento.cpf_cnpj}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  cpf_cnpj: formatarDocumento(e.target.value),
                                }))
                              }
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                            <Button
                              onClick={() =>
                                buscarStakeholder(novoPagamento.cpf_cnpj)
                              }
                              type="button"
                              size="sm"
                              className="btn-primary"
                            >
                              <Search className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="nome"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Nome do Beneficiário *
                          </Label>
                          <Input
                            id="nome"
                            value={novoPagamento.nome_beneficiario}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                nome_beneficiario: e.target.value,
                              }))
                            }
                            placeholder="Nome completo"
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="chave_pix"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Chave PIX
                          </Label>
                          <Input
                            id="chave_pix"
                            value={novoPagamento.chave_pix}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                chave_pix: e.target.value,
                              }))
                            }
                            placeholder="CPF, CNPJ, email ou telefone"
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="valor"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Valor *
                          </Label>
                          <Input
                            id="valor"
                            value={novoPagamento.valor}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                valor: e.target.value,
                              }))
                            }
                            placeholder="R$ 0,00"
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="data_pagamento"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Data de Pagamento *
                          </Label>
                          <Input
                            id="data_pagamento"
                            type="date"
                            value={novoPagamento.data_pagamento}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                data_pagamento: e.target.value,
                              }))
                            }
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="data_competencia"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Data de Competência
                          </Label>
                          <Input
                            id="data_competencia"
                            type="date"
                            value={novoPagamento.data_competencia}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                data_competencia: e.target.value,
                              }))
                            }
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="descricao"
                          className="text-gray-700 dark:text-gray-300"
                        >
                          Descrição
                        </Label>
                        <Textarea
                          id="descricao"
                          value={novoPagamento.descricao}
                          onChange={e =>
                            setNovoPagamento(prev => ({
                              ...prev,
                              descricao: e.target.value,
                            }))
                          }
                          placeholder="Descrição do pagamento"
                          className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={adicionarPagamento}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar à Lista
                        </Button>
                        <Button onClick={limparLista} className="btn-outline">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Lista
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Lista de Pagamentos */}
                <TabsContent value="lista">
                  <Card className="card-dark border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white">
                            Lista de Pagamentos
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            {pagamentos.length} pagamento(s) na lista
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pagamentos.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Nenhum pagamento na lista
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Adicione pagamentos manualmente para começar
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pagamentos.map(pagamento => (
                            <div
                              key={pagamento.id}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {pagamento.nome_beneficiario}
                                  </h3>
                                  {getStatusBadge(pagamento.status)}
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div>
                                    <span className="font-medium">
                                      CPF/CNPJ:
                                    </span>{' '}
                                    {pagamento.cpf_cnpj
                                      ? formatarDocumento(pagamento.cpf_cnpj)
                                      : 'Não informado'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Valor:</span>{' '}
                                    {pagamento.valor}
                                  </div>
                                  <div>
                                    <span className="font-medium">Data:</span>{' '}
                                    {new Date(
                                      pagamento.data_pagamento
                                    ).toLocaleDateString('pt-BR')}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Chave PIX:
                                    </span>{' '}
                                    {pagamento.chave_pix || 'Não informada'}
                                  </div>
                                </div>
                                {pagamento.descricao && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <span className="font-medium">
                                      Descrição:
                                    </span>{' '}
                                    {pagamento.descricao}
                                  </div>
                                )}
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                  Criado:{' '}
                                  {new Date(
                                    pagamento.created_at
                                  ).toLocaleString('pt-BR')}{' '}
                                  | Atualizado:{' '}
                                  {new Date(
                                    pagamento.updated_at
                                  ).toLocaleString('pt-BR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  onClick={() => removerPagamento(pagamento.id)}
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-8 w-8 p-0 rounded-lg shadow-sm"
                                  title="Remover pagamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
      </div>
    </ProtectedRoute>
  );
}
