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

// API para logs Windsor.ai multi-conta
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('🔄 Windsor.ai Logs V2 - Buscando logs:', {
      company: companyName,
      limit
    })

    let data: unknown[] = []

    if (companyName) {
      // Logs de uma empresa específica
      data = await windsorMultiAccountService.getCompanyLogs(companyName, limit)
    } else {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    console.log('✅ Logs Windsor.ai V2 obtidos:', {
      company: companyName,
      records_count: data.length
    })

    return NextResponse.json({
      success: true,
      data: {
        company_name: companyName,
        limit,
        records_count: data.length,
        logs: data
      }
    })

  } catch (error) {
    console.error('❌ Erro ao obter logs Windsor.ai V2:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 