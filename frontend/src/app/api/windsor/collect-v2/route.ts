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

import { NextRequest, NextResponse } from 'next/server'
import { windsorMultiAccountService } from '@/lib/windsor-multi-account-service'

// API para coleta de dados Windsor.ai multi-conta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai Collect V2 - Iniciando coleta:', {
      company_name: body.company_name,
      platform: body.platform,
      date_from: body.date_from,
      date_to: body.date_to
    })

    // Validar parâmetros
    if (!body.company_name) {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Coletar dados da empresa
    const results = await windsorMultiAccountService.collectCompanyData({
      companyName: body.company_name,
      platform: body.platform,
      dateFrom: body.date_from,
      dateTo: body.date_to
    })

    console.log('✅ Coleta Windsor.ai V2 concluída:', {
      company: body.company_name,
      results_count: results.length
    })

    return NextResponse.json({
      success: true,
      message: 'Coleta Windsor.ai concluída com sucesso',
      data: {
        company_name: body.company_name,
        results_count: results.length,
        results: results.map(r => ({
          id: r.id,
          platform: r.platform,
          platform_account_id: r.platform_account_id,
          date_range: `${r.date_from} a ${r.date_to}`,
          collected_at: r.collected_at
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erro na coleta Windsor.ai V2:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Coletar dados de todas as empresas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    console.log('🔄 Windsor.ai Collect V2 - Coletando todas as empresas')

    // Coletar dados de todas as empresas
    const results = await windsorMultiAccountService.collectAllCompaniesData(
      dateFrom || undefined,
      dateTo || undefined
    )

    console.log('✅ Coleta completa Windsor.ai V2 concluída:', {
      total_results: results.length
    })

    return NextResponse.json({
      success: true,
      message: 'Coleta completa Windsor.ai concluída com sucesso',
      data: {
        total_results: results.length,
        results: results.map(r => ({
          id: r.id,
          company_name: r.company_name,
          platform: r.platform,
          platform_account_id: r.platform_account_id,
          date_range: `${r.date_from} a ${r.date_to}`,
          collected_at: r.collected_at
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erro na coleta completa Windsor.ai V2:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 