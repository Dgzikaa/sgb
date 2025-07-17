import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API para gerenciar contas Windsor.ai
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('windsor_accounts')
      .select('*')
      .order('windsor_account_name')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('❌ Erro ao obter contas Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai - Criando/atualizando conta:', {
      account_name: body.windsor_account_name,
      plan: body.windsor_plan
    })

    // Validar dados obrigatórios
    if (!body.windsor_account_name || !body.windsor_plan || !body.api_key) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Validar plano
    if (!['basic', 'standard'].includes(body.windsor_plan)) {
      return NextResponse.json(
        { success: false, error: 'Plano deve ser basic ou standard' },
        { status: 400 }
      )
    }

    // Salvar conta
    const { data, error } = await supabase
      .from('windsor_accounts')
      .upsert({
        windsor_account_name: body.windsor_account_name,
        windsor_plan: body.windsor_plan,
        api_key: body.api_key,
        webhook_url: body.webhook_url,
        enabled: body.enabled !== false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'windsor_account_name' })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Conta Windsor.ai salva com sucesso:', data.windsor_account_name)

    return NextResponse.json({
      success: true,
      message: 'Conta Windsor.ai salva com sucesso',
      data
    })

  } catch (error) {
    console.error('❌ Erro ao salvar conta Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai - Atualizando conta:', {
      id: body.id,
      account_name: body.windsor_account_name
    })

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID da conta não fornecido' },
        { status: 400 }
      )
    }

    // Atualizar conta
    const { data, error } = await supabase
      .from('windsor_accounts')
      .update({
        windsor_plan: body.windsor_plan,
        api_key: body.api_key,
        webhook_url: body.webhook_url,
        enabled: body.enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Conta Windsor.ai atualizada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Conta Windsor.ai atualizada com sucesso',
      data
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar conta Windsor.ai:', error)
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
        { success: false, error: 'ID da conta não fornecido' },
        { status: 400 }
      )
    }

    console.log('🔄 Windsor.ai - Excluindo conta:', id)

    // Verificar se há mapeamentos ativos
    const { data: mappings, error: mappingsError } = await supabase
      .from('windsor_company_mapping')
      .select('id')
      .eq('windsor_account_id', id)

    if (mappingsError) throw mappingsError

    if (mappings && mappings.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir conta com mapeamentos ativos' },
        { status: 400 }
      )
    }

    // Excluir conta
    const { error } = await supabase
      .from('windsor_accounts')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log('✅ Conta Windsor.ai excluída com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Conta Windsor.ai excluída com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao excluir conta Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 