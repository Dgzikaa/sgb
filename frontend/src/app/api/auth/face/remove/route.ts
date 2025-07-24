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
  console.log('🗑️ API de remoção facial iniciada')
  
  try {
    const { email, barId } = await request.json()

    console.log('📊 Removendo registro facial:', { email, barId })

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
    const { data: faceRecord, error: faceCheckError } = await supabase
      .from('face_descriptors')
      .select('id')
      .eq('user_id', usuario.user_id)
      .eq('bar_id', barId)
      .eq('active', true)

    if (faceCheckError) {
      console.error('❌ Erro ao verificar registro facial:', faceCheckError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!faceRecord || faceRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum registro facial encontrado' },
        { status: 404 }
      )
    }

    // Desativar o registro facial (soft delete)
    const { error: deleteError } = await supabase
      .from('face_descriptors')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', usuario.user_id)
      .eq('bar_id', barId)

    if (deleteError) {
      console.error('❌ Erro ao remover registro facial:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao remover registro facial' },
        { status: 500 }
      )
    }

    console.log(`✅ Registro facial removido para ${usuario.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Registro facial removido com sucesso',
      user: {
        nome: usuario.nome,
        email
      }
    })

  } catch (error: unknown) {
    console.error('🔥 Erro fatal na API de remoção facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
