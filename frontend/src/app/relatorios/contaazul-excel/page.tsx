'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent: any, CardHeader, CardTitle } from '@/components/ui/card';
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
    primeiros_registros?: any[];
    metadados?: any;
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
      addLog('INFO', 'üöÄ Iniciando coleta de dados ContaAzul...');
      addLog('INFO', 'üì• M·©todo: Download de Excel via Playwright');
      addLog('INFO', 'üîê Autentica·ß·£o: Login + 2FA autom·°tico');
      addLog('INFO', 'üìä Per·≠odo: Todo o per·≠odo dispon·≠vel');

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
        addLog('SUCCESS', 'úÖ Coleta realizada com sucesso!');
        
        if (data.dados) {
          addLog('INFO', `üìã Total de registros: ${data.dados.total_registros}`);
          addLog('INFO', `üìÅ Arquivo Excel: ${data.dados.arquivo_excel}`);
          addLog('INFO', `üìÑ Arquivo JSON: ${data.dados.arquivo_json}`);
          
          if (data.dados.registros_inseridos) {
            addLog('SUCCESS', `üíæ Registros inseridos no banco: ${data.dados.registros_inseridos}`);
            addLog('INFO', `üóÑÔ∏è Tabela: ${data.dados.tabela_raw}`);
          }
          
          if (data.dados.colunas) {
            addLog('INFO', `üìä Colunas encontradas: ${data.dados.colunas.join(', ')}`);
          }
        }
        
        setResult(data);
      } else {
        addLog('ERROR', `ùå Erro: ${data.error}`);
        if (data.details) {
          addLog('ERROR', `üìù Detalhes: ${data.details}`);
        }
        setResult(data);
      }

    } catch (error) {
      addLog('ERROR', `üí• Erro de conex·£o: ${error}`);
      setResult({
        success: false,
        error: 'Erro de conex·£o com a API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-400';
      case 'ERROR': return 'text-red-400';
      case 'WARNING': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">üì•</div>
        <div>
          <h1 className="text-2xl font-bold">ContaAzul - Download Excel</h1>
          <p className="text-gray-600">Coleta de dados financeiros via download de planilha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formul·°rio de Configura·ß·£o */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>öôÔ∏è</span>
              Configura·ß·£o da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">üìß Email ContaAzul</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">üîë Senha</label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e: any) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="text-base"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={headless}
                  onCheckedChange={(checked: any) => setHeadless(checked as boolean)}
                />
                <label className="text-sm">
                  üï∂Ô∏è Modo invis·≠vel (sem abrir janela do navegador)
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">ÑπÔ∏è Informa·ß·µes da Coleta</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Ä¢ <strong>Per·≠odo:</strong> Todo o per·≠odo dispon·≠vel</li>
                  <li>Ä¢ <strong>M·©todo:</strong> Download de Excel automatizado</li>
                  <li>Ä¢ <strong>2FA:</strong> C·≥digo gerado automaticamente</li>
                  <li>Ä¢ <strong>Processamento:</strong> Convers·£o para JSON e inser·ß·£o no banco</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-base py-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Coletando dados...
                  </>
                ) : (
                  <>
                    <span className="mr-2">üöÄ</span>
                    Iniciar Coleta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logs em Tempo Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>üìã</span>
              Logs da Execu·ß·£o
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Aguardando in·≠cio da coleta...
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log: any, index: any) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-500 text-xs">{log.timestamp}</span>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{result.success ? 'úÖ' : 'ùå'}</span>
              Resultado da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.dados?.total_registros || 0}
                    </div>
                    <div className="text-sm text-green-800">Registros coletados</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.dados?.colunas?.length || 0}
                    </div>
                    <div className="text-sm text-blue-800">Colunas identificadas</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.dados?.registros_inseridos || 0}
                    </div>
                    <div className="text-sm text-purple-800">Inseridos no banco</div>
                  </div>
                </div>

                {result.dados?.colunas && (
                  <div>
                    <h4 className="font-medium mb-2">üìä Colunas identificadas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.dados.colunas.map((coluna: any, index: any) => (
                        <Badge key={index} variant="secondary">
                          {coluna}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.dados?.primeiros_registros && (
                  <div>
                    <h4 className="font-medium mb-2">üìã Primeiros registros:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs">
                        {JSON.stringify(result.dados.primeiros_registros, null: any, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">úÖ Pr·≥ximos Passos</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>Ä¢ Dados salvos na tabela <code className="bg-green-100 px-1 rounded">{result.dados?.tabela_raw}</code></li>
                    <li>Ä¢ Trigger autom·°tico processar·° os dados para a tabela final</li>
                    <li>Ä¢ Dados estar·£o dispon·≠veis nos relat·≥rios em alguns minutos</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">ùå Erro na Coleta</h4>
                <p className="text-red-800 mb-2">{result.error}</p>
                {result.details && (
                  <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
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
