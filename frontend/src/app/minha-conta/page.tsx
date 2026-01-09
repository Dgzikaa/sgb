'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de redirecionamento para /usuarios/minha-conta
 * Esta página existe para garantir compatibilidade com links legados
 */
export default function MinhaContaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/usuarios/minha-conta');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecionando...</p>
      </div>
    </div>
  );
}
