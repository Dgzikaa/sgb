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
    setPageTitle('🤖 ContaAzul Playwright Collector');
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
            ...data.logs.stdout.map((line: string) => `📊 ${line}`),
            ...data.logs.stderr.map((line: string) => `⚠️ ${line}`)
          ]);
        }
      } else {
        setLogs([`❌ Erro: ${data.error}`]);
        if (data.logs) {
          setLogs(prev => [
            ...prev,
            ...data.logs.stdout.map((line: string) => `📊 ${line}`),
            ...data.logs.stderr.map((line: string) => `⚠️ ${line}`)
          ]);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      setLogs([`⚠️ Erro de conexão: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="card-description-dark">
            Coleta automática de dados financeiros com 2FA automático
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
          ✅ JavaScript + 2FA
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              🔐 Configurações de Acesso
            </CardTitle>
            <CardDescription className="card-description-dark">
              Credenciais do ContaAzul com 2FA automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="card-title-dark">📧 Email</Label>
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
              <Label htmlFor="senha" className="card-title-dark">🔑 Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="input-dark"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo" className="card-title-dark">📅 Período (dias)</Label>
              <Input
                id="periodo"
                type="number"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="30"
                min="1"
                max="365"
                className="input-dark"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={headless}
                onCheckedChange={(checked) => setHeadless(checked )}
              />
              <label className="text-sm cursor-pointer card-title-dark">
                🕵️‍♂️ Modo invisível (headless)
              </label>
            </div>

            <Button 
              onClick={executarColeta} 
              disabled={isLoading || !email || !senha}
              className="w-full btn-primary-dark"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-300"></div>
                  🤖 Executando Playwright...
                </div>
              ) : (
                '💸 Iniciar Coleta Automática'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              📊 Resultado da Coleta
            </CardTitle>
            <CardDescription className="card-description-dark">
              Dados coletados do ContaAzul
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-4">
                {resultado.success ? (
                  <div className="space-y-3">
                    <Badge variant="default" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                      ✅ Coleta realizada com sucesso
                    </Badge>
                    
                    {resultado.dados && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded border border-blue-200 dark:border-blue-700">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">💰 Valores</div>
                          <div className="text-blue-600 dark:text-blue-400">{resultado.dados.total_valores || 0}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded border border-purple-200 dark:border-purple-700">
                          <div className="font-semibold text-purple-700 dark:text-purple-300">📊 Tabelas</div>
                          <div className="text-purple-600 dark:text-purple-400">{resultado.dados.total_tabelas || 0}</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900 p-3 rounded border border-green-200 dark:border-green-700">
                          <div className="font-semibold text-green-700 dark:text-green-300">📝 Entradas</div>
                          <div className="text-green-600 dark:text-green-400">{resultado.dados.entradas?.length || 0}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900 p-3 rounded border border-red-200 dark:border-red-700">
                          <div className="font-semibold text-red-700 dark:text-red-300">💸 Saídas</div>
                          <div className="text-red-600 dark:text-red-400">{resultado.dados.saidas?.length || 0}</div>
                        </div>
                      </div>
                    )}

                    {resultado.dados?.metadados && (
                      <div className="text-xs card-description-dark space-y-1">
                        <div>🕒 {new Date(resultado.dados.metadados.timestamp).toLocaleString()}</div>
                        <div>🔗 {resultado.dados.metadados.url_financeira}</div>
                        <div>💻 {resultado.dados.metadados.metodo}</div>
                        {resultado.dados.metadados.login_com_2fa && (
                          <div className="text-green-600 dark:text-green-400">🔑 2FA automático ativado</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="destructive">
                    ❌ Falha na coleta
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center card-description-dark py-8">
                🤖 Execute a coleta para ver os resultados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 card-title-dark">
              🕵️‍♂️ Logs de Execução
            </CardTitle>
            <CardDescription className="card-description-dark">
              Detalhes da execução do Playwright
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-300 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 card-title-dark">
            💡 Informações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700 dark:text-green-400">✅ Funcionalidades</h4>
              <ul className="space-y-1 card-description-dark">
                <li>🤖 Playwright com JavaScript</li>
                <li>🔑 2FA automático via PyOTP</li>
                <li>🕵️‍♂️ Modo headless (invisível)</li>
                <li>📊 Extração de dados financeiros</li>
                <li>💾 Exportação em JSON</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">🔗 Processo</h4>
              <ul className="space-y-1 card-description-dark">
                <li>1️⃣ Login no ContaAzul</li>
                <li>2️⃣ 2FA automático</li>
                <li>3️⃣ Navegação para financeiro</li>
                <li>4️⃣ Coleta de dados</li>
                <li>5️⃣ Estruturação e retorno</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 

