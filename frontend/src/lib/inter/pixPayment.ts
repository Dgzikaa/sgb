import https from 'https'
import { getInterCertificates } from './certificates'
import crypto from 'crypto'

interface PixPaymentParams {
  token: string
  contaCorrente: string
  valor: number
  descricao: string
  chave: string
}

export async function realizarPagamentoPixInter(params: PixPaymentParams): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { token, contaCorrente, valor, descricao, chave } = params

    console.log('🔐 Iniciando pagamento PIX com https.request...')

    // Carregar certificados PEM usando função centralizada
    const { cert, key } = getInterCertificates()

    // Preparar payload (valor como string conforme Python)
    const payload = {
      valor: valor.toFixed(2), // Enviar como string
      descricao: descricao || 'Pagamento PIX',
      destinatario: {
        tipo: "CHAVE",
        chave: chave
      }
    }

    // Gerar ID idempotente único
    const idempotenteId = crypto.randomUUID()

    // Preparar headers (exato como Python)
    const headers = {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
      'x-conta-corrente': '400516462'
    }

    console.log('📦 Payload para PIX:', JSON.stringify(payload))
    console.log('🔐 Headers para PIX:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json',
      'x-conta-corrente': '400516462'
    })

    // Configurar requisição HTTPS com mTLS (produção)
    const options = {
      hostname: 'cdpj.partners.bancointer.com.br',
      port: 443,
      path: '/banking/v2/pix',
      method: 'POST',
      headers: headers,
      cert: cert,
      key: key,
    }

    // Fazer requisição HTTPS
    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const request = https.request(options, (response) => {
        console.log('📡 Status da resposta PIX:', response.statusCode)
        console.log('📡 Headers da resposta PIX:', response.headers)
        
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => {
          console.log('📡 Corpo da resposta PIX:', body)
          
          resolve({
            statusCode: response.statusCode || 500,
            body
          })
        })
      })

      request.on('error', (error) => {
        console.log('❌ Erro na requisição HTTPS PIX:', error)
        reject(error)
      })

      request.write(JSON.stringify(payload))
      request.end()
    })

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body)
      console.log('✅ Pagamento PIX realizado com sucesso!')
      console.log('📡 Data:', data)

      return {
        success: true,
        data: data
      }
    } else {
      console.error('❌ Erro no pagamento PIX:', response.body)
      
      // Tratar resposta vazia ou não-JSON
      let errorMessage = `Erro ${response.statusCode}`
      
      if (response.body && response.body.trim()) {
        try {
          const errorData = JSON.parse(response.body)
          errorMessage = errorData.title || errorMessage
        } catch (parseError) {
          errorMessage = `Erro ${response.statusCode}: ${response.body}`
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }

  } catch (error: any) {
    console.error('❌ Erro ao realizar pagamento PIX:', error)
    return {
      success: false,
      error: 'Erro na comunicação com o banco'
    }
  }
} 