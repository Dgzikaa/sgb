import { JWT } from 'google-auth-library'

// Função para obter configurações do Google Wallet
function getGoogleWalletConfig() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada')
  }

  let serviceAccount
  try {
    const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    serviceAccount = JSON.parse(decoded)
  } catch (error) {
    throw new Error('Erro ao decodificar GOOGLE_SERVICE_ACCOUNT_KEY')
  }

  return {
    serviceAccountEmail: serviceAccount.client_email,
    serviceAccountPrivateKey: serviceAccount.private_key,
    applicationName: 'Ordinario-Fidelidade',
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID!,
    classId: 'ordinario_loyalty_class'
  }
}

// Função para criar cliente JWT
function createJwtClient() {
  const config = getGoogleWalletConfig()
  
  return new JWT({
    email: config.serviceAccountEmail,
    key: config.serviceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
  })
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

// Criar classe de loyalty card (executar uma vez)
export async function createLoyaltyClass() {
  try {
    const config = getGoogleWalletConfig()
    const jwtClient = createJwtClient()
    await jwtClient.authorize()

    const loyaltyClass = {
      id: `${config.issuerId}.${config.classId}`,
      issuerName: 'Ordinário Bar e Música',
      programName: 'Clube VIP Ordinário',
      programLogo: {
        sourceUri: {
          uri: `${process.env.NEXT_PUBLIC_APP_URL}/logos/ordinario-transparente.png`
        },
        contentDescription: {
          defaultValue: {
            language: 'pt-BR',
            value: 'Logo Ordinário Bar'
          }
        }
      },
      
      // Design visual
      hexBackgroundColor: '#ea580c', // Laranja Ordinário
      heroImage: {
        sourceUri: {
          uri: `${process.env.NEXT_PUBLIC_APP_URL}/logos/ordinario-banner-1.jpg`
        },
        contentDescription: {
          defaultValue: {
            language: 'pt-BR',
            value: 'Ordinário Bar Ambiente'
          }
        }
      },
      
      // Informações de contato
      issuerContactInfo: {
        name: 'Ordinário Bar e Música',
        phone: '+55 11 99999-9999', // Substituir pelo telefone real
        email: 'contato@ordinariobar.com'
      },
      
      // URLs importantes
      homepageUri: {
        uri: 'https://www.ordinariobar.com',
        description: 'Site Oficial'
      },
      
      // Configurações de segurança
      securityAnimation: {
        animationType: 'FOIL_SHIMMER'
      },
      
      // Localizações onde o cartão pode ser usado
      locations: [{
        latitude: -23.5505, // Coordenadas aproximadas (substituir pelas reais)
        longitude: -46.6333,
        radius: 100 // 100 metros de raio
      }],
      
      // Review status
      reviewStatus: 'UNDER_REVIEW',
      
      // Configurações de notificação
      allowMultipleUsersPerObject: false
    }

    // Fazer requisição para criar a classe
    const response = await fetch('https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtClient.credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loyaltyClass)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro ao criar classe: ${error}`)
    }

    const result = await response.json()
    console.log('Classe Google Wallet criada:', result.id)
    return result

  } catch (error) {
    console.error('Erro ao criar classe Google Wallet:', error)
    throw error
  }
}

// Gerar cartão individual para um membro
export async function generateGoogleWalletPass(cartaoData: CartaoFidelidade): Promise<string> {
  try {
    const config = getGoogleWalletConfig()
    const jwtClient = createJwtClient()
    await jwtClient.authorize()

    const loyaltyObject = {
      id: `${config.issuerId}.${cartaoData.membro.id}`,
      classId: `${config.issuerId}.${config.classId}`,
      
      // Dados do membro
      accountName: cartaoData.membro.nome,
      accountId: cartaoData.membro.id,
      
      // Informações na frente do cartão
      loyaltyPoints: {
        balance: {
          string: `R$ ${cartaoData.saldo.toFixed(2)}`
        },
        label: 'Saldo Disponível'
      },
      
      // QR Code para uso no estabelecimento
      barcode: {
        type: 'QR_CODE',
        value: cartaoData.qr_code_url,
        alternateText: cartaoData.membro.nome
      },
      
      // Informações adicionais
      textModulesData: [{
        header: 'Plano',
        body: cartaoData.membro.plano.toUpperCase(),
        id: 'plano'
      }, {
        header: 'Próxima Cobrança',
        body: cartaoData.membro.proxima_cobranca ? 
          new Date(cartaoData.membro.proxima_cobrança).toLocaleDateString('pt-BR') : 
          'N/A',
        id: 'cobranca'
      }],
      
      // Links úteis
      linksModuleData: {
        uris: [{
          uri: `${process.env.NEXT_PUBLIC_APP_URL}/fidelidade`,
          description: 'Ver no Site'
        }, {
          uri: 'https://www.ordinariobar.com',
          description: 'Ordinário Bar'
        }, {
          uri: 'https://www.instagram.com/ordinariobar/',
          description: 'Instagram'
        }]
      },
      
      // Estado do cartão
      state: 'ACTIVE',
      
      // Data de validade (opcional)
      validTimeInterval: {
        start: {
          date: new Date().toISOString()
        }
        // Sem data de fim = válido indefinidamente
      }
    }

    // Criar o cartão no Google Wallet
    const response = await fetch('https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtClient.credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loyaltyObject)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro ao criar cartão: ${error}`)
    }

    const result = await response.json()

    // Gerar link para adicionar ao Google Wallet
    const saveUrl = `https://pay.google.com/gp/v/save/${result.id}`
    
    return saveUrl

  } catch (error) {
    console.error('Erro ao gerar Google Wallet pass:', error)
    throw error
  }
}

// Atualizar saldo do cartão existente
export async function updateGoogleWalletBalance(membroId: string, novoSaldo: number): Promise<boolean> {
  try {
    const config = getGoogleWalletConfig()
    const jwtClient = createJwtClient()
    await jwtClient.authorize()

    const objectId = `${config.issuerId}.${membroId}`
    
    const updateData = {
      loyaltyPoints: {
        balance: {
          string: `R$ ${novoSaldo.toFixed(2)}`
        },
        label: 'Saldo Disponível'
      }
    }

    const response = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${jwtClient.credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao atualizar saldo Google Wallet:', error)
      return false
    }

    console.log('Saldo Google Wallet atualizado:', membroId, novoSaldo)
    return true

  } catch (error) {
    console.error('Erro ao atualizar Google Wallet:', error)
    return false
  }
}
