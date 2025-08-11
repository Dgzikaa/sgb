'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode as QRCodeIcon, 
  Smartphone, 
  Download, 
  Share2, 
  Plus,
  Apple,
  Wallet,
  Home,
  Chrome
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'

interface CartaoData {
  membro: {
    id: string
    nome: string
    email: string
    plano: string
    valor_mensalidade?: number
    credito_mensal?: number
    proxima_cobranca?: string
  }
  saldo: number
  qr_code_url: string
  checkins?: Array<{
    data_checkin: string
    tipo_checkin: string
  }>
}

interface DeviceInfo {
  isIOS: boolean
  isAndroid: boolean
  isSamsung: boolean
  isMobile: boolean
  isStandalone: boolean
}

export default function CartaoDigital() {
  const params = useParams()
  const [cartao, setCartao] = useState<CartaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  
  // Verificar autenticação obrigatória
  const { customer, loading: authLoading, isAuthenticated } = useCustomerAuth(true)

  // Detectar dispositivo
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /ipad|iphone|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isSamsung = /samsung/.test(userAgent) || /sm-/.test(userAgent)
    const isMobile = /mobile|android|iphone|ipad|phone|tablet/.test(userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    setDevice({
      isIOS,
      isAndroid,
      isSamsung,
      isMobile,
      isStandalone
    })
  }, [])

  useEffect(() => {
    async function fetchCartao() {
      // Só carregar dados se autenticado
      if (!isAuthenticated || authLoading) {
        return
      }

      try {
        const sessionToken = localStorage.getItem('customer_session_token')
        const response = await fetch(`/api/fidelidade/cartao-por-token/${params.token}`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Cartão não encontrado')
        }
        const data = await response.json()
        setCartao(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar cartão')
      } finally {
        setLoading(false)
      }
    }

    if (params.token && isAuthenticated && !authLoading) {
      fetchCartao()
    }
  }, [params.token, isAuthenticated, authLoading])

  const adicionarWallet = async (tipo: 'apple' | 'google' | 'samsung') => {
    if (!cartao) return
    
    switch (tipo) {
      case 'apple':
        if (device?.isIOS) {
          try {
            // Primeiro verificar se a API está funcionando
            const response = await fetch(`/api/fidelidade/wallet/apple/${params.token}`, {
              method: 'HEAD' // Só verificar headers
            })
            
            if (response.ok && response.headers.get('content-type')?.includes('vnd.apple.pkpass')) {
              // Se OK, navegar para download
              window.location.href = `/api/fidelidade/wallet/apple/${params.token}`
            } else {
              // Se erro, mostrar fallback amigável
              alert('📱 Apple Wallet temporariamente indisponível.\n\n💡 Alternativa: Salve esta página nos favoritos do Safari para acesso rápido ao seu cartão!')
            }
          } catch (error) {
            // Erro de rede ou outro
            alert('📱 Não foi possível conectar ao Apple Wallet no momento.\n\n💡 Salve esta página nos favoritos para usar o QR Code diretamente!')
          }
        } else {
          alert('📱 Apple Wallet está disponível apenas no iPhone/iPad.\n\nAcesse este link no seu iPhone para adicionar à wallet.')
        }
        break
        
      case 'google':
        try {
          const response = await fetch(`/api/fidelidade/wallet/google/${params.token}`)
          const data = await response.json()
          
          if (device?.isAndroid) {
            alert(`📱 ${data.instructions?.title || 'Google Pay'}\n\n${data.instructions?.message || 'Instruções'}\n\nPor enquanto:\nSalve esta página nos favoritos.`)
          } else {
            alert('📱 Google Pay está disponível apenas no Android.\n\nAcesse este link no seu celular Android.')
          }
        } catch (error) {
          alert('📱 Erro ao acessar Google Pay. Salve esta página nos favoritos.')
        }
        break
        
      case 'samsung':
        try {
          const response = await fetch(`/api/fidelidade/wallet/samsung/${params.token}`)
          const data = await response.json()
          
          if (device?.isSamsung) {
            alert(`📱 ${data.instructions?.title || 'Samsung Wallet'}\n\n${data.instructions?.message || 'Instruções'}\n\nPor enquanto:\nSalve esta página nos favoritos.`)
          } else {
            alert('📱 Samsung Wallet está disponível apenas em dispositivos Samsung.')
          }
        } catch (error) {
          alert('📱 Erro ao acessar Samsung Wallet. Salve esta página nos favoritos.')
        }
        break
    }
  }

  const compartilharCartao = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Cartão de Fidelidade - Ordinário Bar',
          text: `Confira meu cartão de fidelidade do Ordinário Bar e Música!`,
          url: window.location.href
        })
      } catch (error) {
        // Fallback para cópia do link
        copiarLink()
      }
    } else {
      copiarLink()
    }
  }

  const copiarLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      alert('🔗 Link copiado para a área de transferência!')
    } else {
      alert('📋 Copie este link: ' + window.location.href)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-amber-900/20 to-orange-900/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-amber-200">
            {authLoading ? 'Verificando autenticação...' : 'Carregando seu cartão...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !cartao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-amber-900/20 to-orange-900/30 flex items-center justify-center">
        <div className="text-center">
          <QRCodeIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Cartão não encontrado</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-amber-900/20 to-orange-900/30 relative overflow-hidden">
      {/* Background Effects - igual a landing */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-red-500/20 to-amber-500/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
        
        {/* Cabeçalho Ultra Moderno */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-black/50 backdrop-blur-md border border-amber-400/30 rounded-full p-6">
              <Image
                src="/logos/ordinario-transparente.png"
                alt="Ordinário Bar e Música"
                width={80}
                height={80}
                className="drop-shadow-xl"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text text-transparent mb-2">
            Ordinário Bar e Música
          </h1>
          <p className="text-amber-200/80 text-sm font-medium">
            Cartão de Fidelidade VIP
          </p>
        </div>

        {/* Cartão Principal Ultra Moderno */}
        <div className="relative mb-8">
          {/* Glass Card Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-red-600/20 rounded-3xl blur-xl"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8">
              {/* Header do Cartão */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{cartao.membro?.nome || 'Membro'}</h2>
                  <p className="text-amber-200/80 text-sm mb-3">{cartao.membro?.email || ''}</p>
                  <div className="inline-flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 bg-black/20 rounded-full mr-2 animate-pulse"></span>
                    {cartao.membro?.plano?.toUpperCase() || 'PLANO'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    R$ {cartao.saldo?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-amber-200/60 text-xs font-medium">Saldo disponível</div>
                </div>
              </div>

              {/* QR Code Moderno */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-sm opacity-30"></div>
                <div className="relative bg-white rounded-2xl p-6 flex justify-center">
                  <QRCodeSVG
                    value={cartao.qr_code_url}
                    size={180}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="text-center mt-6">
                <p className="text-amber-200 text-sm font-medium">
                  ✨ Escaneie este código no estabelecimento ✨
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões Ultra Modernos */}
        <div className="space-y-4">
          {/* Botão Oficial Apple Wallet */}
          {device?.isIOS && (
            <div className="flex justify-center">
              <a
                href={`/api/fidelidade/wallet/apple/${params.token}`}
                className="inline-block"
                style={{ lineHeight: 0 }}
              >
                <img
                  src="/apple-wallet-badge.svg"
                  alt="Adicionar à Apple Wallet"
                  style={{
                    height: '50px',
                    width: 'auto',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}
                />
              </a>
            </div>
          )}

          {/* Botão Oficial Google Pay */}
          {device?.isAndroid && !device?.isSamsung && (
            <div className="flex justify-center">
              <a
                href={`/api/fidelidade/wallet/google/${params.token}`}
                className="inline-block"
                style={{ lineHeight: 0 }}
              >
                <img
                  src="https://developers.google.com/static/pay/images/wallet/gw_add_to_wallet_@2x.png"
                  alt="Adicionar ao Google Pay"
                  style={{
                    height: '60px',
                    width: 'auto',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}
                />
              </a>
            </div>
          )}

          {device?.isSamsung && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <Button
                onClick={() => adicionarWallet('samsung')}
                className="w-full relative bg-blue-600/60 backdrop-blur-md border border-blue-400/30 hover:border-blue-400/60 text-white py-5 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center">
                  <Wallet className="w-6 h-6 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="text-lg">Samsung Wallet</span>
                    <span className="text-xs text-white/60">Para dispositivos Samsung</span>
                  </div>
                  <div className="ml-auto">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          )}



          {/* Compartilhar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Button
              onClick={compartilharCartao}
              className="w-full relative bg-purple-500/20 backdrop-blur-md border border-purple-400/30 hover:border-purple-400/60 text-purple-200 hover:text-white py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar Cartão
            </Button>
          </div>
        </div>



      </div>
    </div>
  )
}