import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NIBO_CONFIG = {
  BASE_URL: 'https://api.nibo.com.br/empresas/v1',
  API_TOKEN: process.env.NIBO_API_TOKEN || '02D8F9B964E74ADAA1A595909A67BA46'
}

interface NiboStakeholderUpdate {
  name: string
  document: {
    number: string
    type: 'CPF' | 'CNPJ'
  }
  communication?: {
    contactName?: string
    email?: string
    phone?: string
    cellPhone?: string
    webSite?: string
  }
  address?: {
    line1?: string
    line2?: string
    number?: number
    district?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  bankAccountInformation?: {
    bankNumber?: string
    agency?: string
    accountNumber?: string
    bankAccountType?: number
    pixKey?: string
    pixKeyType?: number
  }
  companyInformation?: {
    companyName?: string
    municipalInscription?: string
  }
}

interface NiboStakeholderResponse {
  id: string
  name: string
  document: {
    number: string
    type: string
  }
  communication?: {
    email?: string
    phone?: string
  }
  bankAccountInformation?: {
    pixKey?: string
    pixKeyType?: number
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body: NiboStakeholderUpdate = await request.json()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do stakeholder é obrigatório' },
        { status: 400 }
      )
    }

    // Validações básicas
    if (!body.name || !body.document || !body.document.number || !body.document.type) {
      return NextResponse.json(
        { success: false, error: 'Nome e documento são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de documento
    if (body.document.type === 'CPF' && body.document.number.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      )
    }

    if (body.document.type === 'CNPJ' && body.document.number.length !== 14) {
      return NextResponse.json(
        { success: false, error: 'CNPJ deve ter 14 dígitos' },
        { status: 400 }
      )
    }

    const niboResponse = await updateStakeholderInNibo(id, body)
    
    return NextResponse.json({
      success: true,
      data: niboResponse,
      message: 'Stakeholder atualizado com sucesso no NIBO'
    })

  } catch (error) {
    console.error('Erro ao atualizar stakeholder no NIBO:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function updateStakeholderInNibo(
  stakeholderId: string, 
  stakeholder: NiboStakeholderUpdate
): Promise<NiboStakeholderResponse> {
  const headers = {
    'accept': 'application/json',
    'apitoken': NIBO_CONFIG.API_TOKEN,
    'content-type': 'application/json'
  }

  console.log('Atualizando stakeholder no NIBO:', stakeholderId)
  console.log('Payload:', JSON.stringify(stakeholder, null, 2))

  const response = await fetch(`${NIBO_CONFIG.BASE_URL}/suppliers/${stakeholderId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(stakeholder)
  })

  console.log('Status da resposta NIBO:', response.status)
  console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    let errorMessage = `Erro ${response.status} do NIBO`
    try {
      const errorText = await response.text()
      if (errorText) {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      }
    } catch (e) {
      // Ignorar erro de parse
    }
    throw new Error(errorMessage)
  }

  // SEMPRE atualizar o banco local, independente do tipo de resposta
  console.log('Atualizando banco local com dados:', stakeholder)
  
  // Remover formatação do documento para garantir consistência
  const documentoLimpo = stakeholder.document.number.replace(/\D/g, '')
  
  const updateData: any = {
    nome: stakeholder.name,
    documento_numero: documentoLimpo, // Sempre sem formatação
    documento_tipo: stakeholder.document.type,
    email: stakeholder.communication?.email,
    telefone: stakeholder.communication?.phone,
    endereco: stakeholder.address || {},
    informacoes_bancarias: stakeholder.bankAccountInformation || {},
    atualizado_em: new Date().toISOString()
  }

  // Atualizar dados de PIX se fornecidos
  if (stakeholder.bankAccountInformation?.pixKey) {
    updateData.pix_chave = stakeholder.bankAccountInformation.pixKey
    updateData.pix_tipo = stakeholder.bankAccountInformation.pixKeyType
    console.log('Atualizando PIX no banco local:', {
      pix_chave: updateData.pix_chave,
      pix_tipo: updateData.pix_tipo
    })
  } else {
    console.log('Nenhum dado de PIX fornecido para atualização')
  }

  console.log('Dados completos para atualização no banco:', updateData)
  console.log('Buscando stakeholder com nibo_id:', stakeholderId)

  const { error: dbError } = await supabase
    .from('nibo_stakeholders')
    .update(updateData)
    .eq('nibo_id', stakeholderId)

  if (dbError) {
    console.error('Erro ao atualizar stakeholder no banco local:', dbError)
    throw new Error(`Erro ao atualizar banco local: ${dbError.message}`)
  }

  console.log('Banco local atualizado com sucesso!')

  // Para status 204 (No Content), retornar dados do request
  if (response.status === 204) {
    return {
      id: stakeholderId,
      name: stakeholder.name,
      document: stakeholder.document,
      communication: stakeholder.communication,
      bankAccountInformation: stakeholder.bankAccountInformation
    }
  }

  // Para outros status codes (200, 201), tentar parsear JSON
  const responseText = await response.text()
  console.log('Resposta do NIBO:', responseText)
  
  if (!responseText.trim()) {
    // Se não há resposta mas o status é OK, retornar dados do request
    return {
      id: stakeholderId,
      name: stakeholder.name,
      document: stakeholder.document,
      communication: stakeholder.communication,
      bankAccountInformation: stakeholder.bankAccountInformation
    }
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    console.error('Erro ao parsear JSON da resposta:', parseError)
    // Se não consegue parsear mas o status é OK, retornar dados do request
    return {
      id: stakeholderId,
      name: stakeholder.name,
      document: stakeholder.document,
      communication: stakeholder.communication,
      bankAccountInformation: stakeholder.bankAccountInformation
    }
  }

  return {
    id: data.id || stakeholderId,
    name: data.name || stakeholder.name,
    document: data.document || stakeholder.document,
    communication: data.communication || stakeholder.communication,
    bankAccountInformation: data.bankAccountInformation || stakeholder.bankAccountInformation
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do stakeholder é obrigatório' },
        { status: 400 }
      )
    }

    const stakeholder = await getStakeholderFromNibo(id)
    
    return NextResponse.json({
      success: true,
      data: stakeholder
    })

  } catch (error) {
    console.error('Erro ao buscar stakeholder no NIBO:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function getStakeholderFromNibo(stakeholderId: string): Promise<NiboStakeholderResponse> {
  const headers = {
    'accept': 'application/json',
    'apitoken': NIBO_CONFIG.API_TOKEN
  }

  const response = await fetch(`${NIBO_CONFIG.BASE_URL}/suppliers/${stakeholderId}`, {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error_description || `Erro ${response.status} ao buscar stakeholder`)
  }

  const data = await response.json()
  return {
    id: data.id,
    name: data.name,
    document: data.document,
    communication: data.communication,
    bankAccountInformation: data.bankAccountInformation
  }
} 