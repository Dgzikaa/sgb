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
  console.log('ðŸ—‘ï¸ API de remoÃ§Ã£o facial iniciada')
  
  try {
    const { email, barId } = await request.json()

    console.log('ðŸ“Š Removendo registro facial:', { email, barId })

    // Validar dados obrigatÃ³rios
    if (!email || !barId) {
      return NextResponse.json(
        { success: false, error: 'Email e barId sÃ£o obrigatÃ³rios' },
        { status: 400 }
      )
    }

    // Buscar usuÃ¡rio pelo email
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_bar')
      .select('user_id, nome')
      .eq('email', email)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError) {
      console.error('âŒ Erro ao buscar usuÃ¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡rio nÃ£o encontrado' },
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
      console.error('âŒ Erro ao verificar registro facial:', faceCheckError)
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
      console.error('âŒ Erro ao remover registro facial:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao remover registro facial' },
        { status: 500 }
      )
    }

    console.log(`âœ… Registro facial removido para ${usuario.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Registro facial removido com sucesso',
      user: {
        nome: usuario.nome,
        email
      }
    })

  } catch (error: any) {
    console.error('ðŸ”¥ Erro fatal na API de remoÃ§Ã£o facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
