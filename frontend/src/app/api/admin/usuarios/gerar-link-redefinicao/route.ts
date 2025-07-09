import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, user_id } = await request.json()
    const finalUserId = userId || user_id // Compatibilidade com ambos os formatos

    console.log('🔗 Gerando link de redefinição para usuário:', finalUserId)

    if (!finalUserId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Erro de configuração do sistema' },
        { status: 500 }
      )
    }

    // Buscar dados do usuário
    const { data: usuario, error: usuarioError } = await adminClient
      .from('usuarios_bar')
      .select('email, nome')
      .eq('id', finalUserId)
      .single()

    if (usuarioError || !usuario) {
      console.error('❌ Usuário não encontrado:', usuarioError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar token temporário (simples, baseado em timestamp)
    const token = Buffer.from(`${usuario.email}:${Date.now()}`).toString('base64')

    // Detectar automaticamente o domínio baseado no request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    
    let baseUrl
    if (host?.includes('vercel.app') || host?.includes('sgbv2')) {
      baseUrl = `${protocol}://${host}`
    } else if (host?.includes('localhost')) {
      baseUrl = `http://${host}`
    } else {
      // Fallback para produção
      baseUrl = 'https://sgbv2.vercel.app'
    }

    const linkRedefinicao = `${baseUrl}/redefinir-senha?email=${encodeURIComponent(usuario.email)}&token=${token}`

    console.log('✅ Link gerado com sucesso:', linkRedefinicao)

    return NextResponse.json({
      success: true,
      link: linkRedefinicao,
      email: usuario.email,
      nome: usuario.nome,
      message: `Link de redefinição gerado para ${usuario.nome}`
    })

  } catch (error) {
    console.error('🔥 Erro inesperado:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 