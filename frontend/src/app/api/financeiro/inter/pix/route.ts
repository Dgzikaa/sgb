import { NextRequest, NextResponse } from 'next/server'
import { getInterCredentials } from '@/lib/api-credentials'

interface PagamentoInter {
  valor: string
  descricao: string
  destinatario: string
  chave: string
  data_pagamento: string
  bar_id: string // Adicionado para identificar qual bar
}

interface InterResponse {
  codigoSolicitacao: string
  status: string
  message?: string
}

// Configurações do Inter (sem credenciais expostas)
const INTER_CONFIG = {
  BASE_URL: "https://cdpj.partners.bancointer.com.br"
}

// Cache do access token por bar
const tokenCache: Record<string, { token: string; expiry: number }> = {}

export async function POST(request: NextRequest) {
  try {
    const body: PagamentoInter = await request.json()
    const { valor, descricao, destinatario, chave, data_pagamento, bar_id } = body

    // Validações básicas
    if (!valor || !descricao || !destinatario || !chave || !bar_id) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    console.log('🧪 INICIANDO TESTE DO FLUXO PIX INTER')
    console.log('📋 Dados recebidos:', { valor, descricao, destinatario, chave, bar_id })

    // Buscar credenciais do Inter para este bar
    const credenciais = await getInterCredentials(bar_id)
    if (!credenciais) {
      console.log('❌ Credenciais não encontradas para bar_id:', bar_id)
      return NextResponse.json(
        { success: false, error: 'Credenciais do Inter não configuradas para este bar' },
        { status: 400 }
      )
    }

    console.log('✅ Credenciais encontradas:', { 
      client_id: credenciais.client_id.substring(0, 8) + '...',
      conta_corrente: credenciais.conta_corrente 
    })

    // Obter access token via Edge Function (que usa certificados mTLS)
    const token = await obterAccessToken(bar_id, credenciais)
    if (!token) {
      console.log('❌ Falha ao obter token de acesso')
      return NextResponse.json(
        { success: false, error: 'Erro ao obter token de acesso' },
        { status: 500 }
      )
    }

    console.log('✅ Token obtido com sucesso:', token.substring(0, 20) + '...')

    // Identificar tipo de chave PIX
    const tipoChave = identificarTipoChave(chave)
    if (!tipoChave) {
      console.log('❌ Tipo de chave PIX não identificado:', chave)
      return NextResponse.json(
        { success: false, error: 'Tipo de chave PIX não identificado' },
        { status: 400 }
      )
    }

    console.log('✅ Tipo de chave identificado:', tipoChave)

    // REALIZAR PAGAMENTO REAL
    console.log('💸 REALIZANDO PAGAMENTO REAL NO INTER')
    console.log('📤 Dados sendo enviados para o Inter:')
    console.log('   - Valor:', valor)
    console.log('   - Descrição:', descricao)
    console.log('   - Destinatário:', destinatario)
    console.log('   - Chave:', tipoChave.chave)
    console.log('   - Conta Corrente:', credenciais.conta_corrente)
    console.log('   - Token:', token.substring(0, 20) + '...')

    // Realizar pagamento PIX real
    const resultadoPagamento = await realizarPagamentoPix({
      valor,
      descricao,
      destinatario,
      chave: tipoChave.chave,
      token,
      conta_corrente: credenciais.conta_corrente
    })

    if (!resultadoPagamento.success) {
      console.log('❌ Erro no pagamento:', resultadoPagamento.error)
      return NextResponse.json(
        { success: false, error: resultadoPagamento.error },
        { status: 500 }
      )
    }

    console.log('✅ Pagamento PIX realizado com sucesso!')
    return NextResponse.json({
      success: true,
      data: resultadoPagamento.data,
      message: 'Pagamento PIX realizado com sucesso',
      logs: [
        '✅ Credenciais carregadas da tabela api_credentials',
        '✅ Token obtido via Edge Function inter-auth (mTLS)',
        '✅ Tipo de chave PIX identificado',
        '✅ Validações de dados passaram',
        '✅ Pagamento PIX realizado com sucesso no Inter'
      ]
    })

  } catch (error) {
    console.error('❌ Erro ao processar pagamento Inter:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para obter access token via Edge Function (mTLS)
async function obterAccessToken(
  barId: string, 
  credenciais: { client_id: string; client_secret: string; conta_corrente: string }
): Promise<string | null> {
  try {
    // Verificar se já temos um token válido para este bar
    const cached = tokenCache[barId]
    if (cached && Date.now() < cached.expiry) {
      return cached.token
    }

    console.log('🔐 Obtendo token de acesso via Edge Function (mTLS)...')

    // Chamar Edge Function que usa certificados do Supabase Storage
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inter-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        bar_id: barId,
        client_id: credenciais.client_id,
        client_secret: credenciais.client_secret
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Edge Function:', errorText)
      throw new Error(`Erro ao obter token: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success && data.access_token) {
      // Cache do token por bar
      tokenCache[barId] = {
        token: data.access_token,
        expiry: Date.now() + (data.expires_in * 1000) - 60000 // Expira 1 min antes
      }
      console.log('✅ Token obtido com sucesso via mTLS')
      return data.access_token
    } else {
      throw new Error(data.error || 'Erro na resposta do servidor')
    }

  } catch (error) {
    console.error('❌ Erro ao obter access token:', error)
    return null
  }
}

// Função para identificar tipo de chave PIX
function identificarTipoChave(chave: string): { tipo: string; chave: string } | null {
  if (!chave) return null

  const chaveLimpa = chave.trim()
  
  // Email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (emailRegex.test(chaveLimpa)) {
    return { tipo: 'EMAIL', chave: chaveLimpa.toLowerCase() }
  }

  // CPF (11 dígitos)
  const cpfLimpo = chaveLimpa.replace(/\D/g, '')
  if (cpfLimpo.length === 11) {
    return { tipo: 'CPF', chave: cpfLimpo }
  }

  // CNPJ (14 dígitos)
  if (cpfLimpo.length === 14) {
    return { tipo: 'CNPJ', chave: cpfLimpo }
  }

  // Telefone (10 ou 11 dígitos)
  if (cpfLimpo.length === 10 || cpfLimpo.length === 11) {
    const telefone = cpfLimpo.startsWith('55') ? cpfLimpo.slice(2) : cpfLimpo
    return { tipo: 'TELEFONE', chave: `+55${telefone}` }
  }

  // Chave aleatória
  if (chaveLimpa.length >= 32 || chaveLimpa.includes('-')) {
    return { tipo: 'ALEATORIA', chave: chaveLimpa }
  }

  return null
}

// Função para realizar pagamento PIX
async function realizarPagamentoPix(params: {
  valor: string
  descricao: string
  destinatario: string
  chave: string
  token: string
  conta_corrente: string
}): Promise<{ success: boolean; data?: InterResponse; error?: string }> {
  try {
    const { valor, descricao, destinatario, chave, token, conta_corrente } = params

    const payload = {
      valor: parseFloat(valor).toFixed(2),
      descricao,
      destinatario: {
        tipo: "CHAVE",
        chave
      }
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-conta-corrente': conta_corrente
    }

    console.log('💸 Realizando pagamento PIX...')

    const response = await fetch(`${INTER_CONFIG.BASE_URL}/banking/v2/pix`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Pagamento PIX realizado com sucesso')
      return {
        success: true,
        data: {
          codigoSolicitacao: data.codigoSolicitacao || `inter_${Date.now()}`,
          status: 'success'
        }
      }
    } else {
      const errorData = await response.json()
      console.error('❌ Erro no pagamento PIX:', errorData)
      return {
        success: false,
        error: errorData.error_description || `Erro ${response.status}`
      }
    }
  } catch (error) {
    console.error('❌ Erro ao realizar pagamento PIX:', error)
    return {
      success: false,
      error: 'Erro na comunicação com o banco'
    }
  }
} 