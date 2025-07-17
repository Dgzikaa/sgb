'use client';

import React, { useState } from 'react';

export default function ContaAzulDiretoPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [testando, setTestando] = useState(false);

  const testarAgora = async () => {
    setTestando(true);
    setResultado(null);

    try {
      const response = await fetch('/api/contaazul-direto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teste: 'agora' })
      });

      const data = await response.json();
      setResultado(data);
    } catch (error) {
      setResultado({ erro: 'Falha na conexão' });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg w-full text-center border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 card-title-dark">🔵 ContaAzul - Teste Direto</h1>
        
        <p className="card-description-dark mb-8">
          Vamos testar <strong>diretamente</strong> o que funciona no ContaAzul.
          <br />
          <strong>Sem enrolação, sem diagnósticos complexos.</strong>
        </p>

        <button
          onClick={testarAgora}
          disabled={testando}
          className="bg-green-500 dark:bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 w-full mb-6 transition-colors"
        >
          {testando ? '⏳ Testando...' : '🚀 TESTAR AGORA!'}
        </button>

        {resultado && (
          <div className={`p-4 rounded-lg text-left ${
            resultado.funciona 
              ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
          }`}>
            {resultado.funciona ? (
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">✅ FUNCIONOU!</h3>
                <p className="text-green-700 dark:text-green-300 mb-3">{resultado.metodo}</p>
                {resultado.dados && (
                  <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <strong className="card-title-dark">Dados obtidos:</strong>
                    <pre className="text-xs mt-2 overflow-auto max-h-32 card-description-dark">
                      {typeof resultado.dados === 'string' ? resultado.dados : JSON.stringify(resultado.dados, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">❌ Não funcionou ainda</h3>
                <p className="text-red-700 dark:text-red-300 mb-3">{resultado.problema}</p>
                {resultado.status && (
                  <div className="text-sm card-description-dark">
                    <strong>Status das APIs:</strong>
                    {(resultado.status as Array<{url: string, status: string, acessivel: boolean}>).map((s, i: number) => (
                      <div key={i} className="mt-1">
                        {s.url}: {s.status} {s.acessivel ? '✅' : '❌'}
                      </div>
                    ))}
                  </div>
                )}
                {resultado.próximo && (
                  <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                    <strong className="text-blue-800 dark:text-blue-200">Próximo passo:</strong> 
                    <span className="text-blue-700 dark:text-blue-300"> {resultado.próximo}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 

