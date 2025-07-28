'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [tokenData, setTokenData] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();

  const exchangeCodeForToken = useCallback(async (code: string) => {
    try {
      setStatus('loading');
      setError('');

      const response = await fetch('/api/auth/exchange-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setTokenData(data.token);
        
        // Testar acesso ao My Business
        if (data.token) {
          await testMyBusinessAccess(data.token);
        }
      } else {
        setStatus('error');
        setError(data.error || 'Erro ao trocar código por token');
      }
    } catch (error) {
      console.error('Erro ao trocar código por token:', error);
      setStatus('error');
      setError('Erro ao conectar com o servidor');
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      console.error('❌ Código de autorização não encontrado');
      setError('Código de autorização não encontrado');
      return;
    }
    console.log('🔄 Trocando código por token...');
    exchangeCodeForToken(code);
  }, [searchParams, exchangeCodeForToken]);

  const testMyBusinessAccess = async (accessToken: string) => {
    try {
      console.log('🔍 Testando acesso ao My Business...');

      const response = await fetch(
        'https://mybusiness.googleapis.com/v4/accounts',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const accountsData = await response.json();
        console.log('✅ Acesso ao My Business confirmado!');
        console.log(
          '📋 Contas encontradas:',
          accountsData.accounts?.length || 0
        );

        // Adicionar informações das contas ao token
        const existingToken = JSON.parse(
          localStorage.getItem('google_oauth_token') || '{}'
        );
        existingToken.my_business_accounts = accountsData.accounts || [];
        localStorage.setItem(
          'google_oauth_token',
          JSON.stringify(existingToken)
        );

        setTokenData(existingToken);
      } else {
        console.warn('⚠️ Acesso limitado ao My Business');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao testar My Business:', error);
    }
  };

  const copyTokenToClipboard = () => {
    if (tokenData) {
      navigator.clipboard.writeText(JSON.stringify(tokenData, null, 2));
      alert('Token copiado para área de transferência!');
    }
  };

  const runSyncTest = async () => {
    try {
      console.log('🔄 Testando sincronização...');

      const response = await fetch('/api/sync-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          access_token: (tokenData as any).access_token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Teste de sincronização bem-sucedido!\n${result.message}`);
      } else {
        alert(`❌ Erro no teste: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Erro ao testar sincronização');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Processando autorização...
          </h2>
          <p className="text-gray-600">Obtendo token de acesso do Google</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Erro na Autorização
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Autorização Google Concluída!
            </h1>
            <p className="text-gray-600">
              Token OAuth obtido com sucesso para acessar Google My Business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Token */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Informações do Token
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Tipo:</span>
                  <span className="ml-2 text-gray-800">
                    {(tokenData as any)?.token_type || 'Bearer'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Expira em:</span>
                  <span className="ml-2 text-gray-800">
                    {(tokenData as any)?.expires_in || 0} segundos
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Refresh Token:
                  </span>
                  <span className="ml-2 text-gray-800">
                    {(tokenData as any)?.refresh_token ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                {(tokenData as any)?.my_business_accounts && (
                  <div>
                    <span className="font-medium text-gray-600">
                      Contas My Business:
                    </span>
                    <span className="ml-2 text-gray-800">
                      {(tokenData as any).my_business_accounts.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                🎯 Próximos Passos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-green-700">
                    OAuth configurado
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-green-700">
                    Token salvo localmente
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">🔄</span>
                  <span className="text-sm text-gray-700">
                    Pronto para sincronizar avaliações
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={copyTokenToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              📋 Copiar Token
            </button>

            <button
              onClick={runSyncTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Testar Sincronização
            </button>

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🏠 Voltar ao Dashboard
            </button>
          </div>

          {/* Token Details (Expandible) */}
          <div className="mt-8">
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                🔧 Detalhes Técnicos do Token (Clique para expandir)
              </summary>
              <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
                {JSON.stringify(tokenData, null, 2)}
              </pre>
            </details>
          </div>

          {/* Instruções */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📚 Como usar
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>1.</strong> O token foi salvo automaticamente no
                navegador
              </p>
              <p>
                <strong>2.</strong> O script de sincronização agora pode acessar
                as avaliações completas
              </p>
              <p>
                <strong>3.</strong> Execute:{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  node scripts/sync_google_my_business.js
                </code>
              </p>
              <p>
                <strong>4.</strong> Configure um cron job para sincronização
                automática
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
