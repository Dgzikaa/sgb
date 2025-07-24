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
  console.log('🔍 API de status facial iniciada')
  
  try {
    const { email, barId } = await request.json()

    console.log('📊 Verificando status facial:', { email, barId })

    // Validar dados obrigatórios
    if (!email || !barId) {
      return NextResponse.json(
        { success: false, error: 'Email e barId são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_bar')
      .select('user_id, nome')
      .eq('email', email)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
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
      console.error('❌ Erro ao verificar registro facial:', faceError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const faceRegistered = faceRecord && faceRecord.length > 0
    
    console.log(`✅ Status verificado para ${usuario.nome}: ${faceRegistered ? 'Registrado' : 'Não registrado'}`)

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

  } catch (error: unknown) {
    console.error('🔥 Erro fatal na API de status facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
