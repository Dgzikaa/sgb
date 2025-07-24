'use client'

import { useState, useEffect } from 'react'

interface ContaHubStatus {
  contahub_disponivel: boolean;
  contahub_status?: {
    disponivel: boolean;
    motivo?: string;
    detalhes?: {
      email_configurado: boolean;
      senha_configurada: boolean;
    };
  };
}

interface ContaHubStatusBannerProps {
  className?: string;
  showRefreshButton?: boolean;
}

export default function ContaHubStatusBanner({ 
  className = "mb-6", 
  showRefreshButton = true 
}: ContaHubStatusBannerProps) {
  const [contahubStatus, setContahubStatus] = useState<ContaHubStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const verificarStatusContaHub = async () => {
    try {
      setStatusLoading(true)
      const response = await fetch('/api/contahub/teste-5-dias')
      const data = await response.json()
      setContahubStatus(data)
    } catch (error) {
      console.error('Erro ao verificar status do ContaHub:', error)
      setContahubStatus({
        contahub_disponivel: false,
        contahub_status: {
          disponivel: false,
          motivo: 'Erro ao verificar status'
        }
      })
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    verificarStatusContaHub()
  }, [])

  return (
    <div className={className}>
      {statusLoading ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Verificando status do ContaHub...</span>
          </div>
        </div>
      ) : contahubStatus?.contahub_disponivel === false ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-500 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">ContaHub em Modo Manutenção</h3>
              <p className="text-yellow-700 text-sm mb-2">
                {contahubStatus?.contahub_status?.motivo || 'Integração temporariamente indisponível'}
              </p>
              <div className="text-xs text-yellow-600 space-y-1 mb-3">
                <div>Email configurado: {contahubStatus?.contahub_status?.detalhes?.email_configurado ? '✅' : '❌'}</div>
                <div>Senha configurada: {contahubStatus?.contahub_status?.detalhes?.senha_configurada ? '✅' : '❌'}</div>
              </div>
              {showRefreshButton && (
                <button
                  onClick={verificarStatusContaHub}
                  disabled={statusLoading}
                  className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
                >
                  {statusLoading ? '🔄 Verificando...' : '🔄 Verificar Novamente'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-xl">✅</span>
            <span className="text-green-800 font-medium">ContaHub Operacional</span>
            <span className="text-green-600 text-sm">- Todos os sistemas funcionando</span>
          </div>
        </div>
      )}
    </div>
  )
} 
