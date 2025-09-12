'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PermissionsDebug() {
  const { user, hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">🔍 Debug Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">🔍 Debug Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">❌ Nenhum usuário encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const permissionsToCheck = [
    'todos',
    'relatorios', 
    'dashboard_financeiro_mensal',
    'marketing_360',
    'configuracoes',
    'home'
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">🔍 Debug Permissões - {user.nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dados do Usuário:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <Badge variant="outline">{user.role}</Badge></p>
            <p><strong>Ativo:</strong> {user.ativo ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Módulos Permitidos:</strong></p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(user.modulos_permitidos, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Verificação de Permissões:</h3>
          <div className="grid grid-cols-2 gap-2">
            {permissionsToCheck.map(permission => {
              const hasAccess = hasPermission(permission);
              return (
                <div key={permission} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">{permission}</span>
                  <Badge variant={hasAccess ? "default" : "destructive"}>
                    {hasAccess ? '✅' : '❌'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">LocalStorage:</h3>
          <div className="text-xs">
            <p><strong>sgb_user existe:</strong> {typeof window !== 'undefined' && localStorage.getItem('sgb_user') ? '✅ Sim' : '❌ Não'}</p>
            {typeof window !== 'undefined' && localStorage.getItem('sgb_user') && (
              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 overflow-auto">
                {localStorage.getItem('sgb_user')}
              </pre>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
