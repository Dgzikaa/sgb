'use client';

import { useState, useEffect } from 'react';
import { PageCard, PageText } from '@/components/ui/page-base';

interface ContaHubStatus {
  contahub_disponivel: boolean;
  contahub_status?: {
    disponivel: boolean;
    motivo?: string;
    detalhes?: {
      email_configurado: boolean;
      senha_configurada: boolean;
    };
  };
}

interface ExemploRegistro {
  [key: string]: string | number | boolean | null;
}

interface DebugEnvironment {
  [key: string]: string | number | boolean | null;
}

interface AnaliseDados {
  tipo: string;
  quantidade: number;
  amostras: ExemploRegistro[];
}

interface ResultadosAnalise {
  total_registros: number;
  tipos_encontrados: Record<string, number>;
  amostras_por_tipo: Record<string, ExemploRegistro[]>;
  sistema_raw?: TabelaInfo;
  tabelas_contahub?: Record<string, TabelaInfo>;
}

interface TesteResult {
  success: boolean;
  message: string;
  logs?: string[];
  processados?: number;
  sucessos?: number;
  erros?: number;
  errors?: string[];
  status?: {
    sistema_raw?: number;
    contahub_analitico?: number;
    contahub_periodo?: number;
    contahub_fatporhora?: number;
    contahub_pagamentos?: number;
    contahub_tempo?: number;
    contahub_nfs?: number;
    contahub_clientes_cpf?: number;
    exemplo_registro?: ExemploRegistro;
  };
  estatisticas?: {
    totalRegistros?: number;
    total_registros?: number;
    processados?: number;
    nao_processados?: number;
    registros_problematicos?: number;
    contagem_por_tipo?: Record<string, number>;
    camposIdentificados?: number;
    datasTestadas?: number;
    tempoTotal?: number;
    datasComDados?: string[];
    sucessos?: number;
    erros?: string[] | number;
  };
  totais?: {
    sistema_raw_removidos: number;
    tabelas_contahub_removidos: number;
    total_removidos: number;
    tabelas_limpas: number;
    tabelas_com_erro: number;
  };
  debug_env?: DebugEnvironment;
  resumo?: {
    tabelas_com_sucesso: number;
    tabelas_com_erro: number;
    total_campos: number;
    campos_aceitos: string[];
    campos_testados: string[];
    detalhes?: Record<string, unknown>;
    // Propriedades do debug API
    tipos_encontrados?: string[];
    datas_referencia?: string[];
    bar_ids?: number[];
  };
  // Propriedades do debug API
  analises?: AnaliseDados[];
  total_registros?: number;
  resultados?: ResultadosAnalise;
  amostra_estrutura?: ExemploRegistro[];
  ultimos_registros?: RegistroProcessado[];
  estrutura_tabela?: {
    colunas_disponiveis: string[];
    total_colunas: number;
    exemplo_registro?: ExemploRegistro;
  };
  analise?: {
    total_registros: number;
    tipos_encontrados: Record<string, number>;
    amostras_por_tipo: Record<string, ExemploRegistro[]>;
  };
}

interface TabelaInfo {
  campos_existentes: boolean;
  campos_faltantes: string[];
  total_campos: number;
  campos_encontrados: number;
  status: string;
  campos_aceitos: string[];
  campos_testados: string[];
  antes?: number;
  depois?: number;
  removidos?: number;
  erro?: string;
  detalhes?: Record<string, unknown>;
  total_existentes?: number;
  total_inexistentes?: number;
  percentual_sucesso?: number;
  campos_inexistentes?: string[];
  campos_existentes_list?: string[];
}

interface RegistroProcessado {
  id: number;
  tipo_dados?: string;
  tipo?: string;
  processado: boolean;
  tem_dados: boolean;
  data_referencia?: string;
}

interface ResultadosLimpeza {
  sistema_raw?: TabelaInfo;
  tabelas_contahub?: Record<string, TabelaInfo>;
}

interface AnaliseDiscrepancia {
  esperados?: number;
  inseridos?: number;
  diferenca?: number;
  cpfsExtras?: string[];
  cpfsFaltando?: string[];
  vdsExtras?: number[];
  vdsFaltando?: number[];
  tipos_diferentes?: string[];
  primeiros_10?: unknown[];
}

interface DadosDuplicatas {
  cpfs_duplicados?: [string, number][];
  raw_ids_duplicados?: [string, number][];
}

interface DadosContaHub {
  analise?: AnaliseDiscrepancia;
  duplicatas?: DadosDuplicatas;
  dados_esperados?: unknown[];
  dados_reais?: unknown[];
}

interface DebugDataCompleto {
  clientes_cpf?: DadosContaHub;
  periodo?: DadosContaHub;
  tempo?: DadosContaHub;
  [key: string]: unknown;
}

interface AmostraEstrutura {
  id: number;
  tipo_dados: string;
  data_referencia: string;
  estrutura_json: {
    keys_principais: string[];
    tem_metadados: boolean;
    tem_list: boolean;
    list_e_array: boolean;
    tipo_list: string;
    length_list: number;
    metadados_info?: {
      query_id: string;
      query_nome: string;
      total_registros: number;
    };
    list_info?: {
      length: number;
      primeiro_item_keys?: string[];
      primeiro_item_sample?: Record<string, unknown>;
    };
    outros_arrays?: Array<{
      campo: string;
      length: number;
      primeiro_item_keys?: string[];
    }>;
  };
}

interface StatusTabela {
  existe: boolean;
  registros: number;
  erro?: string;
}

interface TabelaContaHub {
  [key: string]: StatusTabela;
}

interface SistemaRawStatus {
  existe: boolean;
  registros: number;
}

interface TabelaContaHubInfo {
  existe: boolean;
  registros: number;
  erro?: string;
}

interface ResultadoTeste {
  status: 'sucesso' | 'erro';
  total_campos: number;
  campos_aceitos?: string[];
  campos_testados?: string[];
  erro?: string;
  detalhes?: Record<string, unknown>;
}

interface StatusResult {
  sistema_raw?: SistemaRawStatus;
  tabelas_contahub?: Record<string, TabelaContaHubInfo>;
}

interface SistemaRaw {
  existe: boolean;
  registros: number;
}

interface TabelaContaHubStatus {
  [key: string]: TabelaContaHubInfo;
}

interface Analise {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  data_criacao: string;
  resultado: string;
  estrutura_registro?: Record<string, unknown>;
  campos_identificacao?: string[];
  tem_wrapper?: boolean;
  amostra_dados?: unknown[];
}

export default function ContaHubTestePage() {
  const [loading, setLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [debugDadosLoading, setDebugDadosLoading] = useState(false);
  const [limparLoading, setLimparLoading] = useState(false);
  const [result, setResult] = useState<TesteResult | null>(null);
  const [limparDados, setLimparDados] = useState(false);
  const [debugData, setDebugData] = useState<DebugDataCompleto | null>(null);
  const [contahubStatus, setContahubStatus] = useState<ContaHubStatus | null>(
    null
  );
  const [statusLoading, setStatusLoading] = useState(true);

  // Verificar status do ContaHub ao carregar a página
  useEffect(() => {
    verificarStatusContaHub();
  }, []);

  const verificarStatusContaHub = async () => {
    try {
      const response = await fetch('/api/contahub/teste-5-dias');
      const data = await response.json();
      setContahubStatus(data);
    } catch {
      console.error('Erro ao verificar status do ContaHub');
      setContahubStatus({
        contahub_disponivel: false,
        contahub_status: {
          disponivel: false,
          motivo: 'Erro ao verificar status',
        },
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const executarTeste = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/contahub/teste-5-dias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limpar_dados_antes: limparDados }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro na requisição: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/contahub/teste-5-dias');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao verificar status: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const processarDadosRaw = async () => {
    setProcessLoading(true);

    try {
      const response = await fetch('/api/contahub/processar-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      // Processar resposta da nova estrutura com logs detalhados
      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Processamento concluído com sucesso!',
          logs: Array.isArray(data.logs) ? data.logs : [],
          estatisticas: {
            totalRegistros: data.processados || 0,
            sucessos: data.sucessos || 0,
            erros: data.erros || 0,
          },
        });
      } else {
        const errorLogs = Array.isArray(data.logs)
          ? data.logs.filter((log: string) => log.includes('❌'))
          : [];
        const allLogs = Array.isArray(data.logs) ? data.logs : [];

        setResult({
          success: false,
          message: data.error || 'Erro no processamento',
          logs: allLogs,
          errors: errorLogs,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao processar dados: ${error instanceof Error ? error.message : String(error)}`,
        logs: [`❌ Erro de conexão: ${error}`],
      });
    } finally {
      setProcessLoading(false);
    }
  };

  const debugVariaveis = async () => {
    try {
      const response = await fetch('/api/configuracoes/debug/env');
      const data = await response.json();
      setResult({
        success: true,
        message: 'Debug das variáveis de ambiente',
        debug_env: data,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao verificar variáveis: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const debugQueries = async () => {
    // This function is no longer used in the simplified UI, but keeping it for now
    // setDebugLoading(true) // This state was removed
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no debug das queries: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      // setDebugLoading(false) // This state was removed
    }
  };

  const debugDados = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-dados', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no debug dos dados: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const debugLogs = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no debug de logs: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const debugSchema = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no debug de schema: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const testFields = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-test-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no teste de campos: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const discoverFields = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-discover-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro na descoberta de campos: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const debugRawData = async () => {
    setDebugDadosLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-raw-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro no debug de dados: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDebugDadosLoading(false);
    }
  };

  const limparTodasTabelas = async () => {
    setLimparLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/configuracoes/debug/contahub-limpar-tabelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao limpar tabelas: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setLimparLoading(false);
    }
  };

  const handleDebugDiscrepancias = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando debug de discrepâncias...');

      const response = await fetch('/api/contahub/processar-raw', {
        method: 'GET',
      });

      console.log('📡 Response status:', response.status);

      const result = await response.json();
      console.log('📊 Resultado completo:', result);

      if (result.success) {
        setDebugData(result.debug_analysis);
        console.log('✅ Debug data set:', result.debug_analysis);

        // Definir como resultado também para mostrar na interface
        setResult({
          success: true,
          message: '✅ Análise de discrepâncias concluída',
          logs: [
            '🔍 Análise de discrepâncias concluída',
            `📊 Clientes CPF: ${result.debug_analysis.clientes_cpf?.analise?.esperados || 0} esperados, ${result.debug_analysis.clientes_cpf?.analise?.inseridos || 0} inseridos`,
            `📊 Período: ${result.debug_analysis.periodo?.analise?.esperados || 0} esperados, ${result.debug_analysis.periodo?.analise?.inseridos || 0} inseridos`,
            `📊 Tempo: ${result.debug_analysis.tempo?.analise?.inseridos || 0} registros inseridos`,
          ],
        });
      } else {
        console.error('❌ Erro na análise:', result.error);
        setResult({
          success: false,
          message: `❌ Erro na análise: ${result.error}`,
          logs: [`❌ Erro: ${result.error}`],
        });
      }
    } catch (error) {
      console.error('Erro ao analisar discrepâncias:', error);
      setResult({
        success: false,
        message: `❌ Erro: ${error}`,
        logs: [`❌ Erro de conexão: ${error}`],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Status do ContaHub */}
      {statusLoading ? (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">
              Verificando status do ContaHub...
            </span>
          </div>
        </div>
      ) : contahubStatus?.contahub_disponivel === false ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-500 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                ContaHub em Modo Manutenção
              </h3>
              <p className="text-yellow-700 text-sm mb-2">
                {contahubStatus?.contahub_status?.motivo ||
                  'Integração temporariamente indisponível'}
              </p>
              <div className="text-xs text-yellow-600 space-y-1">
                <div>
                  Email configurado:{' '}
                  {contahubStatus?.contahub_status?.detalhes?.email_configurado
                    ? '✅'
                    : '❌'}
                </div>
                <div>
                  Senha configurada:{' '}
                  {contahubStatus?.contahub_status?.detalhes?.senha_configurada
                    ? '✅'
                    : '❌'}
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={verificarStatusContaHub}
                  className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  🔄 Verificar Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-xl">✅</span>
            <span className="text-green-800 font-medium">
              ContaHub Operacional
            </span>
            <span className="text-green-600 text-sm">
              - Todos os sistemas funcionando
            </span>
          </div>
        </div>
      )}

      {/* Controles */}
      <PageCard>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Testes Básicos
            </h3>

            <button
              onClick={executarTeste}
              disabled={
                loading ||
                processLoading ||
                debugDadosLoading ||
                limparLoading ||
                contahubStatus?.contahub_disponivel === false
              }
              className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              title={
                contahubStatus?.contahub_disponivel === false
                  ? 'ContaHub em modo manutenção'
                  : ''
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Testando...</span>
                </>
              ) : contahubStatus?.contahub_disponivel === false ? (
                <>
                  <span>🔧</span>
                  <span>Manutenção</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Teste Simples</span>
                </>
              )}
            </button>

            <button
              onClick={executarTeste}
              disabled={
                loading ||
                processLoading ||
                debugDadosLoading ||
                limparLoading ||
                contahubStatus?.contahub_disponivel === false
              }
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              title={
                contahubStatus?.contahub_disponivel === false
                  ? 'ContaHub em modo manutenção'
                  : ''
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Executando...</span>
                </>
              ) : contahubStatus?.contahub_disponivel === false ? (
                <>
                  <span>🔧</span>
                  <span>Manutenção</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Executar Teste</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Verificações
            </h3>

            <button
              onClick={verificarStatus}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>Verificar Status</span>
                </>
              )}
            </button>

            <button
              onClick={debugRawData}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {debugDadosLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <span>🔬</span>
                  <span>Debug Dados</span>
                </>
              )}
            </button>

            <button
              onClick={handleDebugDiscrepancias}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Debug Discrepâncias</span>
                </>
              )}
            </button>

            <button
              onClick={testFields}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {debugDadosLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <span>🧪</span>
                  <span>Testar Campos</span>
                </>
              )}
            </button>

            <button
              onClick={discoverFields}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {debugDadosLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Descobrindo...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Descobrir Campos</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Processamento
            </h3>

            <button
              onClick={processarDadosRaw}
              disabled={
                loading ||
                processLoading ||
                debugDadosLoading ||
                limparLoading ||
                contahubStatus?.contahub_disponivel === false
              }
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              title={
                contahubStatus?.contahub_disponivel === false
                  ? 'ContaHub em modo manutenção'
                  : ''
              }
            >
              {processLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processando...</span>
                </>
              ) : contahubStatus?.contahub_disponivel === false ? (
                <>
                  <span>🔧</span>
                  <span>Manutenção</span>
                </>
              ) : (
                <>
                  <span>⚙️</span>
                  <span>Processar Dados</span>
                </>
              )}
            </button>

            <button
              onClick={limparTodasTabelas}
              disabled={
                loading || processLoading || debugDadosLoading || limparLoading
              }
              className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {limparLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Limpando...</span>
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  <span>Limpar Tudo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </PageCard>

      {/* Resultados */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {/* Header da resposta */}
          <div
            className={`flex items-center space-x-2 mb-4 ${result.success ? 'text-green-600' : 'text-red-600'}`}
          >
            <span className="text-lg">{result.success ? '✅' : '❌'}</span>
            <span className="font-semibold">
              {result.success ? 'Sucesso' : 'Erro'}
            </span>
          </div>

          {/* Mensagem principal */}
          <p className="text-gray-700 mb-4">{result.message}</p>

          {/* Logs do servidor (se disponíveis) */}
          {result.logs && result.logs.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                📝 Logs do Servidor:
              </h3>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-sm font-mono max-h-96 overflow-y-auto">
                {result.logs.map((log: string, index: number) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erros do servidor (se houver) */}
          {result.errors &&
            Array.isArray(result.errors) &&
            result.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-600 mb-2">
                  ⚠️ Erros Detectados:
                </h3>
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  {result.errors.map((error: string, index: number) => (
                    <div key={index} className="text-red-700 mb-1 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Estatísticas ou dados específicos */}
          {result.estatisticas && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                📊 Estatísticas:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">
                    Total de Registros
                  </div>
                  <div className="font-bold text-blue-800">
                    {result.estatisticas.totalRegistros}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Sucessos</div>
                  <div className="font-bold text-green-800">
                    {result.estatisticas.sucessos || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">Erros</div>
                  <div className="font-bold text-red-800">
                    {Array.isArray(result.estatisticas.erros)
                      ? result.estatisticas.erros.length
                      : 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultados da limpeza */}
          {result.resultados && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                🧹 Resultados da Limpeza:
              </h3>

              {/* Sistema Raw */}
              {result.resultados.sistema_raw && (
                <div className="mb-3 p-3 bg-blue-50 rounded">
                  <div className="font-medium text-blue-800">sistema_raw</div>
                  <div className="text-sm text-blue-600">
                    {result.resultados.sistema_raw.antes} →{' '}
                    {result.resultados.sistema_raw.depois}(
                    {result.resultados.sistema_raw.removidos} removidos)
                  </div>
                </div>
              )}

              {/* Detalhes por Tabela */}
              {result.resultados.tabelas_contahub && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                    📋 Detalhes por Tabela:
                  </h4>
                  {Object.entries(result.resultados.tabelas_contahub).map(
                    ([tabela, info]: [string, TabelaInfo]) => (
                      <div
                        key={tabela}
                        className="flex justify-between items-center p-2 bg-gray-100 rounded text-sm"
                      >
                        <span className="font-mono">{tabela}</span>
                        <span
                          className={
                            (info.removidos || 0) > 0
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }
                        >
                          {info.antes || 0} → {info.depois || 0} (
                          {info.removidos || 0} removidos)
                          {info.erro && (
                            <span className="text-red-500 ml-2">
                              ❌ {info.erro}
                            </span>
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Totais da limpeza */}
          {result.totais && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">
                📊 Resultados da Limpeza Completa
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700">Sistema Raw:</span>
                  <span className="font-bold text-yellow-900 ml-2">
                    {result.totais.sistema_raw_removidos} removidos
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Tabelas ContaHub:</span>
                  <span className="font-bold text-yellow-900 ml-2">
                    {result.totais.tabelas_contahub_removidos} removidos
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Total Geral:</span>
                  <span className="font-bold text-yellow-900 ml-2">
                    {result.totais.total_removidos} removidos
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Tabelas Limpas:</span>
                  <span className="font-bold text-yellow-900 ml-2">
                    {result.totais.tabelas_limpas} de{' '}
                    {
                      Object.keys(result.resultados?.tabelas_contahub || {})
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Debug de Logs */}
          {result.amostra_estrutura && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                📝 Debug de Logs e Status:
              </h3>

              {/* Estatísticas resumidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">
                    Total de Registros
                  </div>
                  <div className="font-bold text-blue-800">
                    {result.estatisticas?.total_registros || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Processados</div>
                  <div className="font-bold text-green-800">
                    {result.estatisticas?.processados || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-yellow-600">Não Processados</div>
                  <div className="font-bold text-yellow-800">
                    {result.estatisticas?.nao_processados || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">Problemáticos</div>
                  <div className="font-bold text-red-800">
                    {result.estatisticas?.registros_problematicos || 0}
                  </div>
                </div>
              </div>

              {/* Estrutura da tabela */}
              {result.estrutura_tabela && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="font-medium text-gray-800 mb-2">
                    🏗️ Estrutura da Tabela sistema_raw:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.estrutura_tabela.colunas_disponiveis.map(
                      (coluna: string) => (
                        <div
                          key={coluna}
                          className="bg-white p-2 rounded text-sm"
                        >
                          <span className="font-mono text-blue-600">
                            {coluna}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Total de colunas: {result.estrutura_tabela.total_colunas}
                  </div>
                </div>
              )}

              {/* Contagem por tipo */}
              {result.estatisticas?.contagem_por_tipo && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="font-medium text-gray-800 mb-2">
                    📊 Contagem por Tipo:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(result.estatisticas.contagem_por_tipo).map(
                      ([tipo, quantidade]: [string, number]) => (
                        <div
                          key={tipo}
                          className="bg-white p-2 rounded text-sm"
                        >
                          <span className="font-medium">{tipo}:</span>{' '}
                          <span className="text-blue-600">{quantidade}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Últimos registros */}
              {result.ultimos_registros &&
                result.ultimos_registros.length > 0 && (
                  <div className="mb-4">
                    <div className="font-medium text-gray-800 mb-2">
                      🕐 Últimos Registros:
                    </div>
                    <div className="space-y-2">
                      {result.ultimos_registros
                        .slice(0, 5)
                        .map((registro: RegistroProcessado, index: number) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${registro.processado ? 'bg-green-50' : 'bg-yellow-50'}`}
                          >
                            <div className="flex justify-between items-center">
                              <span>
                                ID #{registro.id} -{' '}
                                {registro.tipo_dados ||
                                  registro.tipo ||
                                  'sem tipo'}
                              </span>
                              <div className="flex space-x-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${registro.processado ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}
                                >
                                  {registro.processado
                                    ? 'Processado'
                                    : 'Pendente'}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${registro.tem_dados ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'}`}
                                >
                                  {registro.tem_dados
                                    ? 'Com Dados'
                                    : 'Sem Dados'}
                                </span>
                              </div>
                            </div>
                            {registro.data_referencia && (
                              <div className="text-xs text-gray-500 mt-1">
                                Data: {registro.data_referencia}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Exemplo de registro */}
              {result.estrutura_tabela?.exemplo_registro && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">
                    📄 Exemplo de Registro:
                  </div>
                  <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify(
                      result.estrutura_tabela.exemplo_registro,
                      null,
                      2
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Análise de dados (Debug Dados) */}
          {result.analise && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                🔍 Análise da Estrutura dos Dados:
              </h3>

              <div className="mb-3 p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">
                  Total de Registros Analisados:{' '}
                  {result.analise.total_registros}
                </div>
              </div>

              {result.analise.amostras_por_tipo &&
                Object.entries(result.analise.amostras_por_tipo).map(
                  (
                    [tipo, amostras]: [string, ExemploRegistro[]],
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="mb-4 p-4 bg-white border rounded"
                    >
                      <div className="mb-3 pb-2 border-b">
                        <h4 className="font-semibold text-gray-800">
                          Tipo: {tipo}
                        </h4>
                        <div className="text-sm text-gray-600">
                          Amostras: {amostras.length} registros
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Estrutura principal */}
                        <div>
                          <div className="font-medium text-gray-700 mb-1">
                            📋 Campos Disponíveis:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {amostras.length > 0 &&
                              Object.keys(amostras[0]).map(
                                (key: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                  >
                                    {key}
                                  </span>
                                )
                              )}
                          </div>
                        </div>

                        {/* Status dos campos importantes */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm">
                            <div className="font-medium">Total Campos</div>
                            <div>
                              {amostras.length > 0
                                ? Object.keys(amostras[0]).length
                                : 0}
                            </div>
                          </div>
                          <div className="p-2 bg-green-50 text-green-700 rounded text-sm">
                            <div className="font-medium">Registros</div>
                            <div>{amostras.length}</div>
                          </div>
                          <div className="p-2 bg-yellow-50 text-yellow-700 rounded text-sm">
                            <div className="font-medium">Tipo</div>
                            <div>{tipo}</div>
                          </div>
                          <div className="p-2 bg-purple-50 text-purple-700 rounded text-sm">
                            <div className="font-medium">Status</div>
                            <div>✅ Disponível</div>
                          </div>
                        </div>

                        {/* Amostra de dados */}
                        {amostras.length > 0 && (
                          <div className="p-3 bg-green-50 rounded">
                            <div className="font-medium text-green-800 mb-2">
                              📋 Amostra de Dados:
                            </div>
                            <div className="text-sm text-green-700">
                              <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(amostras[0], null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          )}

          {/* Resultado (outras APIs) */}
          {result.resultados && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                📊 Resultado:
              </h3>
              <div className="bg-white p-3 rounded border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result.resultados, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Logs da execução (APIs antigas) */}
          {result.logs && result.logs.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                📋 Logs da Execução:
              </h3>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
                {result.logs.map((line: string, index: number) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* Erros da execução (APIs antigas) */}
          {result.logs && result.logs.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-600 mb-2">
                ⚠️ Erros da Execução:
              </h3>
              <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                {result.logs
                  .filter((log: string) => log.includes('❌'))
                  .map((error: string, index: number) => (
                    <div key={index} className="text-red-700">
                      {error}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Status das tabelas */}
          {result.status && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                📊 Status das Tabelas:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sistema Raw */}
                {result.status.sistema_raw && (
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-800">sistema_raw</h4>
                    <div className="text-sm text-blue-600">
                      {typeof result.status.sistema_raw === 'object' &&
                      (result.status.sistema_raw as SistemaRawStatus).existe
                        ? `${(result.status.sistema_raw as SistemaRawStatus).registros} registros`
                        : typeof result.status.sistema_raw === 'number'
                          ? `${result.status.sistema_raw} registros`
                          : 'Tabela não encontrada'}
                    </div>
                  </div>
                )}

                {/* Tabelas ContaHub */}
                {(result.status as StatusResult).tabelas_contahub &&
                  Object.entries(
                    (result.status as StatusResult).tabelas_contahub
                  ).map(([tabela, info]: [string, TabelaContaHubInfo]) => (
                    <div key={tabela} className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium text-gray-800 font-mono text-sm">
                        {tabela}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {info.existe
                          ? `${info.registros} registros`
                          : info.erro || 'Tabela não existe'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Teste de Campos (nova funcionalidade) */}
          {result.resultados &&
            Object.entries(result.resultados || {}).some(
              ([tabela, info]: [string, TabelaInfo]) => info.campos_existentes
            ) && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  🧪 Teste de Campos das Tabelas:
                </h3>

                {/* Resumo */}
                {result.resumo && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {result.resumo.tabelas_com_sucesso}
                        </div>
                        <div className="text-sm text-green-700">Tabelas OK</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {result.resumo.tabelas_com_erro}
                        </div>
                        <div className="text-sm text-red-700">
                          Com Problemas
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalhes por tabela */}
                <div className="space-y-3">
                  {Object.entries(result.resultados || {}).map(
                    ([tabela, info]: [string, TabelaInfo]) => (
                      <div
                        key={tabela}
                        className={`p-4 rounded border ${info.status === 'sucesso' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-mono font-semibold text-gray-800">
                            {tabela}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${info.status === 'sucesso' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}
                          >
                            {info.status === 'sucesso' ? '✅ OK' : '❌ ERRO'}
                          </span>
                        </div>

                        {info.status === 'sucesso' ? (
                          <div>
                            <div className="text-sm text-green-700 mb-2">
                              Todos os {info.total_campos} campos foram aceitos
                              pela tabela
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-green-600 hover:text-green-800">
                                Ver campos testados
                              </summary>
                              <div className="mt-2 grid grid-cols-3 gap-1">
                                {info.campos_aceitos?.map((campo: string) => (
                                  <span
                                    key={campo}
                                    className="bg-green-100 px-2 py-1 rounded font-mono text-green-800"
                                  >
                                    {campo}
                                  </span>
                                ))}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-red-700 mb-2">
                              Erro ao inserir dados: {info.erro}
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-red-600 hover:text-red-800">
                                Ver campos testados ({info.total_campos})
                              </summary>
                              <div className="mt-2 grid grid-cols-3 gap-1">
                                {info.campos_testados?.map((campo: string) => (
                                  <span
                                    key={campo}
                                    className="bg-red-100 px-2 py-1 rounded font-mono text-red-800"
                                  >
                                    {campo}
                                  </span>
                                ))}
                              </div>
                            </details>
                            {info.detalhes && (
                              <details className="text-xs mt-2">
                                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                                  Ver detalhes do erro
                                </summary>
                                <pre className="mt-2 bg-red-100 p-2 rounded text-red-800 overflow-x-auto">
                                  {JSON.stringify(info.detalhes, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Debug de Discrepâncias */}
          {debugData && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                🔍 Análise de Discrepâncias dos Dados
              </h3>

              {/* Análise Clientes CPF */}
              {debugData.clientes_cpf && (
                <div className="p-4 border border-gray-200 rounded-lg mb-4">
                  <h4 className="font-semibold text-lg mb-3">
                    📋 Clientes CPF:
                  </h4>

                  {/* Resumo da discrepância */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {debugData.clientes_cpf.analise?.esperados || 0}
                      </div>
                      <div className="text-sm text-blue-700">Esperados</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {debugData.clientes_cpf.analise?.inseridos || 0}
                      </div>
                      <div className="text-sm text-green-700">Inseridos</div>
                    </div>
                    <div
                      className={`text-center p-3 rounded ${(debugData.clientes_cpf.analise?.diferenca || 0) === 0 ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <div
                        className={`text-2xl font-bold ${(debugData.clientes_cpf.analise?.diferenca || 0) === 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {debugData.clientes_cpf.analise?.diferenca > 0
                          ? '+'
                          : ''}
                        {debugData.clientes_cpf.analise?.diferenca || 0}
                      </div>
                      <div
                        className={`text-sm ${(debugData.clientes_cpf.analise?.diferenca || 0) === 0 ? 'text-green-700' : 'text-red-700'}`}
                      >
                        Diferença
                      </div>
                    </div>
                  </div>

                  {/* CPFs Extras */}
                  {debugData.clientes_cpf.analise?.cpfsExtras?.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-semibold text-red-800 mb-2">
                        ❌ CPFs Extras (não deveriam estar no banco):
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {debugData.clientes_cpf?.analise?.cpfsExtras?.map(
                          (cpf: string) => (
                            <div
                              key={cpf}
                              className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono"
                            >
                              {cpf}
                            </div>
                          )
                        ) || []}
                      </div>
                    </div>
                  )}

                  {/* CPFs Faltando */}
                  {debugData.clientes_cpf.analise?.cpfsFaltando?.length > 0 && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                      <h5 className="font-semibold text-orange-800 mb-2">
                        ⚠️ CPFs Faltando (deveriam estar no banco):
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {debugData.clientes_cpf?.analise?.cpfsFaltando?.map(
                          (cpf: string) => (
                            <div
                              key={cpf}
                              className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-mono"
                            >
                              {cpf}
                            </div>
                          )
                        ) || []}
                      </div>
                    </div>
                  )}

                  {/* CPFs Duplicados */}
                  {debugData.clientes_cpf.duplicatas?.cpfs_duplicados?.length >
                    0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        🔄 CPFs Duplicados:
                      </h5>
                      <div className="space-y-1">
                        {debugData.clientes_cpf?.duplicatas?.cpfs_duplicados?.map(
                          ([cpf, count]: [string, number]) => (
                            <div
                              key={cpf}
                              className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono"
                            >
                              {cpf}{' '}
                              <span className="font-bold">({count} vezes)</span>
                            </div>
                          )
                        ) || []}
                      </div>
                    </div>
                  )}

                  {/* Raw IDs Duplicados */}
                  {debugData.clientes_cpf.duplicatas?.raw_ids_duplicados
                    ?.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
                      <h5 className="font-semibold text-purple-800 mb-2">
                        🔢 Raw IDs com Múltiplos Registros:
                      </h5>
                      <div className="space-y-1">
                        {debugData.clientes_cpf?.duplicatas?.raw_ids_duplicados?.map(
                          ([rawId, count]: [string, number]) => (
                            <div
                              key={rawId}
                              className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono"
                            >
                              Raw ID {rawId}{' '}
                              <span className="font-bold">
                                ({count} registros)
                              </span>
                            </div>
                          )
                        ) || []}
                      </div>
                    </div>
                  )}

                  {/* Comparação Detalhada */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      📊 Ver Comparação Detalhada dos Dados
                    </summary>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h6 className="font-semibold text-green-800 mb-2">
                          ✅ Dados Esperados (ContaHub):
                        </h6>
                        <div className="bg-green-50 p-3 rounded max-h-60 overflow-y-auto">
                          <pre className="text-xs text-green-800">
                            {JSON.stringify(
                              debugData.clientes_cpf.dados_esperados,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h6 className="font-semibold text-blue-800 mb-2">
                          🗄️ Dados Reais (Banco):
                        </h6>
                        <div className="bg-blue-50 p-3 rounded max-h-60 overflow-y-auto">
                          <pre className="text-xs text-blue-800">
                            {JSON.stringify(
                              debugData.clientes_cpf.dados_reais,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Análise Período */}
              {debugData.periodo && (
                <div className="p-4 border border-gray-200 rounded-lg mb-4">
                  <h4 className="font-semibold text-lg mb-3">📅 Período:</h4>

                  {/* Resumo da discrepância período */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {debugData.periodo.analise?.esperados || 0}
                      </div>
                      <div className="text-sm text-blue-700">
                        Esperados (amostra)
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {debugData.periodo.analise?.inseridos || 0}
                      </div>
                      <div className="text-sm text-green-700">Inseridos</div>
                    </div>
                    <div
                      className={`text-center p-3 rounded ${(debugData.periodo.analise?.diferenca || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <div
                        className={`text-2xl font-bold ${(debugData.periodo.analise?.diferenca || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {debugData.periodo.analise?.diferenca > 0 ? '+' : ''}
                        {debugData.periodo.analise?.diferenca || 0}
                      </div>
                      <div
                        className={`text-sm ${(debugData.periodo.analise?.diferenca || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}
                      >
                        Diferença
                      </div>
                    </div>
                  </div>

                  {/* VDs Extras */}
                  {debugData.periodo.analise?.vdsExtras?.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-semibold text-red-800 mb-2">
                        ❌ VDs Extras (não esperados):
                      </h5>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {debugData.periodo.analise.vdsExtras
                          .slice(0, 20)
                          .map((vd: number) => (
                            <div
                              key={vd}
                              className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono text-center"
                            >
                              {vd}
                            </div>
                          ))}
                        {debugData.periodo.analise.vdsExtras.length > 20 && (
                          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono text-center">
                            +{debugData.periodo.analise.vdsExtras.length - 20}{' '}
                            mais
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VDs Faltando */}
                  {debugData.periodo.analise?.vdsFaltando?.length > 0 && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                      <h5 className="font-semibold text-orange-800 mb-2">
                        ⚠️ VDs Faltando:
                      </h5>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {debugData.periodo.analise.vdsFaltando.map(
                          (vd: number) => (
                            <div
                              key={vd}
                              className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-mono text-center"
                            >
                              {vd}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dados Reais vs Esperados */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      📊 Ver Dados de Período Detalhados
                    </summary>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h6 className="font-semibold text-blue-800 mb-2">
                          ✅ Primeiros 10 Esperados:
                        </h6>
                        <div className="bg-blue-50 p-3 rounded max-h-60 overflow-y-auto">
                          <pre className="text-xs text-blue-800">
                            {JSON.stringify(
                              debugData.periodo.dados_esperados,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h6 className="font-semibold text-green-800 mb-2">
                          🗄️ Primeiros 10 Reais:
                        </h6>
                        <div className="bg-green-50 p-3 rounded max-h-60 overflow-y-auto">
                          <pre className="text-xs text-green-800">
                            {JSON.stringify(
                              debugData.periodo.dados_reais?.slice(0, 10),
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Análise Tempo */}
              {debugData.tempo && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3">
                    ⏱️ Tempo (Apenas Dados Reais):
                  </h4>

                  {/* Resumo tempo - APENAS DADOS REAIS */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-xl font-bold text-blue-600">
                        {debugData.tempo.analise?.inseridos || 0}
                      </div>
                      <div className="text-sm text-blue-700">
                        Total Inseridos
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-xl font-bold text-green-600">
                        {debugData.tempo.analise?.tipos_diferentes
                          ?.dados_reais_completos || 0}
                      </div>
                      <div className="text-sm text-green-700">
                        Dados Reais Completos
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    📝 <strong>Política:</strong> Apenas registros com vd, itm e
                    prd válidos são inseridos. Dados incompletos são ignorados
                    (não geram erro).
                  </div>

                  {/* Dados de exemplo */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      📊 Ver Primeiros 10 Registros de Tempo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                        <pre className="text-xs text-gray-800">
                          {JSON.stringify(
                            debugData.tempo.analise?.primeiros_10,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* Descoberta de Campos (nova funcionalidade) */}
          {result.resultados &&
            Object.entries(result.resultados || {}).some(
              ([tabela, info]: [string, TabelaInfo]) => info.campos_existentes
            ) && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  🔍 Descoberta de Campos Reais:
                </h3>

                <div className="space-y-4">
                  {Object.entries(result.resultados || {}).map(
                    ([tabela, info]: [string, TabelaInfo]) => {
                      if (!info.campos_existentes) return null;

                      return (
                        <div
                          key={tabela}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-mono font-semibold text-gray-800">
                              {tabela}
                            </h4>
                            <div className="flex space-x-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                ✅ {info.total_existentes || 0} existem
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                                ❌ {info.total_inexistentes || 0} faltam
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {info.percentual_sucesso || 0}% sucesso
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Campos que existem */}
                            <div>
                              <h5 className="text-sm font-semibold text-green-700 mb-2">
                                ✅ Campos que EXISTEM ({info.total_existentes || 0}):
                              </h5>
                              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                                {info.campos_existentes_list?.map((campo: string) => (
                                  <span
                                    key={campo}
                                    className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs font-mono border border-green-200"
                                  >
                                    {campo}
                                  </span>
                                )) || []}
                              </div>
                            </div>

                            {/* Campos que NÃO existem */}
                            {info.total_inexistentes && info.total_inexistentes > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-red-700 mb-2">
                                  ❌ Campos que NÃO EXISTEM (
                                  {info.total_inexistentes}):
                                </h5>
                                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                                  {info.campos_inexistentes?.map(
                                    (campo: string) => (
                                      <span
                                        key={campo}
                                        className="bg-red-50 text-red-800 px-2 py-1 rounded text-xs font-mono border border-red-200"
                                      >
                                        {campo}
                                      </span>
                                    )
                                  ) || []}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

          {/* Debug Raw Data (nova funcionalidade) */}
          {result.analises && result.analises.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                🔬 Análise da Estrutura dos Dados:
              </h3>

              {/* Resumo geral */}
              {result.resumo && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    📊 Resumo Geral:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-700">
                        Tipos encontrados:
                      </div>
                      <div className="text-blue-600">
                        {result.resumo.tipos_encontrados?.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-700">
                        Datas de referência:
                      </div>
                      <div className="text-blue-600">
                        {result.resumo.datas_referencia?.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-700">Bar IDs:</div>
                      <div className="text-blue-600">
                        {result.resumo.bar_ids?.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Análises detalhadas */}
              <div className="space-y-4">
                {result.analises.map((analise: Analise, index: number) => (
                  <div
                    key={analise.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-mono font-semibold text-gray-800">
                          {analise.titulo}
                        </h4>
                        <div className="text-sm text-gray-600">
                          Descrição: {analise.descricao}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Status: {analise.status}
                      </span>
                    </div>

                    {/* Estrutura do registro */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                          🏗️ Estrutura do Registro:
                        </h5>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <div>
                            <strong>Campos diretos:</strong>{' '}
                            {analise.estrutura_registro?.campos_diretos?.join(
                              ', '
                            )}
                          </div>
                          <div>
                            <strong>Tem dados:</strong>{' '}
                            {analise.estrutura_registro?.tem_dados
                              ? '✅'
                              : '❌'}
                          </div>
                          <div>
                            <strong>Tipo de dados:</strong>{' '}
                            {analise.estrutura_registro?.tipo_dados_campo}
                          </div>
                          <div>
                            <strong>É objeto:</strong>{' '}
                            {analise.estrutura_registro?.dados_e_objeto
                              ? '✅'
                              : '❌'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                          🔍 Campos de Identificação:
                        </h5>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          {typeof analise.campos_identificacao === 'object' &&
                          analise.campos_identificacao !== null ? (
                            <>
                              <div>
                                <strong>vd:</strong>{' '}
                                {analise.campos_identificacao.tem_vd
                                  ? '✅'
                                  : '❌'}
                              </div>
                              <div>
                                <strong>trn:</strong>{' '}
                                {analise.campos_identificacao.tem_trn
                                  ? '✅'
                                  : '❌'}
                              </div>
                              <div>
                                <strong>dt_gerencial:</strong>{' '}
                                {analise.campos_identificacao.tem_dt_gerencial
                                  ? '✅'
                                  : '❌'}
                              </div>
                              <div>
                                <strong>pag:</strong>{' '}
                                {analise.campos_identificacao.tem_pag
                                  ? '✅'
                                  : '❌'}
                              </div>
                              <div>
                                <strong>itm/prd:</strong>{' '}
                                {analise.campos_identificacao.tem_itm
                                  ? '✅'
                                  : '❌'}{' '}
                                /{' '}
                                {analise.campos_identificacao.tem_prd
                                  ? '✅'
                                  : '❌'}
                              </div>
                              <div>
                                <strong>hora/dds:</strong>{' '}
                                {analise.campos_identificacao.tem_hora
                                  ? '✅'
                                  : '❌'}{' '}
                                /{' '}
                                {analise.campos_identificacao.tem_dds
                                  ? '✅'
                                  : '❌'}
                              </div>
                              {analise.campos_identificacao
                                .primeiros_campos && (
                                <div>
                                  <strong>Primeiros campos:</strong>{' '}
                                  {analise.campos_identificacao.primeiros_campos.join(
                                    ', '
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-red-600">
                              {String(analise.campos_identificacao)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Wrapper format */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">
                        📦 Wrapper Format:
                      </h5>
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <div>
                          <strong>Tem wrapper:</strong>{' '}
                          {analise.tem_wrapper ? '✅ SIM' : '❌ NÃO'}
                        </div>
                      </div>
                    </div>

                    {/* Amostra dos dados */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                        📋 Ver Amostra dos Dados
                      </summary>
                      <div className="mt-2 bg-gray-100 p-3 rounded overflow-x-auto">
                        <pre className="text-xs text-gray-800">
                          {JSON.stringify(analise.amostra_dados, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações */}
      <PageCard>
        <div className="space-y-3">
          <PageText variant="subtitle">ℹ️ Informações do Teste</PageText>
          <div className="space-y-2">
            <PageText variant="body">
              • <strong>Período:</strong> 31/01/2025 até 04/02/2025 (5 dias)
            </PageText>
            <PageText variant="body">
              • <strong>Objetivo:</strong> Verificar mapeamento completo dos
              dados do ContaHub
            </PageText>
            <PageText variant="body">
              • <strong>Tabelas:</strong> contahub_analitico, contahub_periodo,
              contahub_fatporhora, etc.
            </PageText>
            <PageText variant="body">
              • <strong>Sistema:</strong> Coleta automatizada via API do
              ContaHub
            </PageText>
            <PageText variant="body">
              • <strong>🚀 Executar Teste:</strong> Coleta dados de 5 dias e
              salva na sistema_raw
            </PageText>
            <PageText variant="body">
              • <strong>⚙️ Processar Dados:</strong> Processa dados da
              sistema_raw para tabelas específicas
            </PageText>
            <PageText variant="body">
              • <strong>📊 Verificar Status:</strong> Mostra status das tabelas
              ContaHub
            </PageText>
            <PageText variant="body">
              • <strong>🔧 Debug Dados:</strong> Analisa a estrutura dos dados
              salvos na sistema_raw para entender campos disponíveis
            </PageText>
            <PageText variant="body">
              • <strong>🧹 Limpar Tudo:</strong> Remove TODOS os dados das
              tabelas contahub_* e sistema_raw do ContaHub
            </PageText>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
