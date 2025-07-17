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
      addLog('INFO', 'ğŸ” Verificando status da API V3...');
      
      const response = await fetch('/api/contaazul/playwright-v3', {
        method: 'GET'
      });

      const data = await response.json();
      setStatusAPI(data);
      
      if (data.success) {
        addLog('SUCCESS', 'œ… API V3 funcionando corretamente');
        addLog('INFO', `ğŸ“Š Versá£o: ${data.versao}`);
        addLog('INFO', `ğŸ”§ Script disponá­vel: ${data.script_v3_disponivel ? 'SIM' : 'NáƒO'}`);
      } else {
        addLog('ERROR', `Œ Erro no status: ${data.error}`);
      }
    } catch (error) {
      addLog('ERROR', `ğŸ’¥ Erro de conexá£o: ${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('INFO', 'ğŸš€ Iniciando coleta ContaAzul V3 (Versá£o Final Robusta)...');
      addLog('INFO', 'ğŸ”§ Melhorias: Unicode, DateTime, Retry, Screenshots');
      addLog('INFO', 'š¡ Performance: ~1 minuto para coleta completa');
      addLog('INFO', 'ğŸ›¡ï¸ Sistema: Anti-detecá§á£o e timeouts inteligentes');

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
        addLog('SUCCESS', `ğŸ‰ Coleta V3 concluá­da com sucesso!`);
        addLog('SUCCESS', `ğŸ“Š ${data.dados.total_registros} registros coletados`);
        addLog('SUCCESS', `±ï¸ Duraá§á£o: ${data.dados.duracao_total}`);
        addLog('SUCCESS', `ğŸ“¸ ${data.dados.screenshots_salvos?.length || 0} screenshots salvos`);
        addLog('SUCCESS', `ğŸ’¾ ${data.dados.registros_inseridos} registros inseridos no banco`);
      } else {
        addLog('ERROR', `Œ Erro: ${data.error}`);
        if (data.details) {
          addLog('ERROR', `ğŸ“‹ Detalhes: ${data.details}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      addLog('ERROR', `ğŸ’¥ Erro de conexá£o: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return 'œ…';
      case 'WARNING': return 'š ï¸';
      case 'ERROR': return 'Œ';
      default: return '„¹ï¸';
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
    setPageTitle('ğŸš€ ContaAzul V3 - Sistema Final Robusto');
    return () => setPageTitle('');
  }, [setPageTitle]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Versá£o final com todas as correá§áµes e melhorias implementadas
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            œ… V3 Final
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            ğŸ›¡ï¸ Robusto
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuraá§á£o */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              ğŸ” Configuraá§áµes V3
            </CardTitle>
            <CardDescription>
              Sistema com retry automá¡tico, screenshots e logs otimizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">ğŸ“§ Email</Label>
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
                <Label htmlFor="senha" className="text-black">ğŸ”‘ Senha</Label>
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
                    ğŸ‘» Modo invisá­vel (headless)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={forcarProcessamento}
                    onCheckedChange={(checked) => setForcarProcessamento(checked as boolean)}
                  />
                  <label className="text-sm cursor-pointer text-black">
                    ğŸ”„ Forá§ar processamento automá¡tico
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
                      ğŸš€ Executando V3 Robusto...
                    </div>
                  ) : (
                    'ğŸš€ Iniciar Coleta V3 Final'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={verificarStatus}
                  disabled={isLoading}
                  className="w-full"
                >
                  ğŸ” Verificar Status API V3
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              ğŸ“Š Resultado V3
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
                    <div className="font-semibold text-black">ğŸ“Š Registros</div>
                    <div className="text-2xl font-bold text-green-600">
                      {result.dados.total_registros.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">±ï¸ Duraá§á£o</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {result.dados.duracao_total}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">ğŸ“¸ Screenshots</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {result.dados.screenshots_salvos?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-black">ğŸ’¾ Inseridos</div>
                    <div className="text-lg font-semibold text-orange-600">
                      {result.dados.registros_inseridos}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-black mb-2">ğŸ”§ Melhorias V3</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {result.dados.melhorias_v3?.map((melhoria, idx) => (
                      <div key={idx} className="text-xs text-green-700 bg-green-50 p-1 rounded">
                        œ… {melhoria}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">ğŸ“‹ Arquivos Gerados</h4>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-600">Excel: {result.dados.arquivo_excel?.split('\\').pop()}</div>
                    <div className="text-gray-600">JSON: {result.dados.arquivo_json?.split('\\').pop()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">ğŸš€</div>
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
            <CardTitle className="text-black">ğŸ” Status da API V3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-black">ğŸ“Š Versá£o</div>
                <div className="text-blue-600">{statusAPI.versao}</div>
              </div>
              <div>
                <div className="font-semibold text-black">ğŸ”§ Script V3</div>
                <div className={statusAPI.script_v3_disponivel ? 'text-green-600' : 'text-red-600'}>
                  {statusAPI.script_v3_disponivel ? 'œ… Disponá­vel' : 'Œ Ná£o encontrado'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold text-black mb-2">ğŸš€ Melhorias V3</div>
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
            ğŸ“‹ Logs do Sistema V3
            <Badge variant="outline">{logs.length} entradas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <div className="text-2xl mb-2">ğŸ“‹</div>
                <div className="text-black">Logs aparecerá£o aqui durante a execuá§á£o</div>
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

      {/* Informaá§áµes Tá©cnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            ğŸ”§ Informaá§áµes Tá©cnicas V3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">œ… Correá§áµes V3</h4>
              <ul className="space-y-1 text-gray-600">
                <li>ğŸ”§ Unicode/emojis Windows</li>
                <li>ğŸ“… DateTime JSON serialization</li>
                <li>ğŸ“‹ Logs otimizados</li>
                <li>ğŸ”„ Sistema de retry (3x)</li>
                <li>ğŸ“¸ Screenshots automá¡ticos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">ğŸš€ Performance</h4>
              <ul className="space-y-1 text-gray-600">
                <li>š¡ ~1 minuto para coleta</li>
                <li>ğŸ›¡ï¸ Anti-detecá§á£o avaná§ada</li>
                <li>° Timeouts inteligentes</li>
                <li>ğŸ’¾ Processamento otimizado</li>
                <li>ğŸ” Debug completo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">ğŸ¯ Recursos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>ğŸ” 2FA automá¡tico (TOTP)</li>
                <li>ğŸ“Š 8.460+ registros</li>
                <li>ğŸ’¾ Inserá§á£o automá¡tica BD</li>
                <li>ğŸ”„ Trigger processamento</li>
                <li>ğŸ“± API REST completa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
