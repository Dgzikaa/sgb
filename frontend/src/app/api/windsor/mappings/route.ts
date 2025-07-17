import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API para gerenciar mapeamentos de empresas Windsor.ai
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')

    let query = supabase
      .from('windsor_company_mapping')
      .select(`
        *,
        windsor_accounts (
          id,
          windsor_account_name,
          windsor_plan,
          enabled
        )
      `)
      .order('company_name, platform')

    if (companyName) {
      query = query.eq('company_name', companyName)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('❌ Erro ao obter mapeamentos Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai - Criando/atualizando mapeamento:', {
      company: body.company_name,
      platform: body.platform,
      account_id: body.platform_account_id
    })

    // Validar dados obrigatórios
    if (!body.windsor_account_id || !body.company_name || !body.platform || !body.platform_account_id) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Validar plataforma
    const validPlatforms = ['facebook_ads', 'instagram', 'google_ads', 'youtube', 'twitter', 'meta_business']
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { success: false, error: 'Plataforma não suportada' },
        { status: 400 }
      )
    }

    // Verificar se a conta Windsor.ai existe
    const { data: account, error: accountError } = await supabase
      .from('windsor_accounts')
      .select('id, enabled')
      .eq('id', body.windsor_account_id)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: 'Conta Windsor.ai não encontrada' },
        { status: 404 }
      )
    }

    if (!account.enabled) {
      return NextResponse.json(
        { success: false, error: 'Conta Windsor.ai está desabilitada' },
        { status: 400 }
      )
    }

    // Salvar mapeamento
    const { data, error } = await supabase
      .from('windsor_company_mapping')
      .upsert({
        windsor_account_id: body.windsor_account_id,
        company_name: body.company_name,
        bar_id: body.bar_id,
        platform: body.platform,
        platform_account_id: body.platform_account_id,
        platform_account_name: body.platform_account_name,
        enabled: body.enabled !== false,
        sync_frequency: body.sync_frequency || 'daily'
      }, { 
        onConflict: 'windsor_account_id,company_name,platform,platform_account_id' 
      })
      .select(`
        *,
        windsor_accounts (
          id,
          windsor_account_name,
          windsor_plan
        )
      `)
      .single()

    if (error) throw error

    console.log('✅ Mapeamento Windsor.ai salvo com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Mapeamento Windsor.ai salvo com sucesso',
      data
    })

  } catch (error) {
    console.error('❌ Erro ao salvar mapeamento Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai - Atualizando mapeamento:', {
      id: body.id,
      company: body.company_name,
      platform: body.platform
    })

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID do mapeamento não fornecido' },
        { status: 400 }
      )
    }

    // Atualizar mapeamento
    const { data, error } = await supabase
      .from('windsor_company_mapping')
      .update({
        platform_account_name: body.platform_account_name,
        enabled: body.enabled,
        sync_frequency: body.sync_frequency,
        bar_id: body.bar_id
      })
      .eq('id', body.id)
      .select(`
        *,
        windsor_accounts (
          id,
          windsor_account_name,
          windsor_plan
        )
      `)
      .single()

    if (error) throw error

    console.log('✅ Mapeamento Windsor.ai atualizado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Mapeamento Windsor.ai atualizado com sucesso',
      data
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar mapeamento Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do mapeamento não fornecido' },
        { status: 400 }
      )
    }

    console.log('🔄 Windsor.ai - Excluindo mapeamento:', id)

    // Excluir mapeamento
    const { error } = await supabase
      .from('windsor_company_mapping')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log('✅ Mapeamento Windsor.ai excluído com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Mapeamento Windsor.ai excluído com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao excluir mapeamento Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 