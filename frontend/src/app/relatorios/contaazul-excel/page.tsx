import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface LogEntry {
  timestamp: string;
  type: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARNING';
  message: string;
}

interface ColecaoResult {
  success: boolean;
  message?: string;
  dados?: {
    total_registros: number;
    colunas: string[];
    arquivo_excel: string;
    arquivo_json: string;
    registros_inseridos?: number;
    tabela_raw?: string;
    primeiros_registros?: unknown[];
    metadados?: unknown;
  };
  error?: string;
  details?: string;
}

export default function ContaAzulExcelPage() {
  const [email, setEmail] = useState('rodrigo@grupomenosemais.com.br');
  const [senha, setSenha] = useState('Ca12345@');
  const [headless, setHeadless] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ColecaoResult | null>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('INFO', '💸 Iniciando coleta de dados ContaAzul...');
      addLog('INFO', '📥 Método: Download de Excel via Playwright');
      addLog('INFO', '🔐 Autenticação: Login + 2FA automático');
      addLog('INFO', '📊 Período: Todo o período disponível');

      const response = await fetch('/api/contaazul/playwright-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha,
          headless
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog('SUCCESS', '✅ Coleta realizada com sucesso!');
        
        if (data.dados) {
          addLog('INFO', `📊 Total de registros: ${data.dados.total_registros}`);
          addLog('INFO', `📁 Arquivo Excel: ${data.dados.arquivo_excel}`);
          addLog('INFO', `🗂️ Arquivo JSON: ${data.dados.arquivo_json}`);
          
          if (data.dados.registros_inseridos) {
            addLog('SUCCESS', `📈 Registros inseridos no banco: ${data.dados.registros_inseridos}`);
            addLog('INFO', `🗃️ Tabela: ${data.dados.tabela_raw}`);
          }
          
          if (data.dados.colunas) {
            addLog('INFO', `📊 Colunas encontradas: ${data.dados.colunas.join(', ')}`);
          }
        }
        
        setResult(data);
      } else {
        addLog('ERROR', `❌ Erro: ${data.error}`);
        if (data.details) {
          addLog('ERROR', `📝 Detalhes: ${data.details}`);
        }
        setResult(data);
      }

    } catch (error) {
      addLog('ERROR', `⚠️ Erro de conexão: ${error}`);
      setResult({
        success: false,
        error: 'Erro de conexão com a API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-400 dark:text-green-300';
      case 'ERROR': return 'text-red-400 dark:text-red-300';
      case 'WARNING': return 'text-yellow-400 dark:text-yellow-300';
      default: return 'text-blue-400 dark:text-blue-300';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">📥</div>
        <div>
          <h1 className="text-2xl font-bold card-title-dark">ContaAzul - Download Excel</h1>
          <p className="card-description-dark">Coleta de dados financeiros via download de planilha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Configuração */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              <span>⚙️</span>
              Configuração da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium card-title-dark">📧 Email ContaAzul</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-dark"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium card-title-dark">🔑 Senha</label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="input-dark"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={headless}
                  onCheckedChange={(checked) => setHeadless(checked )}
                />
                <label className="text-sm card-title-dark">
                  🕵️‍♂️ Modo invisível (sem abrir janela do navegador)
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">ℹ️ Informações da Coleta</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• <strong>Período:</strong> Todo o período disponível</li>
                  <li>• <strong>Método:</strong> Download de Excel automatizado</li>
                  <li>• <strong>2FA:</strong> Código gerado automaticamente</li>
                  <li>• <strong>Processamento:</strong> Conversão para JSON e inserção no banco</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-base py-3 btn-primary-dark"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-300 mr-2"></div>
                    Coletando dados...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💸</span>
                    Iniciar Coleta Excel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logs em Tempo Real */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              <span>📊</span>
              Logs da Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Aguardando início da coleta...
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{log.timestamp}</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado da Coleta */}
      {result && (
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              <span>{result.success ? '✅' : '❌'}</span>
              Resultado da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.dados?.total_registros || 0}
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-300">Registros coletados</div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.dados?.colunas?.length || 0}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Colunas identificadas</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.dados?.registros_inseridos || 0}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300">Inseridos no banco</div>
                  </div>
                </div>

                {result.dados?.colunas && (
                  <div>
                    <h4 className="font-medium mb-2 card-title-dark">📊 Colunas identificadas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.dados.colunas.map((coluna, index) => (
                        <Badge key={index} variant="secondary">
                          {coluna}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.dados?.primeiros_registros && (
                  <div>
                    <h4 className="font-medium mb-2 card-title-dark">📊 Primeiros registros:</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs card-description-dark">
                        {JSON.stringify(result.dados.primeiros_registros, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">✅ Próximos Passos</h4>
                  <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                    <li>• Dados salvos na tabela <code className="bg-green-100 dark:bg-green-800 px-1 rounded">{result.dados?.tabela_raw}</code></li>
                    <li>• Trigger automático processará os dados para a tabela final</li>
                    <li>• Dados estarão disponíveis nos relatórios em alguns minutos</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">❌ Erro na Coleta</h4>
                <p className="text-red-800 dark:text-red-300 mb-2">{result.error}</p>
                {result.details && (
                  <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800 p-2 rounded">
                    <strong>Detalhes:</strong> {result.details}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 

