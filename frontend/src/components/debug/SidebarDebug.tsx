'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Importar os mesmos dados que o sidebar usa
const PERMISSION_MAPPINGS: Record<string, string[]> = {
  relatorios: ['relatorios', 'dashboard_financeiro_mensal', 'marketing_360'],
  home: ['home'],
  operacoes: ['operacoes', 'checklists', 'terminal_producao', 'receitas_insumos'],
  gestao: ['gestao', 'tempo', 'planejamento'],
  marketing: ['marketing', 'marketing_360'],
  financeiro: ['financeiro', 'financeiro_agendamento', 'dashboard_financeiro_mensal'],
  configuracoes: ['configuracoes'],
};

export function SidebarDebug() {
  const { hasPermission, user, loading } = usePermissions();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runPermissionTests = () => {
    const tests = [
      { name: 'user.role === "admin"', result: user?.role === 'admin' },
      { name: 'hasPermission("todos")', result: hasPermission('todos') },
      { name: 'hasPermission("relatorios")', result: hasPermission('relatorios') },
      { name: 'hasPermission("dashboard_financeiro_mensal")', result: hasPermission('dashboard_financeiro_mensal') },
      { name: 'hasPermission("marketing_360")', result: hasPermission('marketing_360') },
    ];

    // Testar mapeamento de permissões
    const hasAnyMappedPermission = (permissionKey: string) => {
      if (!permissionKey) return false;
      
      if (hasPermission('todos')) {
        return true;
      }
      
      const mappedPermissions = PERMISSION_MAPPINGS[permissionKey] || [permissionKey];
      const permissionResults = mappedPermissions.map(perm => ({
        permission: perm,
        hasAccess: hasPermission(perm)
      }));
      
      const hasAccess = permissionResults.some(result => result.hasAccess);
      return hasAccess;
    };

    const mappingTests = [
      { name: 'hasAnyMappedPermission("relatorios")', result: hasAnyMappedPermission('relatorios') },
      { name: 'hasAnyMappedPermission("home")', result: hasAnyMappedPermission('home') },
      { name: 'hasAnyMappedPermission("operacoes")', result: hasAnyMappedPermission('operacoes') },
    ];

    setTestResults([...tests, ...mappingTests]);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">🔍 Debug Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">🔍 Debug Sidebar - Permissões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usuário Atual:</h3>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {user.nome}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <Badge variant="outline">{user.role}</Badge></p>
              <p><strong>Ativo:</strong> {user.ativo ? '✅ Sim' : '❌ Não'}</p>
              <p><strong>Permissões:</strong></p>
              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(user.modulos_permitidos, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">❌ Nenhum usuário encontrado</p>
          )}
        </div>

        <div>
          <Button onClick={runPermissionTests} className="mb-4">
            🧪 Executar Testes de Permissão
          </Button>
          
          {testResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Resultados dos Testes:</h3>
              <div className="space-y-2">
                {testResults.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-mono">{test.name}</span>
                    <Badge variant={test.result ? "default" : "destructive"}>
                      {test.result ? '✅ TRUE' : '❌ FALSE'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ambiente:</h3>
          <div className="text-sm space-y-1">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
