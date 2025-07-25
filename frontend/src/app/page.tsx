'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para /login
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg animate-pulse">
          <span className="text-2xl text-white">🏪</span>
        </div>
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  );
}
