'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { DarkSidebarLayout } from '@/components/layouts/DarkSidebarLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface EstrategicoLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para área Estratégica - requer role admin
 * 
 * Este layout tem lógica específica de permissões que não pode ser simplificada
 * para o padrão genérico, pois precisa mostrar mensagem de acesso restrito.
 */
export default function EstrategicoLayout({ children }: EstrategicoLayoutProps) {
  const router = useRouter();
  const { isRole, loading } = usePermissions();
  const { setPageTitle } = usePageTitle();

  const isAdmin = isRole('admin');

  useEffect(() => {
    setPageTitle('Estratégico');
    return () => setPageTitle('');
  }, [setPageTitle]);

  // Redirecionar se não for admin (após carregamento)
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/home');
    }
  }, [isAdmin, router, loading]);

  // Loading state
  if (loading) {
    return (
      <DarkSidebarLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Carregando permissões...
            </p>
          </div>
        </div>
      </DarkSidebarLayout>
    );
  }

  // Acesso negado
  if (!isAdmin) {
    return (
      <DarkSidebarLayout>
        <div className="p-6">
          <Card className="card-dark border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <Alert className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">Acesso Restrito</span>
                  </div>
                  <p>
                    Esta seção é exclusiva para administradores. Você não possui
                    as permissões necessárias para acessar a área Estratégica.
                  </p>
                  <p className="mt-2 text-sm">
                    Entre em contato com o administrador do sistema se você
                    acredita que deveria ter acesso a esta área.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DarkSidebarLayout>
    );
  }

  // Layout normal
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
}
