import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { credentialId, publicKey, userEmail, barId } = await request.json()

    if (!credentialId || !publicKey || !userEmail || !barId) {
      return NextResponse.json(
        { error: 'Dados obrigatá³rios ná£o fornecidos' },
        { status: 400 }
      )
    }

    console.log('ðŸ“ Registrando credencial biomá©trica para:', userEmail)

    // Buscar usuá¡rio na tabela usuarios_bar
    const { data: usuario, error: userError } = await supabase
      .from('usuarios_bar')
      .select('id, biometric_credentials')
      .eq('email', userEmail)
      .eq('bar_id', barId)
      .single()

    if (userError || !usuario) {
      console.error('Œ Usuá¡rio ná£o encontrado:', userError)
      return NextResponse.json(
        { error: 'Usuá¡rio ná£o encontrado' },
        { status: 404 }
      )
    }

    // Preparar nova credencial
    const newCredential = {
      id: credentialId,
      publicKey: publicKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }
    }

    // Pegar credenciais existentes ou criar array vazio
    const existingCredentials = usuario.biometric_credentials || []
    
    // Verificar se credencial já¡ existe
    const credentialExists = existingCredentials.some((cred: any) => cred.id === credentialId)
    if (credentialExists) {
      return NextResponse.json(
        { error: 'Credencial biomá©trica já¡ está¡ registrada' },
        { status: 409 }
      )
    }

    // Adicionar nova credencial ao array
    const updatedCredentials = [...existingCredentials, newCredential]

    // Atualizar usuá¡rio com nova credencial
    const { data, error } = await supabase
      .from('usuarios_bar')
      .update({ 
        biometric_credentials: updatedCredentials,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', usuario.id)
      .select('id, email, biometric_credentials')
      .single()

    if (error) {
      console.error('Œ Erro ao salvar credencial:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar credencial biomá©trica' },
        { status: 500 }
      )
    }

    console.log('œ… Credencial biomá©trica registrada com sucesso para usuá¡rio:', data.id)

    return NextResponse.json({
      success: true,
      message: 'Biometria registrada com sucesso',
      credentialId: credentialId,
      totalCredentials: data.biometric_credentials?.length || 0
    })

  } catch (error) {
    console.error('Œ Erro na API de registro biomá©trico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
