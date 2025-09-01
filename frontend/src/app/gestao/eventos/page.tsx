'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GestaoEventosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect para a nova estrutura - eventos agora estão em ferramentas/calendario
    router.replace('/ferramentas/calendario');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecionando para Calendário de Eventos...
        </p>
      </div>
    </div>
  );
}
