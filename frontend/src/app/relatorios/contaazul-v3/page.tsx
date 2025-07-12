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
      addLog('INFO', '🔍 Verificando status da API V3...');
      
      const response = await fetch('/api/admin/contahub-playwright-v3', {
        method: 'GET'
      });

      const data = await response.json();
      setStatusAPI(data);
      
      if (data.success) {
        addLog('SUCCESS', '✅ API V3 funcionando corretamente');
        addLog('INFO', `📊 Versão: ${data.versao}`);
        addLog('INFO', `🔧 Script disponível: ${data.script_v3_disponivel ? 'SIM' : 'NÃO'}`);
      } else {
        addLog('ERROR', `❌ Erro no status: ${data.error}`);
      }
    } catch (error) {
      addLog('ERROR', `💥 Erro de conexão: ${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('INFO', '🚀 Iniciando coleta ContaAzul V3 (Versão Final Robusta)...');
      addLog('INFO', '🔧 Melhorias: Unicode, DateTime, Retry, Screenshots');
      addLog('INFO', '⚡ Performance: ~1 minuto para coleta completa');
      addLog('INFO', '🛡️ Sistema: Anti-detecção e timeouts inteligentes');

      const response = await fetch('/api/admin/contahub-playwright-v3', {
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
        addLog('SUCCESS', `🎉 Coleta V3 concluída com sucesso!`);
        addLog('SUCCESS', `📊 ${data.dados.total_registros} registros coletados`);
        addLog('SUCCESS', `⏱️ Duração: ${data.dados.duracao_total}`);
        addLog('SUCCESS', `📸 ${data.dados.screenshots_salvos?.length || 0} screenshots salvos`);
        addLog('SUCCESS', `💾 ${data.dados.registros_inseridos} registros inseridos no banco`);
      } else {
        addLog('ERROR', `❌ Erro: ${data.error}`);
        if (data.details) {
          addLog('ERROR', `📋 Detalhes: ${data.details}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      addLog('ERROR', `💥 Erro de conexão: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return '✅';
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
    setPageTitle('🚀 ContaAzul V3 - Sistema Final Robusto');
    return () => setPageTitle('');
  }, [setPageTitle]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Versão final com todas as correções e melhorias implementadas
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✅ V3 Final
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            🛡️ Robusto
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              🔐 Configurações V3
            </CardTitle>
            <CardDescription>
              Sistema com retry automático, screenshots e logs otimizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">📧 Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="text-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-black">🔑 Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="text-black"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={headless}
                    onCheckedChange={(checked) => setHeadless(checked as boolean)}
                  />
                  <label className="text-sm cursor-pointer text-black">
                    👻 Modo invisível (headless)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={forcarProcessamento}
                    onCheckedChange={(checked) => setForcarProcessamento(checked as boolean)}
                  />
                  <label className="text-sm cursor-pointer text-black">
                    🔄 Forçar processamento automático
                  </label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !email || !senha}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      🚀 Executando V3 Robusto...
                    </div>
                  ) : (
                    '🚀 Iniciar Coleta V3 Final'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={verificarStatus}
                  disabled={isLoading}
                  className="w-full"
                >
                  🔍 Verificar Status API V3
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              📊 Resultado V3
            </CardTitle>
            <CardDescription>
              Dados coletados com sistema robusto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-black">📊 Registros</div>
                    <div className="text-2xl font-bold text-green-600">
                      {result.dados.total_registros.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">⏱️ Duração</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {result.dados.duracao_total}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">📸 Screenshots</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {result.dados.screenshots_salvos?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">💾 Inseridos</div>
                    <div className="text-lg font-semibold text-orange-600">
                      {result.dados.registros_inseridos}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-black mb-2">🔧 Melhorias V3</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {result.dados.melhorias_v3?.map((melhoria, idx) => (
                      <div key={idx} className="text-xs text-green-700 bg-green-50 p-1 rounded">
                        ✅ {melhoria}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">📋 Arquivos Gerados</h4>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-600">Excel: {result.dados.arquivo_excel?.split('\\').pop()}</div>
                    <div className="text-gray-600">JSON: {result.dados.arquivo_json?.split('\\').pop()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🚀</div>
                <div className="text-black">Execute a coleta para ver os resultados</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status da API */}
      {statusAPI && (
        <Card>
          <CardHeader>
            <CardTitle className="text-black">🔍 Status da API V3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-black">📊 Versão</div>
                <div className="text-blue-600">{statusAPI.versao}</div>
              </div>
              <div>
                <div className="font-semibold text-black">🔧 Script V3</div>
                <div className={statusAPI.script_v3_disponivel ? 'text-green-600' : 'text-red-600'}>
                  {statusAPI.script_v3_disponivel ? '✅ Disponível' : '❌ Não encontrado'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold text-black mb-2">🚀 Melhorias V3</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {statusAPI.melhorias_v3?.map((melhoria: string, idx: number) => (
                    <div key={idx} className="text-xs text-blue-700 bg-blue-50 p-1 rounded">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-black">
            📋 Logs do Sistema V3
            <Badge variant="outline">{logs.length} entradas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-black">Logs aparecerão aqui durante a execução</div>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded-lg border ${getLogColor(log.type)}`}
                >
                  <span className="font-mono text-xs text-gray-500">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            🔧 Informações Técnicas V3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✅ Correções V3</h4>
              <ul className="space-y-1 text-gray-600">
                <li>🔧 Unicode/emojis Windows</li>
                <li>📅 DateTime JSON serialization</li>
                <li>📋 Logs otimizados</li>
                <li>🔄 Sistema de retry (3x)</li>
                <li>📸 Screenshots automáticos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">🚀 Performance</h4>
              <ul className="space-y-1 text-gray-600">
                <li>⚡ ~1 minuto para coleta</li>
                <li>🛡️ Anti-detecção avançada</li>
                <li>⏰ Timeouts inteligentes</li>
                <li>💾 Processamento otimizado</li>
                <li>🔍 Debug completo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">🎯 Recursos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>🔐 2FA automático (TOTP)</li>
                <li>📊 8.460+ registros</li>
                <li>💾 Inserção automática BD</li>
                <li>🔄 Trigger processamento</li>
                <li>📱 API REST completa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 