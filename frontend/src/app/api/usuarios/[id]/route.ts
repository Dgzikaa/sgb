import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar usuário específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario
    })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar dados do usuário (incluindo celular)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    
    // Validar celular se fornecido
    if (body.celular) {
      const celularNumbers = body.celular.replace(/\D/g, '')
      
      // Validação básica: 11 dígitos, DDD válido, terceiro dígito 9
      if (celularNumbers.length !== 11) {
        return NextResponse.json(
          { success: false, error: 'Celular deve ter 11 dígitos' },
          { status: 400 }
        )
      }
      
      const ddd = parseInt(celularNumbers.substring(0, 2))
      if (ddd < 11 || ddd > 99) {
        return NextResponse.json(
          { success: false, error: 'DDD inválido' },
          { status: 400 }
        )
      }
      
      if (celularNumbers[2] !== '9') {
        return NextResponse.json(
          { success: false, error: 'Terceiro dígito deve ser 9 (celular)' },
          { status: 400 }
        )
      }
      
      body.celular = celularNumbers // Salvar apenas números
    }

    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario,
      message: 'Usuário atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
} 