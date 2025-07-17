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
  console.log('ðŸ” API de status facial iniciada')
  
  try {
    const { email, barId } = await request.json()

    console.log('ðŸ“Š Verificando status facial:', { email, barId })

    // Validar dados obrigatá³rios
    if (!email || !barId) {
      return NextResponse.json(
        { success: false, error: 'Email e barId sá£o obrigatá³rios' },
        { status: 400 }
      )
    }

    // Buscar usuá¡rio pelo email
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_bar')
      .select('user_id, nome')
      .eq('email', email)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError) {
      console.error('Œ Erro ao buscar usuá¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuá¡rio ná£o encontrado' },
        { status: 404 }
      )
    }

    const usuario = usuarios[0]

    // Verificar se existe registro facial ativo
    const { data: faceRecord, error: faceError } = await supabase
      .from('face_descriptors')
      .select('id, created_at: any, updated_at')
      .eq('user_id', usuario.user_id)
      .eq('bar_id', barId)
      .eq('active', true)

    if (faceError) {
      console.error('Œ Erro ao verificar registro facial:', faceError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const faceRegistered = faceRecord && faceRecord.length > 0
    
    console.log(`œ… Status verificado para ${usuario.nome}: ${faceRegistered ? 'Registrado' : 'Ná£o registrado'}`)

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

  } catch (error: any) {
    console.error('ðŸ”¥ Erro fatal na API de status facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
