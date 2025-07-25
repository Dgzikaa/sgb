'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface GestaoLayoutProps {
  children: React.ReactNode;
}

export default function GestaoLayout({ children }: GestaoLayoutProps) {
  const router = useRouter();
  const { isRole, user, loading } = usePermissions();
  const { setPageTitle } = usePageTitle();

  const isAdmin = isRole('admin');

  useEffect(() => {
    setPageTitle('Gestão');
    return () => setPageTitle('');
  }, [setPageTitle]);

  // Verificar permissão de admin
  useEffect(() => {
    // Só verificar após o carregamento estar completo
    if (!loading && !isAdmin) {
      router.push('/home');
    }
  }, [isAdmin, router, loading]);

  // Se não for admin, mostrar aviso
  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-700">
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
                    as permissões necessárias para acessar a área de Gestão.
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
      </div>
    );
  }

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando permissões...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">{children}</div>
      </div>
    </div>
  );
}
