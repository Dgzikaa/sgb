import { NextRequest, NextResponse } from 'next/server'
import { getInterCredentials } from '@/lib/api-credentials'
import { getUserAuth } from '@/lib/auth-helper'
import https from 'https'
import fs from 'fs'
import path from 'path'

interface PagamentoInter {
  valor: string
  descricao: string
  destinatario: string
  chave: string
  data_pagamento: string
}

interface InterResponse {
  codigoSolicitacao: string
  status: string
  message?: string
}

// Configurações do Inter
const INTER_CONFIG = {
  BASE_URL: "https://cdpj.partners.bancointer.com.br"
}

// Cache do access token por bar
const tokenCache: Record<string, { token: string; expiry: number }> = {}

export async function POST(request: NextRequest) {
  try {
    const body: PagamentoInter = await request.json()
    const { valor, descricao, destinatario, chave, data_pagamento } = body

    // Obter dados do usuário autenticado
    const userAuth = await getUserAuth(request)
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const barId = userAuth.bar_id.toString()

    // Validações básicas
    if (!valor || !descricao || !destinatario || !chave) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    console.log('🧪 INICIANDO PAGAMENTO PIX INTER')
    console.log('📋 Dados recebidos:', { valor, descricao, destinatario, chave, barId })

    // Buscar credenciais do Inter para este bar
    const credenciais = await getInterCredentials(barId)
    if (!credenciais) {
      console.log('❌ Credenciais não encontradas para bar_id:', barId)
      return NextResponse.json(
        { success: false, error: 'Credenciais do Inter não configuradas para este bar' },
        { status: 400 }
      )
    }

    console.log('✅ Credenciais encontradas:', { 
      client_id: credenciais.client_id.substring(0, 8) + '...',
      conta_corrente: credenciais.conta_corrente 
    })

    // Obter access token com mTLS
    const token = await obterAccessToken(barId, credenciais)
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
        '✅ Token obtido via mTLS com certificados',
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

// Função para obter access token com mTLS (como no Python)
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

    console.log('🔐 Obtendo token de acesso via mTLS...')

    // Carregar certificados base64
    const certPath = path.join(process.cwd(), 'public', 'inter', 'cert_base64.txt')
    const keyPath = path.join(process.cwd(), 'public', 'inter', 'key_base64.txt')

    // Verificar se os certificados existem
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error('❌ Certificados não encontrados:', { certPath, keyPath })
      throw new Error('Certificados mTLS não encontrados')
    }

    // Decodificar certificados base64
    const certBase64 = fs.readFileSync(certPath, 'utf8').trim()
    const keyBase64 = fs.readFileSync(keyPath, 'utf8').trim()
    
    const cert = Buffer.from(certBase64, 'base64')
    const key = Buffer.from(keyBase64, 'base64')

    // Preparar dados para OAuth2
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credenciais.client_id,
      client_secret: credenciais.client_secret,
      scope: 'pagamento-pix.write'
    }).toString()

    // Configurar requisição HTTPS com mTLS
    const options = {
      hostname: 'cdpj.partners.bancointer.com.br',
      port: 443,
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }

    // Fazer requisição HTTPS
    const token = await new Promise<string>((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            if (parsed.access_token) {
              resolve(parsed.access_token)
            } else {
              reject(new Error('Token não encontrado na resposta'))
            }
          } catch (error) {
            reject(new Error(`Erro ao parsear resposta: ${body}`))
          }
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.write(data)
      request.end()
    })

    // Cache do token por bar (expira em 1 hora)
    tokenCache[barId] = {
      token,
      expiry: Date.now() + (60 * 60 * 1000) - 60000 // 1 hora - 1 minuto
    }

    console.log('✅ Token obtido com sucesso via mTLS')
    return token

  } catch (error) {
    console.error('❌ Erro ao obter access token:', error)
    return null
  }
}

// Função para identificar tipo de chave PIX (melhorada como no Python)
function identificarTipoChave(chave: string): { tipo: string; chave: string } | null {
  if (!chave) return null

  const chaveOriginal = chave
  const chaveLimpa = chave.trim()
  
  console.log(`🔍 Analisando chave: '${chaveOriginal}' -> '${chaveLimpa}'`)
  
  // Email (mais específico)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (emailRegex.test(chaveLimpa)) {
    console.log(`✅ Identificado como EMAIL: ${chaveLimpa}`)
    return { tipo: 'EMAIL', chave: chaveLimpa.toLowerCase() }
  }
  
  // Remover formatação para análise numérica
  const chaveNumerica = chaveLimpa.replace(/\D/g, '')
  
  // Verificar se é telefone internacional
  let telefoneInternacional = false
  if (chaveNumerica.startsWith('55') && chaveNumerica.length >= 12) {
    telefoneInternacional = true
  }
  
  console.log(`🧹 Chave limpa: '${chaveNumerica}' (tamanho: ${chaveNumerica.length})`)
  
  // CNPJ (14 dígitos)
  if (chaveNumerica.length === 14) {
    if (validarCNPJ(chaveNumerica)) {
      console.log(`✅ Identificado como CNPJ válido: ${chaveNumerica}`)
      return { tipo: 'CNPJ', chave: chaveNumerica }
    } else {
      console.log(`⚠️ CNPJ inválido detectado: ${chaveOriginal} -> ${chaveNumerica}`)
      return { tipo: 'CNPJ', chave: chaveNumerica } // Retorna mesmo se inválido
    }
  }
  
  // CPF (11 dígitos)
  if (chaveNumerica.length === 11) {
    if (validarCPF(chaveNumerica)) {
      console.log(`✅ Identificado como CPF válido: ${chaveNumerica}`)
      return { tipo: 'CPF', chave: chaveNumerica }
    } else {
      console.log(`⚠️ CPF inválido detectado: ${chaveOriginal} -> ${chaveNumerica}`)
      return { tipo: 'CPF', chave: chaveNumerica } // Retorna mesmo se inválido
    }
  }
  
  // Telefone (10 ou 11 dígitos)
  if (chaveNumerica.length === 10 || chaveNumerica.length === 11 || telefoneInternacional) {
    let telefone = chaveNumerica
    
    // Remover código do país se presente
    if (telefone.startsWith('55') && telefone.length >= 12) {
      telefone = telefone.slice(2)
    }
    
    // Validar formato brasileiro
    if (telefone.length === 11) {
      const ddd = telefone.slice(0, 2)
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && telefone[2] === '9') {
        console.log(`✅ Identificado como TELEFONE CELULAR válido: ${telefone}`)
        return { tipo: 'TELEFONE', chave: `+55${telefone}` }
      }
    } else if (telefone.length === 10) {
      const ddd = telefone.slice(0, 2)
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
        console.log(`✅ Identificado como TELEFONE FIXO válido: ${telefone}`)
        return { tipo: 'TELEFONE', chave: `+55${telefone}` }
      }
    }
    
    console.log(`⚠️ Telefone com formato suspeito: ${chaveOriginal} -> ${telefone}`)
    return { tipo: 'TELEFONE', chave: `+55${telefone}` } // Retorna mesmo se formato suspeito
  }
  
  // Chave aleatória (UUID)
  if (chaveLimpa.length >= 32 || chaveLimpa.includes('-')) {
    console.log(`✅ Identificado como CHAVE ALEATÓRIA: ${chaveLimpa}`)
    return { tipo: 'ALEATORIA', chave: chaveLimpa }
  }
  
  // Caso não consiga identificar claramente
  console.log(`⚠️ Tipo de chave não identificado: ${chaveOriginal} -> ${chaveNumerica}`)
  
  // Inferir baseado no tamanho
  if (chaveNumerica.length > 14) {
    console.log(`📝 Inferindo como CHAVE ALEATÓRIA por tamanho`)
    return { tipo: 'ALEATORIA', chave: chaveLimpa }
  } else if (chaveNumerica.length > 11) {
    console.log(`📝 Inferindo como CNPJ por tamanho`)
    return { tipo: 'CNPJ', chave: chaveNumerica }
  } else if (chaveNumerica.length > 10) {
    console.log(`📝 Inferindo como CPF por tamanho`)
    return { tipo: 'CPF', chave: chaveNumerica }
  } else {
    console.log(`📝 Inferindo como TELEFONE por tamanho`)
    return { tipo: 'TELEFONE', chave: `+55${chaveNumerica}` }
  }
}

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11 || cpf === cpf[0].repeat(11)) {
    return false
  }
  
  // Primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i)
  }
  let resto = soma % 11
  const digito1 = resto < 2 ? 0 : 11 - resto
  
  if (parseInt(cpf[9]) !== digito1) {
    return false
  }
  
  // Segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i)
  }
  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto
  
  return parseInt(cpf[10]) === digito2
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || cnpj === cnpj[0].repeat(14)) {
    return false
  }
  
  // Primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * pesos1[i]
  }
  let resto = soma % 11
  const digito1 = resto < 2 ? 0 : 11 - resto
  
  if (parseInt(cnpj[12]) !== digito1) {
    return false
  }
  
  // Segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  soma = 0
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * pesos2[i]
  }
  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto
  
  return parseInt(cnpj[13]) === digito2
}

// Função para realizar pagamento PIX com mTLS
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

    // Limpar valor (como no Python)
    const valorLimpo = valor.replace('R$', '').replace('.', '').replace(',', '.').trim()
    const valorNumerico = parseFloat(valorLimpo).toFixed(2)

    const payload = {
      valor: valorNumerico,
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

    console.log('💸 Realizando pagamento PIX com mTLS...')
    console.log('📤 Payload:', JSON.stringify(payload, null, 2))

    // Caminhos dos certificados
    const certPath = path.join(process.cwd(), 'public', 'inter', 'fullchain.pem')
    const keyPath = path.join(process.cwd(), 'public', 'inter', 'key.pem')

    // Configurar requisição HTTPS com mTLS
    const options = {
      hostname: 'cdpj.partners.bancointer.com.br',
      port: 443,
      path: '/banking/v2/pix',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-conta-corrente': conta_corrente,
        'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
      },
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }

    // Fazer requisição HTTPS
    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 500,
            body
          })
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.write(JSON.stringify(payload))
      request.end()
    })

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body)
      console.log('✅ Pagamento PIX realizado com sucesso')
      return {
        success: true,
        data: {
          codigoSolicitacao: data.codigoSolicitacao || `inter_${Date.now()}`,
          status: 'success'
        }
      }
    } else {
      console.error('❌ Erro no pagamento PIX:', response.body)
      const errorData = JSON.parse(response.body)
      return {
        success: false,
        error: errorData.error_description || `Erro ${response.statusCode}`
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