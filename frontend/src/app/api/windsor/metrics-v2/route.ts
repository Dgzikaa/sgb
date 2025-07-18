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

// API para métricas Windsor.ai multi-conta
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')
    const platform = searchParams.get('platform')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const consolidated = searchParams.get('consolidated') === 'true'

    console.log('🔄 Windsor.ai Metrics V2 - Buscando métricas:', {
      company: companyName,
      platform,
      date_from: dateFrom,
      date_to: dateTo,
      consolidated
    })

    let data: unknown[] = []

    if (consolidated) {
      // Métricas consolidadas de todas as empresas
      data = await windsorMultiAccountService.getConsolidatedMetrics({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
    } else if (companyName) {
      // Métricas de uma empresa específica
      data = await windsorMultiAccountService.getCompanyMetrics({
        companyName,
        platform: platform || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa é obrigatório para métricas específicas' },
        { status: 400 }
      )
    }

    console.log('✅ Métricas Windsor.ai V2 obtidas:', {
      company: companyName,
      records_count: data.length
    })

    return NextResponse.json({
      success: true,
      data: {
        company_name: companyName,
        platform,
        date_from: dateFrom,
        date_to: dateTo,
        consolidated,
        records_count: data.length,
        metrics: data
      }
    })

  } catch (error) {
    console.error('❌ Erro ao obter métricas Windsor.ai V2:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 