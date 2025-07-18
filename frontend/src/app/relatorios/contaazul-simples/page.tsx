import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client';

import React, { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';

export default function ContaAzulSimplesPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setPageTitle('💰 ContaAzul - Dados Financeiros');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const conectarContaAzul = async () => {
    setLoading(true);
    setErro('');
    
    try {
      // Tentar a nova API do ContaAzul diretamente
      const response = await fetch('/api/contaazul-simples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConectado(true);
        setDados(result.dados);
      } else {
        setErro(result.error || 'Falha na conexão');
      }
    } catch (error) {
      setErro('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
      {!conectado ? (
        <div className="text-center">
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-700">
            <h2 className="text-xl font-semibold mb-4 card-title-dark">
              🔗 Conectar ao ContaAzul
            </h2>
            <p className="card-description-dark mb-6">
              Clique para conectar e puxar seus dados financeiros
            </p>
            
            <button
              onClick={conectarContaAzul}
              disabled={loading}
              className="bg-blue-500 dark:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '🔄 Conectando...' : '💸 Conectar ContaAzul'}
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 p-4 rounded">
              <p className="text-red-700 dark:text-red-300">❌ {erro}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg mb-6 border border-green-200 dark:border-green-700">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
              ✅ Conectado com Sucesso!
            </h2>
            <p className="text-green-600 dark:text-green-300">
              Dados financeiros obtidos do ContaAzul
            </p>
          </div>

          {dados && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 card-title-dark">📊 Seus Dados:</h3>
              <div className="text-left">
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto card-description-dark">
                  {JSON.stringify(dados, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setConectado(false);
              setDados(null);
              setErro('');
            }}
            className="mt-4 bg-gray-500 dark:bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            🔄 Reconectar
          </button>
        </div>
      )}
    </div>
  );
} 

