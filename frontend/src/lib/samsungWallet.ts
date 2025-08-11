// Samsung Wallet SDK
// Documentação: https://developer.samsung.com/wallet

// Configurações do Samsung Wallet
const SAMSUNG_WALLET_CONFIG = {
  serviceId: process.env.SAMSUNG_WALLET_SERVICE_ID || 'ordinario-fidelidade',
  certificateId: process.env.SAMSUNG_WALLET_CERTIFICATE_ID,
  privateKey: process.env.SAMSUNG_WALLET_PRIVATE_KEY,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://wallet.samsungpay.com' 
    : 'https://stg-wallet.samsungpay.com' // Sandbox
}

// Interface para dados do cartão
interface CartaoFidelidade {
  membro: {
    id: string
    nome: string
    email: string
    plano: string
    proxima_cobranca?: string
  }
  saldo: number
  qr_code_url: string
}

// Gerar Samsung Wallet Pass
export async function generateSamsungWalletPass(cartaoData: CartaoFidelidade): Promise<string> {
  try {
    // Samsung Wallet Pass Object
    const samsungPass = {
      // Identificadores únicos
      formatVersion: 1,
      passTypeIdentifier: `pass.br.com.zykor.fidelidade.samsung.${cartaoData.membro.id}`,
      serialNumber: cartaoData.membro.id,
      teamIdentifier: SAMSUNG_WALLET_CONFIG.serviceId,
      
      // Informações organizacionais
      organizationName: 'Ordinário Bar e Música',
      description: 'Cartão de Fidelidade Digital',
      logoText: 'Ordinário',
      
      // Design visual (cores em RGB)
      backgroundColor: 'rgb(234, 88, 12)', // Laranja Ordinário
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(254, 215, 170)',
      
      // Tipo de cartão - Membership/Loyalty
      generic: {
        primaryFields: [{
          key: 'balance',
          label: 'SALDO DISPONÍVEL',
          value: `R$ ${cartaoData.saldo.toFixed(2)}`,
          textAlignment: 'PKTextAlignmentCenter'
        }],
        
        secondaryFields: [{
          key: 'member_name',
          label: 'MEMBRO',
          value: cartaoData.membro.nome,
          textAlignment: 'PKTextAlignmentLeft'
        }, {
          key: 'plan_type',
          label: 'PLANO',
          value: cartaoData.membro.plano.toUpperCase(),
          textAlignment: 'PKTextAlignmentLeft'
        }],
        
        auxiliaryFields: [{
          key: 'establishment',
          label: 'ESTABELECIMENTO',
          value: 'Ordinário Bar e Música',
          textAlignment: 'PKTextAlignmentLeft'
        }, {
          key: 'next_charge',
          label: 'PRÓXIMA COBRANÇA',
          value: cartaoData.membro.proxima_cobranca ? 
            new Date(cartaoData.membro.proxima_cobrança).toLocaleDateString('pt-BR') : 
            'N/A',
          textAlignment: 'PKTextAlignmentLeft'
        }],
        
        backFields: [{
          key: 'terms',
          label: 'TERMOS DE USO',
          value: 'Este cartão é válido apenas no Ordinário Bar e Música. Saldo não expira. Não é possível reembolso em dinheiro.'
        }, {
          key: 'contact',
          label: 'CONTATO',
          value: 'Instagram: @ordinariobar\nSite: www.ordinariobar.com'
        }]
      },
      
      // QR Code para uso no estabelecimento
      barcode: {
        message: cartaoData.qr_code_url,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `Cartão ${cartaoData.membro.nome}`
      },
      
      // Localização onde pode ser usado
      locations: [{
        latitude: -23.5505, // Coordenadas do Ordinário (substituir pelas reais)
        longitude: -46.6333,
        altitude: 0,
        relevantText: 'Ordinário Bar e Música próximo!'
      }],
      
      // Data de relevância (próxima cobrança)
      relevantDate: cartaoData.membro.proxima_cobranca,
      
      // URLs e links
      associatedStoreIdentifiers: [], // IDs de apps na Samsung Store
      
      // Configurações de tela de bloqueio
      suppressStripShine: false,
      
      // Informações para atualizações
      webServiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/wallet/samsung/`,
      authenticationToken: cartaoData.membro.id
    }

    // Por enquanto, Samsung Wallet ainda não tem integração direta
    // Retornar URL de fallback ou instruções
    const fallbackData = {
      success: true,
      type: 'samsung_wallet',
      pass_data: samsungPass,
      save_url: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${cartaoData.membro.qr_code_token}`,
      instructions: {
        title: 'Samsung Wallet',
        steps: [
          'Abra o Samsung Internet',
          'Acesse este cartão',
          'Toque no menu (⋮)',
          'Selecione "Adicionar à tela inicial"',
          'Confirme a instalação'
        ]
      }
    }

    return JSON.stringify(fallbackData)

  } catch (error) {
    console.error('Erro ao gerar Samsung Wallet pass:', error)
    throw new Error(`Falha ao gerar Samsung Wallet pass: ${error}`)
  }
}

// Atualizar cartão existente no Samsung Wallet
export async function updateSamsungWalletPass(membroId: string, novoSaldo: number): Promise<boolean> {
  try {
    // Samsung Wallet não suporta atualizações push como Apple/Google
    // Cartão será atualizado quando o usuário abrir o app
    console.log(`Samsung Wallet: Saldo do membro ${membroId} será atualizado para R$ ${novoSaldo.toFixed(2)} na próxima sincronização`)
    
    return true
  } catch (error) {
    console.error('Erro ao atualizar Samsung Wallet:', error)
    return false
  }
}

// Verificar se Samsung Wallet está disponível
export function isSamsungWalletAvailable(): boolean {
  // Verificar se estamos em um dispositivo Samsung
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || ''
    return /samsung/i.test(userAgent)
  }
  return false
}

// Gerar link para Samsung Internet (melhor experiência)
export function generateSamsungOptimizedUrl(cartaoUrl: string): string {
  // Samsung Internet tem melhor suporte para PWAs
  const samsungUrl = `intent://${cartaoUrl.replace('https://', '')}#Intent;scheme=https;package=com.sec.android.app.sbrowser;end`
  return samsungUrl
}

// Detectar capacidades do Samsung Wallet
export async function detectSamsungCapabilities(): Promise<{
  hasSamsungPay: boolean
  hasSamsungWallet: boolean
  hasSamsungInternet: boolean
  recommendedAction: string
}> {
  const capabilities = {
    hasSamsungPay: false,
    hasSamsungWallet: false,
    hasSamsungInternet: false,
    recommendedAction: 'fallback'
  }

  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || ''
    
    // Detectar Samsung Internet
    capabilities.hasSamsungInternet = /SamsungBrowser/i.test(userAgent)
    
    // Detectar dispositivo Samsung
    const isSamsung = /samsung/i.test(userAgent)
    
    if (isSamsung) {
      capabilities.hasSamsungWallet = true
      capabilities.recommendedAction = capabilities.hasSamsungInternet 
        ? 'samsung_internet_install' 
        : 'samsung_wallet_fallback'
    }
  }

  return capabilities
}
