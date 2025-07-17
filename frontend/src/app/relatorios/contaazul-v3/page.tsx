'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LogEntry {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

interface ColecaoResultV3 {
  success: boolean;
  versao: string;
  message: string;
  dados: {
    total_registros: number;
    colunas: string[];
    arquivo_excel: string;
    arquivo_json: string;
    duracao_total: string;
    registros_inseridos: number;
    screenshots_salvos: string[];
    melhorias_v3: string[];
    primeiros_registros: any[];
  };
  error?: string;
}

export default function ContaAzulV3Page() {
  const { setPageTitle } = usePageTitle();
  const [email, setEmail] = useState('rodrigo@grupomenosemais.com.br');
  const [senha, setSenha] = useState('Ca12345@');
  const [headless, setHeadless] = useState(true);
  const [forcarProcessamento, setForcarProcessamento] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ColecaoResultV3 | null>(null);
  const [statusAPI, setStatusAPI] = useState<any>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const verificarStatus = async () => {
    try {
      addLog('INFO', 'Verificando status da API V3...');
      
      const response = await fetch('/api/contaazul/playwright-v3', {
        method: 'GET'
      });

      const data = await response.json();
      setStatusAPI(data);
      
      if (data.success) {
        addLog('SUCCESS', 'API V3 funcionando corretamente');
        addLog('INFO', `Versão: ${data.versao}`);
        addLog('INFO', `Script disponível: ${data.script_v3_disponivel ? 'SIM' : 'NÃO'}`);
      } else {
        addLog('ERROR', `Erro no status: ${data.error}`);
      }
    } catch (error) {
      addLog('ERROR', `Erro de conexão: ${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('INFO', 'Iniciando coleta ContaAzul V3 (Versão Final Robusta)...');
      addLog('INFO', 'Melhorias: Unicode, DateTime, Retry, Screenshots');
      addLog('INFO', 'Performance: ~1 minuto para coleta completa');
      addLog('INFO', 'Sistema: Anti-detecção e timeouts inteligentes');

      const response = await fetch('/api/contaazul/playwright-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha,
          headless,
          forcar_processamento: forcarProcessamento
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        addLog('SUCCESS', `Coleta V3 concluída com sucesso!`);
        addLog('SUCCESS', `Total de registros coletados: ${data.dados.total_registros}`);
        addLog('SUCCESS', `Duração: ${data.dados.duracao_total}`);
        addLog('SUCCESS', `${data.dados.screenshots_salvos?.length || 0} screenshots salvos`);
        addLog('SUCCESS', `${data.dados.registros_inseridos} registros inseridos no banco`);
      } else {
        addLog('ERROR', `Erro: ${data.error}`);
        if (data.details) {
          addLog('ERROR', `Detalhes: ${data.details}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      addLog('ERROR', `Erro de conexão: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return '✔️';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600';
      case 'WARNING': return 'text-yellow-600';
      case 'ERROR': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  useEffect(() => {
    setPageTitle('ContaAzul V3 - Sistema Final Robusto');
    return () => setPageTitle('');
  }, [setPageTitle]);

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="card-description-dark">
            Versão final com todas as correções e melhorias implementadas
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="badge-success">
            ✔️ V3 Final
          </Badge>
          <Badge variant="outline" className="badge-primary">
            Robusto
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              Configurações V3
            </CardTitle>
            <CardDescription className="card-description-dark">
              Sistema com retry automático, screenshots e logs otimizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="card-title-dark">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-dark"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="card-title-dark">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="input-dark"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={headless}
                    onCheckedChange={(checked) => setHeadless(checked )}
                  />
                  <label className="text-sm cursor-pointer card-title-dark">
                    Modo invisível (headless)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={forcarProcessamento}
                    onCheckedChange={(checked) => setForcarProcessamento(checked )}
                  />
                  <label className="text-sm cursor-pointer card-title-dark">
                    Forçar processamento automático
                  </label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !email || !senha}
                  className="w-full btn-primary-dark"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-300"></div>
                      Executando V3 Robusto...
                    </div>
                  ) : (
                    'Iniciar Coleta V3 Final'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={verificarStatus}
                  disabled={isLoading}
                  className="w-full btn-outline-dark"
                >
                  Verificar Status API V3
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              Resultado V3
            </CardTitle>
            <CardDescription className="card-description-dark">
              Dados coletados com sistema robusto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold card-title-dark">Total de Registros</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.dados.total_registros.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold card-title-dark">Duração</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {result.dados.duracao_total}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold card-title-dark">Screenshots</div>
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {result.dados.screenshots_salvos?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold card-title-dark">Inseridos</div>
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {result.dados.registros_inseridos}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold card-title-dark mb-2">Melhorias V3</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {result.dados.melhorias_v3?.map((melhoria, idx) => (
                      <div key={idx} className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900 p-1 rounded">
                        ✔️ {melhoria}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold card-title-dark mb-2">Arquivos Gerados</h4>
                  <div className="space-y-1 text-xs">
                    <div className="card-description-dark">Excel: {result.dados.arquivo_excel?.split('\\').pop()}</div>
                    <div className="card-description-dark">JSON: {result.dados.arquivo_json?.split('\\').pop()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center card-description-dark py-8">
                <div className="text-4xl mb-2">ℹ️</div>
                <div className="card-title-dark">Execute a coleta para visualizar os resultados</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status da API */}
      {statusAPI && (
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">Status da API V3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold card-title-dark">Versão</div>
                <div className="text-blue-600 dark:text-blue-400">{statusAPI.versao}</div>
              </div>
              <div>
                <div className="font-semibold card-title-dark">Script V3</div>
                <div className={statusAPI.script_v3_disponivel ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {statusAPI.script_v3_disponivel ? '✔️ Disponível' : '❌ Não encontrado'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold card-title-dark mb-2">Melhorias V3</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {statusAPI.melhorias_v3?.map((melhoria: string, idx: number) => (
                    <div key={idx} className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 p-1 rounded">
                      {melhoria}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="flex items-center justify-between card-title-dark">
            Logs do Sistema V3
            <Badge variant="outline">{logs.length} entradas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center card-description-dark py-4">
                <div className="text-2xl mb-2">ℹ️</div>
                <div className="card-title-dark">Os logs aparecerão aqui durante a execução</div>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded-lg border ${getLogColor(log.type)}`}
                >
                  <span className="font-mono text-xs card-description-dark">
                    {log.timestamp}
                  </span>
                  <span className="ml-2">
                    {getLogIcon(log.type)} {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações Técnicas */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 card-title-dark">
            Informações Técnicas V3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700 dark:text-green-400">Correções V3</h4>
              <ul className="space-y-1 card-description-dark">
                <li>Unicode/emojis Windows</li>
                <li>Serialização DateTime JSON</li>
                <li>Logs otimizados</li>
                <li>Sistema de retry (3x)</li>
                <li>Screenshots automáticos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">Performance</h4>
              <ul className="space-y-1 card-description-dark">
                <li>~1 minuto para coleta</li>
                <li>Anti-detecção avançada</li>
                <li>Timeouts inteligentes</li>
                <li>Processamento otimizado</li>
                <li>Debug completo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700 dark:text-purple-400">Recursos</h4>
              <ul className="space-y-1 card-description-dark">
                <li>2FA automático (TOTP)</li>
                <li>8.460+ registros</li>
                <li>Inserção automática no banco de dados</li>
                <li>Trigger de processamento</li>
                <li>API REST completa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 

