import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('Ã°Å¸â€Â API de status facial iniciada')
  
  try {
    const { email, barId } = await request.json()

    console.log('Ã°Å¸â€œÅ  Verificando status facial:', { email, barId })

    // Validar dados obrigatÃ¡Â³rios
    if (!email || !barId) {
      return NextResponse.json(
        { success: false, error: 'Email e barId sÃ¡Â£o obrigatÃ¡Â³rios' },
        { status: 400 }
      )
    }

    // Buscar usuÃ¡Â¡rio pelo email
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_bar')
      .select('user_id, nome')
      .eq('email', email)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError) {
      console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado' },
        { status: 404 }
      )
    }

    const usuario = usuarios[0]

    // Verificar se existe registro facial ativo
    const { data: faceRecord, error: faceError } = await supabase
      .from('face_descriptors')
      .select('id, created_at, updated_at')
      .eq('user_id', usuario.user_id)
      .eq('bar_id', barId)
      .eq('active', true)

    if (faceError) {
      console.error('ÂÅ’ Erro ao verificar registro facial:', faceError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const faceRegistered = faceRecord && faceRecord.length > 0
    
    console.log(`Å“â€¦ Status verificado para ${usuario.nome}: ${faceRegistered ? 'Registrado' : 'NÃ¡Â£o registrado'}`)

    return NextResponse.json({
      success: true,
      faceRegistered,
      user: {
        nome: usuario.nome,
        email
      },
      faceInfo: faceRegistered ? {
        registeredAt: faceRecord[0].created_at,
        lastUpdated: faceRecord[0].updated_at
      } : null
    })

  } catch (error) {
    console.error('Ã°Å¸â€Â¥ Erro fatal na API de status facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

