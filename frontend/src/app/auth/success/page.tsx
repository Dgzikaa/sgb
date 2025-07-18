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

﻿'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [tokenData, setTokenData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setStatus('error')
      setError('CÃ¡Â³digo de autorizaÃ¡Â§Ã¡Â£o nÃ¡Â£o encontrado')
      return
    }

    console.log('Ã°Å¸â€â€ž Trocando cÃ¡Â³digo por token...')
    
    // Trocar cÃ¡Â³digo por token
    exchangeCodeForToken(code)
  }, [searchParams])

  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'exchange',
          code: code
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter token')
      }

      console.log('Å“â€¦ Token obtido com sucesso!')
      
      // Salvar token no localStorage para uso posterior
      const tokenInfo = {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_in: data.data.expires_in,
        token_type: data.data.token_type,
        created_at: Date.now()
      }

      localStorage.setItem('google_oauth_token', JSON.stringify(tokenInfo))
      
      setTokenData(tokenInfo)
      setStatus('success')

      // Testar acesso Ã¡Â s contas do My Business
      testMyBusinessAccess(tokenInfo.access_token)

    } catch (error) {
      console.error('ÂÅ’ Erro ao trocar cÃ¡Â³digo por token:', error)
      setStatus('error')
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  const testMyBusinessAccess = async (accessToken: string) => {
    try {
      console.log('Ã°Å¸â€Â Testando acesso ao My Business...')
      
      const response = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const accountsData = await response.json()
        console.log('Å“â€¦ Acesso ao My Business confirmado!')
        console.log('Ã°Å¸â€œâ€¹ Contas encontradas:', accountsData.accounts?.length || 0)
        
        // Adicionar informaÃ¡Â§Ã¡Âµes das contas ao token
        const existingToken = JSON.parse(localStorage.getItem('google_oauth_token') as unknown || '{}')
        existingToken.my_business_accounts = accountsData.accounts || []
        localStorage.setItem('google_oauth_token', JSON.stringify(existingToken))
        
        setTokenData(existingToken)
      } else {
        console.warn('Å¡Â Ã¯Â¸Â Acesso limitado ao My Business')
      }
    } catch (error) {
      console.warn('Å¡Â Ã¯Â¸Â Erro ao testar My Business:', error)
    }
  }

  const copyTokenToClipboard = () => {
    if (tokenData) {
      navigator.clipboard.writeText(JSON.stringify(tokenData, null, 2))
      alert('Token copiado para Ã¡Â¡rea de transferÃ¡Âªncia!')
    }
  }

  const runSyncTest = async () => {
    try {
      console.log('Ã°Å¸â€â€ž Testando sincronizaÃ¡Â§Ã¡Â£o...')
      
      const response = await fetch('/api/sync-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          access_token: tokenData.access_token
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Å“â€¦ Teste de sincronizaÃ¡Â§Ã¡Â£o bem-sucedido!\n${result.message}`)
      } else {
        alert(`ÂÅ’ Erro no teste: ${result.error}`)
      }
    } catch (error) {
      alert('ÂÅ’ Erro ao testar sincronizaÃ¡Â§Ã¡Â£o')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Processando autorizaÃ¡Â§Ã¡Â£o...</h2>
          <p className="text-gray-600">Obtendo token de acesso do Google</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">ÂÅ’</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro na AutorizaÃ¡Â§Ã¡Â£o</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-green-500 text-4xl mb-4">Å“â€¦</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">AutorizaÃ¡Â§Ã¡Â£o Google ConcluÃ¡Â­da!</h1>
            <p className="text-gray-600">Token OAuth obtido com sucesso para acessar Google My Business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* InformaÃ¡Â§Ã¡Âµes do Token */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ã°Å¸â€œâ€¹ InformaÃ¡Â§Ã¡Âµes do Token</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Tipo:</span>
                  <span className="ml-2 text-gray-800">{tokenData?.token_type || 'Bearer'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Expira em:</span>
                  <span className="ml-2 text-gray-800">{tokenData?.expires_in || 0} segundos</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Refresh Token:</span>
                  <span className="ml-2 text-gray-800">{tokenData?.refresh_token ? 'Å“â€¦ Sim' : 'ÂÅ’ NÃ¡Â£o'}</span>
                </div>
                {tokenData?.my_business_accounts && (
                  <div>
                    <span className="font-medium text-gray-600">Contas My Business:</span>
                    <span className="ml-2 text-gray-800">{tokenData.my_business_accounts.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PrÃ¡Â³ximos Passos */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Ã°Å¸Å½Â¯ PrÃ¡Â³ximos Passos</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">Å“â€¦</span>
                  <span className="text-sm text-green-700">OAuth configurado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">Å“â€¦</span>
                  <span className="text-sm text-green-700">Token salvo localmente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">Ã°Å¸â€â€ž</span>
                  <span className="text-sm text-gray-700">Pronto para sincronizar avaliaÃ¡Â§Ã¡Âµes</span>
                </div>
              </div>
            </div>
          </div>

          {/* AÃ¡Â§Ã¡Âµes */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={copyTokenToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ã°Å¸â€œâ€¹ Copiar Token
            </button>
            
            <button
              onClick={runSyncTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ã°Å¸â€â€ž Testar SincronizaÃ¡Â§Ã¡Â£o
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ã°Å¸ÂÂ  Voltar ao Dashboard
            </button>
          </div>

          {/* Token Details (Expandible) */}
          <div className="mt-8">
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Ã°Å¸â€Â§ Detalhes TÃ¡Â©cnicos do Token (Clique para expandir)
              </summary>
              <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
                {JSON.stringify(tokenData, null, 2)}
              </pre>
            </details>
          </div>

          {/* InstruÃ¡Â§Ã¡Âµes */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Ã°Å¸â€œÅ¡ Como usar</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>1.</strong> O token foi salvo automaticamente no navegador</p>
              <p><strong>2.</strong> O script de sincronizaÃ¡Â§Ã¡Â£o agora pode acessar as avaliaÃ¡Â§Ã¡Âµes completas</p>
              <p><strong>3.</strong> Execute: <code className="bg-blue-100 px-2 py-1 rounded">node scripts/sync_google_my_business.js</code></p>
              <p><strong>4.</strong> Configure um cron job para sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 

