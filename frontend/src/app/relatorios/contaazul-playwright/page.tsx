'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function ContaAzulPlaywrightPage() {
  const { setPageTitle } = usePageTitle();
  const [email, setEmail] = useState('rodrigo@grupomenosemais.com.br');
  const [senha, setSenha] = useState('Ca12345@');
  const [periodo, setPeriodo] = useState('30');
  const [headless, setHeadless] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    setPageTitle('ğŸ­ ContaAzul Playwright Collector');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const executarColeta = async () => {
    setIsLoading(true);
    setLogs([]);
    setResultado(null);

    try {
              const response = await fetch('/api/contaazul/playwright-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha,
          periodo: parseInt(periodo),
          headless
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data.dados || data);
        if (data.logs) {
          setLogs([
            ...data.logs.stdout.map((line: string) => `ğŸ“Š ${line}`),
            ...data.logs.stderr.map((line: string) => `š ï¸ ${line}`)
          ]);
        }
      } else {
        setLogs([`Œ Erro: ${data.error}`]);
        if (data.logs) {
          setLogs(prev => [
            ...prev,
            ...data.logs.stdout.map((line: string) => `ğŸ“Š ${line}`),
            ...data.logs.stderr.map((line: string) => `š ï¸ ${line}`)
          ]);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      setLogs([`ğŸ’¥ Erro de conexá£o: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Coleta automá¡tica de dados financeiros com 2FA automá¡tico
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          œ… JavaScript + 2FA
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuraá§á£o */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ğŸ” Configuraá§áµes de Acesso
            </CardTitle>
            <CardDescription>
              Credenciais do ContaAzul com 2FA automá¡tico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ğŸ“§ Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">ğŸ”‘ Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">ğŸ“… Perá­odo (dias)</Label>
              <Input
                id="periodo"
                type="number"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="30"
                min="1"
                max="365"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={headless}
                onCheckedChange={(checked) => setHeadless(checked as boolean)}
              />
              <label className="text-sm cursor-pointer">
                ğŸ‘» Modo invisá­vel (headless)
              </label>
            </div>

            <Button 
              onClick={executarColeta} 
              disabled={isLoading || !email || !senha}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ğŸ­ Executando Playwright...
                </div>
              ) : (
                'ğŸš€ Iniciar Coleta Automá¡tica'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ğŸ“Š Resultado da Coleta
            </CardTitle>
            <CardDescription>
              Dados coletados do ContaAzul
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-4">
                {resultado.success ? (
                  <div className="space-y-3">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      œ… Coleta realizada com sucesso
                    </Badge>
                    
                    {resultado.dados && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="font-semibold text-blue-700">ğŸ’° Valores</div>
                          <div className="text-blue-600">{resultado.dados.total_valores || 0}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="font-semibold text-purple-700">ğŸ“‹ Tabelas</div>
                          <div className="text-purple-600">{resultado.dados.total_tabelas || 0}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="font-semibold text-green-700">ğŸ“ˆ Entradas</div>
                          <div className="text-green-600">{resultado.dados.entradas?.length || 0}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <div className="font-semibold text-red-700">ğŸ“‰ Saá­das</div>
                          <div className="text-red-600">{resultado.dados.saidas?.length || 0}</div>
                        </div>
                      </div>
                    )}

                    {resultado.dados?.metadados && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>ğŸ•’ {new Date(resultado.dados.metadados.timestamp).toLocaleString()}</div>
                        <div>ğŸ”— {resultado.dados.metadados.url_financeira}</div>
                        <div>ğŸ­ {resultado.dados.metadados.metodo}</div>
                        {resultado.dados.metadados.login_com_2fa && (
                          <div className="text-green-600">ğŸ” 2FA automá¡tico ativado</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="destructive">
                    Œ Falha na coleta
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                ğŸ­ Execute a coleta para ver os resultados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ğŸ“ Logs de Execuá§á£o
            </CardTitle>
            <CardDescription>
              Detalhes da execuá§á£o do Playwright
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informaá§áµes Tá©cnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ğŸ”§ Informaá§áµes Tá©cnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">œ… Funcionalidades</h4>
              <ul className="space-y-1 text-gray-600">
                <li>ğŸ­ Playwright com JavaScript</li>
                <li>ğŸ” 2FA automá¡tico via PyOTP</li>
                <li>ğŸ‘» Modo headless (invisá­vel)</li>
                <li>ğŸ“Š Extraá§á£o de dados financeiros</li>
                <li>ğŸ’¾ Exportaá§á£o em JSON</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">ğŸ”„ Processo</h4>
              <ul className="space-y-1 text-gray-600">
                <li>1ï¸ƒ£ Login no ContaAzul</li>
                <li>2ï¸ƒ£ 2FA automá¡tico</li>
                <li>3ï¸ƒ£ Navegaá§á£o para financeiro</li>
                <li>4ï¸ƒ£ Coleta de dados</li>
                <li>5ï¸ƒ£ Estruturaá§á£o e retorno</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
