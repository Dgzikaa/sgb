'use client';

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
    <div className="p-8 max-w-2xl mx-auto">
      {!conectado ? (
        <div className="text-center">
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">
              🔌 Conectar ao ContaAzul
            </h2>
            <p className="text-gray-600 mb-6">
              Clique para conectar e puxar seus dados financeiros
            </p>
            
            <button
              onClick={conectarContaAzul}
              disabled={loading}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '🔄 Conectando...' : '🚀 Conectar ContaAzul'}
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">❌ {erro}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              ✅ Conectado com Sucesso!
            </h2>
            <p className="text-green-600">
              Dados financeiros obtidos do ContaAzul
            </p>
          </div>

          {dados && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">📊 Seus Dados:</h3>
              <div className="text-left">
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
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
            className="mt-4 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            🔄 Reconectar
          </button>
        </div>
      )}
    </div>
  );
} 
