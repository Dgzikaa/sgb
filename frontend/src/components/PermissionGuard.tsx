'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Home, ArrowLeft } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredModules?: string[];
  requiredRoles?: ('admin' | 'manager' | 'funcionario')[];
  fallback?: ReactNode;
  redirectTo?: string;
  allowPublic?: boolean;
}

export default function PermissionGuard({
  children,
  requiredModules = [],
  requiredRoles = [],
  fallback,
  redirectTo = '/home',
  allowPublic = false,
}: PermissionGuardProps) {
  const { user, hasPermission, isRole, loading } = usePermissions();
  const router = useRouter();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Se permite acesso público e não tem requisitos específicos
    if (
      allowPublic &&
      requiredModules.length === 0 &&
      requiredRoles.length === 0
    ) {
      return;
    }

    // Se não está logado
    if (!user) {
      router.push('/login');
      return;
    }

    // Se não está ativo
    if (!user.ativo) {
      router.push('/login');
      return;
    }

    // Verificar roles primeiro (mais restritivo)
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => isRole(role));
      if (!hasRequiredRole) {
        setShowError(true);
        return;
      }
    }

    // Admin tem acesso a tudo por padrão (exceto se tem permissões específicas)
    if (user.role === 'admin') {
      let hasExplicitPermissions = false;
      
      if (user.modulos_permitidos) {
        // Se modulos_permitidos é um array
        if (Array.isArray(user.modulos_permitidos)) {
          hasExplicitPermissions = user.modulos_permitidos.length < 23;
        }
        // Se modulos_permitidos é um objeto
        else if (typeof user.modulos_permitidos === 'object') {
          hasExplicitPermissions = Object.keys(user.modulos_permitidos).length < 23;
        }
      }
      
      if (!hasExplicitPermissions) {
        return; // Admin com acesso total
      }
    }

    // Verificar módulos requeridos
    if (requiredModules.length > 0) {
      const hasAllModules = requiredModules.every(module =>
        hasPermission(module)
      );
      if (!hasAllModules) {
        setShowError(true);
        return;
      }
    }
  }, [
    user,
    loading,
    hasPermission,
    isRole,
    requiredModules,
    requiredRoles,
    allowPublic,
    router,
  ]);

  // Tela de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro de permissão
  if (showError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Acesso Negado
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Você não tem permissão para acessar esta página.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                  {requiredRoles.length > 0 && (
                    <div>
                      <strong className="text-gray-900 dark:text-white">Funções necessárias:</strong>{' '}
                      <span className="text-red-600 dark:text-red-400">{requiredRoles.join(', ')}</span>
                    </div>
                  )}
                  {requiredModules.length > 0 && (
                    <div>
                      <strong className="text-gray-900 dark:text-white">Módulos necessários:</strong>{' '}
                      <span className="text-red-600 dark:text-red-400">{requiredModules.join(', ')}</span>
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-900 dark:text-white">Sua função:</strong>{' '}
                    <span className="text-blue-600 dark:text-blue-400">{user?.role || 'Não definido'}</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Seus módulos:</strong>{' '}
                    <span className="text-green-600 dark:text-green-400">
                      {(() => {
                        if (!user?.modulos_permitidos) return 'Nenhum';
                        if (Array.isArray(user.modulos_permitidos)) {
                          return user.modulos_permitidos.length > 0 ? user.modulos_permitidos.join(', ') : 'Nenhum';
                        }
                        if (typeof user.modulos_permitidos === 'object') {
                          const keys = Object.keys(user.modulos_permitidos);
                          return keys.length > 0 ? keys.join(', ') : 'Nenhum';
                        }
                        return 'Nenhum';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Tentar voltar, mas se não conseguir, ir para home
                    try {
                      if (window.history.length > 1) {
                        router.back();
                      } else {
                        router.push(redirectTo);
                      }
                    } catch {
                      router.push(redirectTo);
                    }
                  }}
                  className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    // Forçar navegação para home
                    window.location.href = redirectTo;
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Home
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                Entre em contato com o administrador se precisar de acesso a esta funcionalidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se chegou até aqui, pode renderizar o conteúdo
  return <>{children}</>;
}

// Hook para usar o PermissionGuard de forma mais simples
export function usePermissionGuard(
  requiredModules: string[] = [],
  requiredRoles: ('admin' | 'manager' | 'funcionario')[] = []
) {
  const { user, hasPermission, isRole, loading } = usePermissions();
  const router = useRouter();

  const checkPermissions = () => {
    if (loading) return { allowed: false, loading: true };

    if (!user || !user.ativo) {
      return { allowed: false, loading: false, reason: 'not_authenticated' };
    }

    // Verificar roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => isRole(role));
      if (!hasRequiredRole) {
        return { allowed: false, loading: false, reason: 'insufficient_role' };
      }
    }

    // Admin com acesso total
    if (user.role === 'admin') {
      let hasExplicitPermissions = false;
      
      if (user.modulos_permitidos) {
        // Se modulos_permitidos é um array
        if (Array.isArray(user.modulos_permitidos)) {
          hasExplicitPermissions = user.modulos_permitidos.length < 23;
        }
        // Se modulos_permitidos é um objeto
        else if (typeof user.modulos_permitidos === 'object') {
          hasExplicitPermissions = Object.keys(user.modulos_permitidos).length < 23;
        }
      }
      
      if (!hasExplicitPermissions) {
        return { allowed: true, loading: false };
      }
    }

    // Verificar módulos
    if (requiredModules.length > 0) {
      const hasAllModules = requiredModules.every(module =>
        hasPermission(module)
      );
      if (!hasAllModules) {
        return {
          allowed: false,
          loading: false,
          reason: 'insufficient_modules',
        };
      }
    }

    return { allowed: true, loading: false };
  };

  const redirectToHome = () => {
    router.push('/home?error=acesso_negado');
  };

  const redirectToLogin = () => {
    router.push('/login');
  };

  return {
    ...checkPermissions(),
    redirectToHome,
    redirectToLogin,
    user,
  };
}
