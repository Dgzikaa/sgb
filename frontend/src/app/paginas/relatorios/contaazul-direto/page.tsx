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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-6">🎯 ContaAzul - Teste Direto</h1>
        
        <p className="text-gray-600 mb-8">
          Vamos testar <strong>diretamente</strong> o que funciona no ContaAzul.
          <br />
          <strong>Sem enrolação, sem diagnósticos complexos.</strong>
        </p>

        <button
          onClick={testarAgora}
          disabled={testando}
          className="bg-green-500 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-600 disabled:opacity-50 w-full mb-6"
        >
          {testando ? '🔄 Testando...' : '🚀 TESTAR AGORA!'}
        </button>

        {resultado && (
          <div className={`p-4 rounded-lg text-left ${
            resultado.funciona ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {resultado.funciona ? (
              <div>
                <h3 className="font-bold text-green-800 mb-2">✅ FUNCIONOU!</h3>
                <p className="text-green-700 mb-3">{resultado.metodo}</p>
                {resultado.dados && (
                  <div className="bg-white p-3 rounded border">
                    <strong>Dados obtidos:</strong>
                    <pre className="text-xs mt-2 overflow-auto max-h-32">
                      {typeof resultado.dados === 'string' ? resultado.dados : JSON.stringify(resultado.dados, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-red-800 mb-2">❌ Não funcionou ainda</h3>
                <p className="text-red-700 mb-3">{resultado.problema}</p>
                {resultado.status && (
                  <div className="text-sm text-gray-600">
                    <strong>Status das APIs:</strong>
                    {resultado.status.map((s: any, i: number) => (
                      <div key={i} className="mt-1">
                        {s.url}: {s.status} {s.acessivel ? '✅' : '❌'}
                      </div>
                    ))}
                  </div>
                )}
                {resultado.próximo && (
                  <div className="mt-3 p-2 bg-blue-100 rounded">
                    <strong>Próximo passo:</strong> {resultado.próximo}
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