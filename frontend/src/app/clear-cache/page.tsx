'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const router = useRouter();

  useEffect(() => {
    // Limpar todos os dados do localStorage e sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirecionar para login após 1 segundo
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="card-dark p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="card-title-dark mb-2">Limpando Cache</h1>
        <p className="card-description-dark">
          Limpando dados em cache... Você será redirecionado para o login.
        </p>
      </div>
    </div>
  );
}