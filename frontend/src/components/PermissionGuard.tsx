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
      const hasExplicitPermissions =
        user.modulos_permitidos && user.modulos_permitidos.length < 23;
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="text-center">
                <div className="mb-4">
                  <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-800 mb-2">
                    Acesso Negado
                  </h2>
                  <p className="text-red-700 mb-4">
                    Você não tem permissão para acessar esta página.
                  </p>
                </div>

                <div className="bg-red-100 rounded-lg p-4 mb-6">
                  <div className="text-sm space-y-2">
                    {requiredRoles.length > 0 && (
                      <div>
                        <strong>Roles necessários:</strong>{' '}
                        {requiredRoles.join(', ')}
                      </div>
                    )}
                    {requiredModules.length > 0 && (
                      <div>
                        <strong>Módulos necessários:</strong>{' '}
                        {requiredModules.join(', ')}
                      </div>
                    )}
                    <div>
                      <strong>Seu role:</strong> {user?.role || 'Não definido'}
                    </div>
                    <div>
                      <strong>Seus módulos:</strong>{' '}
                      {user?.modulos_permitidos?.join(', ') || 'Nenhum'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => router.push(redirectTo)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir para Home
                  </Button>
                </div>

                <p className="text-xs text-red-600 mt-4">
                  Entre em contato com o administrador se precisar de acesso a
                  esta funcionalidade.
                </p>
              </div>
            </AlertDescription>
          </Alert>
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
      const hasExplicitPermissions =
        user.modulos_permitidos && user.modulos_permitidos.length < 23;
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
