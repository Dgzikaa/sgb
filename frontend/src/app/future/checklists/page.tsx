'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Construction, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function FuncionarioChecklistsPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se está no cliente antes de usar router
    if (typeof window !== 'undefined') {
      // Lógica de verificação de permissões aqui se necessário
    }
  }, [router]);

  return (
    <ProtectedRoute requiredModule="operacoes">
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-center p-4">
          <div className="max-w-md w-full card-dark rounded-lg shadow-lg p-8 text-center transition-colors duration-300">
            {/* Ícone Principal */}
            <div className="flex justify-center mb-6">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full transition-colors duration-300">
                <Construction className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
              Checklists do Funcionário
            </h1>

            {/* Descrição */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed transition-colors duration-300">
              Acesse e preencha os checklists atribuídos ao seu perfil de funcionário.
            </p>

            {/* Badge de Prioridade */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-300 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Alta Prioridade
              </span>
            </div>

            {/* Previsão */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 transition-colors duration-300">
              <div className="flex items-center justify-center text-blue-800 dark:text-blue-200">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Previsão: 1 semana</span>
              </div>
            </div>

            {/* Botão Voltar */}
            <button
              onClick={() => router.push('/home')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </button>

            {/* Rodapé */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                SGB V2 • Sistema em Desenvolvimento
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 