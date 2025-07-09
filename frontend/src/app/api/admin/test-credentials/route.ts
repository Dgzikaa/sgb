import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste simples de credenciais')

    // Buscar credenciais do banco
    const { data: creds, error } = await supabase
      .from('api_credentials')
      .select('username, password, configuracoes')
      .eq('bar_id', 3)
      .in('sistema', ['contaazul', 'contahub'])
      .eq('ativo', true)
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      resultado: {
        erro: error?.message,
        encontrou: !!creds,
        email_mascarado: creds?.username ? creds.username.replace(/(.{3}).*(@.*)/, '$1***$2') : 'não encontrado',
        tem_senha: !!creds?.password,
        tem_2fa: !!creds?.configuracoes?.secret_2fa,
        config_completa: creds?.configuracoes
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: "API de teste para verificar credenciais",
    uso: "POST /api/admin/test-credentials"
  })
} 