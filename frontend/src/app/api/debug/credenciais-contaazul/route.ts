import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')

    // Buscar todas as credenciais do ContaAzul
    const { data: allCredentials, error: allError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service', 'contaazul')

    if (allError) {
      console.error('Erro ao buscar credenciais:', allError)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados' }, { status: 500 })
    }

    // Se barId foi especificado, buscar credenciais especÃ­ficas
    let specificCredentials = null
    if (barId) {
      const { data: specific, error: specificError } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('service', 'contaazul')
        .eq('bar_id', barId)
        .single()

      if (specificError) {
        console.log('Erro ao buscar credencial especÃ­fica:', specificError)
      } else {
        specificCredentials = specific
      }
    }

    // Verificar estrutura da tabela api_credentials
    const { data: tableSchema, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'api_credentials' })
      .single()

    return NextResponse.json({
      success: true,
      barIdConsultado: barId,
      totalCredenciaisContaAzul: allCredentials?.length || 0,
      credenciaisEncontradas: allCredentials?.map((cred: any) => ({
        id: cred.id,
        bar_id: cred.bar_id,
        service: cred.service,
        username: cred.username,
        hasAccessToken: !!cred.access_token,
        hasRefreshToken: !!cred.refresh_token,
        created_at: cred.created_at,
        updated_at: cred.updated_at
      })) || [],
      credencialEspecifica: specificCredentials ? {
        id: specificCredentials.id,
        bar_id: specificCredentials.bar_id,
        service: specificCredentials.service,
        username: specificCredentials.username,
        hasAccessToken: !!specificCredentials.access_token,
        hasRefreshToken: !!specificCredentials.refresh_token,
        created_at: specificCredentials.created_at,
        updated_at: specificCredentials.updated_at,
        accessTokenPreview: specificCredentials.access_token ? 
          specificCredentials.access_token.substring(0, 20) + '...' : null
      } : null,
      encontrouCredencialParaBar: !!specificCredentials,
      schemaTabela: tableSchema || 'Erro ao obter schema'
    })

  } catch (error) {
    console.error('Erro no debug de credenciais:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Adicionar mÃ©todo POST para casos onde precisamos verificar credenciais via POST
export async function POST(request: NextRequest) {
  try {
    const { barId } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId Ã© obrigatÃ³rio' }, { status: 400 })
    }

    // Buscar credenciais do ContaAzul para o bar especificado
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('service', 'contaazul')

    if (credError) {
      console.error('Erro ao buscar credenciais:', credError)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados' }, { status: 500 })
    }

    // Buscar informaÃ§Ãµes do bar
    const { data: barInfo, error: barError } = await supabase
      .from('bars')
      .select('id, nome')
      .eq('id', barId)
      .single()

    return NextResponse.json({
      success: true,
      barId: barId,
      barInfo: barInfo || null,
      barEncontrado: !!barInfo,
      totalCredenciais: credentials?.length || 0,
      credenciais: credentials?.map((cred: any) => ({
        id: cred.id,
        bar_id: cred.bar_id,
        service: cred.service,
        username: cred.username,
        hasAccessToken: !!cred.access_token,
        hasRefreshToken: !!cred.refresh_token,
        accessTokenLength: cred.access_token?.length || 0,
        created_at: cred.created_at,
        updated_at: cred.updated_at
      })) || [],
      temCredenciaisValidas: credentials && credentials.length > 0 && credentials[0].access_token,
      primeiraCredencial: credentials && credentials.length > 0 ? {
        id: credentials[0].id,
        username: credentials[0].username,
        accessTokenPreview: credentials[0].access_token ? 
          credentials[0].access_token.substring(0, 30) + '...' : null,
        hasRefreshToken: !!credentials[0].refresh_token
      } : null
    })

  } catch (error) {
    console.error('Erro no debug POST:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
