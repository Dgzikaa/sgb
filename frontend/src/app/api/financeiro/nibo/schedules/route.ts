import { NextRequest, NextResponse } from 'next/server'

interface NiboScheduleRequest {
  stakeholderId: string
  dueDate: string
  scheduleDate: string
  categoria_id: string
  centro_custo_id: string
  categories: Array<{
    description: string
    reference?: string
  }>
  accrualDate?: string
  value: number
  costCenterValueType?: number // 0 para valor, 1 para percentagem
  costCenters?: Array<{
    id: string
    value: number
  }>
  description?: string
  reference?: string
  isFlagged?: boolean
  recurrence?: {
    instalment?: Array<{
      dueDate: string
      value: number
    }>
  }
}

// Interface baseada na documentação oficial do NIBO
interface NiboPaymentSchedule {
  stakeholderId: string
  dueDate: string
  scheduleDate: string
  categories: Array<{
    categoryId: string
    value: number
    description?: string
  }>
  costCenters?: Array<{
    costCenterId: string
    value?: string
    percent?: string
  }>
  costCenterValueType?: number // 0 para valor, 1 para percentagem
  accrualDate?: string
  description?: string
  reference?: string
  isFlagged?: boolean
}

interface NiboScheduleResponse {
  id: string
  stakeholderId: string
  dueDate: string
  scheduleDate: string
  status: 'pending' | 'approved' | 'rejected'
  value: number
  categories: Array<{
    categoryId: string
    value: number
    description?: string
  }>
  accrualDate?: string
  description?: string
  reference?: string
  isFlagged?: boolean
}

// Configurações do NIBO (em produção viriam de variáveis de ambiente)
const NIBO_CONFIG = {
  BASE_URL: "https://api.nibo.com.br/empresas/v1",
  API_TOKEN: "02D8F9B964E74ADAA1A595909A67BA46" // Em produção: process.env.NIBO_API_TOKEN
}

export async function POST(request: NextRequest) {
  try {
    const body: NiboScheduleRequest = await request.json()
    const { stakeholderId, dueDate, scheduleDate, categoria_id, centro_custo_id, categories, accrualDate, value } = body

    // Validações básicas
    if (!stakeholderId || !dueDate || !scheduleDate || !categoria_id || !centro_custo_id || !categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Buscar categoria para validar tipo
    const categoriaValidacao = await getCategoriaById(categoria_id.toString())
    
    if (!categoriaValidacao) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      )
    }

    // Validar valor baseado no tipo da categoria
    if (!value || value === 0) {
      return NextResponse.json(
        { success: false, error: 'Valor deve ser diferente de zero' },
        { status: 400 }
      )
    }

    // Validar se o valor está correto para o tipo da categoria
    if (categoriaValidacao.tipo === 'in' && value < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Para categoria de entrada (${categoriaValidacao.nome}), o valor deve ser positivo. Valor atual: ${value}`,
          suggestion: `Use valor positivo: ${Math.abs(value)}`
        },
        { status: 400 }
      )
    }

    if (categoriaValidacao.tipo === 'out' && value > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Para categoria de saída (${categoriaValidacao.nome}), o valor deve ser negativo. Valor atual: ${value}`,
          suggestion: `Use valor negativo: -${value}`
        },
        { status: 400 }
      )
    }

    // Validar datas
    const dueDateObj = new Date(dueDate)
    const scheduleDateObj = new Date(scheduleDate)
    
    if (isNaN(dueDateObj.getTime()) || isNaN(scheduleDateObj.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Datas inválidas' },
        { status: 400 }
      )
    }

    // Validar se categoria e centro de custo existem
    const categoria = await getCategoriaById(categoria_id)
    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      )
    }

    const centroCusto = await getCentroCustoById(centro_custo_id)
    if (!centroCusto) {
      return NextResponse.json(
        { success: false, error: 'Centro de custo não encontrado' },
        { status: 400 }
      )
    }

    // Criar agendamento no NIBO
    const niboResponse = await createScheduleInNibo(body)

    return NextResponse.json({
      success: true,
      data: niboResponse,
      message: 'Agendamento criado com sucesso no NIBO'
    })

  } catch (error) {
    console.error('Erro ao criar agendamento no NIBO:', error)
    
    let errorMessage = 'Erro interno do servidor'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stakeholderId = searchParams.get('stakeholderId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Buscar agendamentos no NIBO
    const schedules = await getSchedulesFromNibo({ 
      stakeholderId, 
      status, 
      startDate, 
      endDate 
    })

    return NextResponse.json({
      success: true,
      data: schedules,
      total: schedules.length
    })

  } catch (error) {
    console.error('Erro ao buscar agendamentos no NIBO:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para criar agendamento no NIBO
async function createScheduleInNibo(schedule: NiboScheduleRequest): Promise<NiboScheduleResponse> {
  try {
    console.log('Iniciando criação de agendamento no NIBO:', schedule)
    
    const headers = {
      'accept': 'application/json',
      'apitoken': NIBO_CONFIG.API_TOKEN,
      'content-type': 'application/json'
    }

    // Buscar dados da categoria e centro de custo (já validados no POST)
    console.log('Buscando categoria:', schedule.categoria_id)
    const categoria = await getCategoriaById(schedule.categoria_id)
    console.log('Categoria encontrada:', categoria)
    console.log('Tipo da categoria:', categoria?.tipo, '- Valor será:', categoria?.tipo === 'in' ? 'POSITIVO (entrada)' : 'NEGATIVO (saída)')
    
    console.log('Buscando centro de custo:', schedule.centro_custo_id)
    const centroCusto = await getCentroCustoById(schedule.centro_custo_id)
    console.log('Centro de custo encontrado:', centroCusto)

    // Validar novamente (segurança extra)
    if (!categoria) {
      throw new Error('Categoria não encontrada')
    }
    
    if (!centroCusto) {
      throw new Error('Centro de custo não encontrado')
    }

    // Determinar o endpoint baseado no tipo da categoria
    const isCredit = categoria?.tipo === 'in'
    const endpoint = isCredit ? '/schedules/credit' : '/schedules/debit'
    const url = `${NIBO_CONFIG.BASE_URL}${endpoint}`

    console.log(`Usando endpoint: ${endpoint} (${isCredit ? 'CRÉDITO' : 'DÉBITO'})`)

    // Montar payload seguindo a documentação oficial do NIBO
    const niboPayload: NiboPaymentSchedule = {
      stakeholderId: schedule.stakeholderId,
      dueDate: schedule.dueDate,
      scheduleDate: schedule.scheduleDate,
      categories: [
        {
          categoryId: categoria?.nibo_id || categoria?.id?.toString() || schedule.categoria_id,
          value: Math.abs(schedule.value), // Sempre positivo, o endpoint determina se é crédito ou débito
          description: categoria?.nome || 'Categoria não encontrada'
        }
      ],
      costCenters: centroCusto ? [
        {
          costCenterId: centroCusto.nibo_id || centroCusto.id.toString(),
          value: Math.abs(schedule.value).toString() // Sempre positivo
        }
      ] : undefined,
      costCenterValueType: 0, // 0 para valor fixo
      accrualDate: schedule.accrualDate,
      description: schedule.description || schedule.categories?.[0]?.description || 'Pagamento PIX',
      reference: schedule.reference,
      isFlagged: schedule.isFlagged || false
    }

    console.log('Payload para NIBO (formato oficial):', JSON.stringify(niboPayload, null, 2))
    console.log('Payload para NIBO (formato oficial):', niboPayload)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(niboPayload)
    })

    console.log('Resposta do NIBO:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `Erro ${response.status} ao criar agendamento`
      try {
        const errorData = await response.json()
        console.error('Erro detalhado do NIBO:', errorData)
        errorMessage = errorData.error_description || errorData.message || errorData.error || errorMessage
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta de erro:', parseError)
        const errorText = await response.text()
        console.error('Resposta de erro como texto:', errorText)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('Agendamento criado com sucesso:', data)
    return data
    
  } catch (error) {
    console.error('Erro detalhado na criação do agendamento:', error)
    throw error
  }
}

// Função para buscar agendamentos no NIBO
async function getSchedulesFromNibo(params: { 
  stakeholderId?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
}): Promise<NiboScheduleResponse[]> {
  const headers = {
    'accept': 'application/json',
    'apitoken': NIBO_CONFIG.API_TOKEN
  }

  let url = `${NIBO_CONFIG.BASE_URL}/schedules/debit`
  const searchParams = new URLSearchParams()

  if (params.stakeholderId) {
    searchParams.append('stakeholderId', params.stakeholderId)
  }

  if (params.status) {
    searchParams.append('status', params.status)
  }

  if (params.startDate) {
    searchParams.append('startDate', params.startDate)
  }

  if (params.endDate) {
    searchParams.append('endDate', params.endDate)
  }

  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error_description || `Erro ${response.status} ao buscar agendamentos`)
  }

  const data = await response.json()
  return data.data || data
}

// Função para buscar categoria por ID
async function getCategoriaById(categoriaId: string) {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Converter para número se possível
    const id = parseInt(categoriaId)
    if (isNaN(id)) {
      console.error('ID da categoria inválido:', categoriaId)
      return null
    }

    const { data, error } = await supabase
      .from('nibo_categorias')
      .select('id, nome, descricao, tipo, nibo_id')
      .eq('id', id)
      .eq('ativo', true)
      .single()

    if (error) {
      console.error('Erro ao buscar categoria:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return null
  }
}

// Função para buscar centro de custo por ID
async function getCentroCustoById(centroCustoId: string) {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Converter para número se possível
    const id = parseInt(centroCustoId)
    if (isNaN(id)) {
      console.error('ID do centro de custo inválido:', centroCustoId)
      return null
    }

    const { data, error } = await supabase
      .from('nibo_centros_custo')
      .select('id, nome, descricao, nibo_id')
      .eq('id', id)
      .eq('ativo', true)
      .single()

    if (error) {
      console.error('Erro ao buscar centro de custo:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar centro de custo:', error)
    return null
  }
} 