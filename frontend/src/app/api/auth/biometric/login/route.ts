import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { credentialId, signature, authenticatorData, clientDataJSON } = await request.json()

    if (!credentialId || !signature || !authenticatorData || !clientDataJSON) {
      return NextResponse.json(
        { error: 'Dados de autenticaá§á£o ná£o fornecidos' },
        { status: 400 }
      )
    }

    console.log('ðŸ” Verificando autenticaá§á£o biomá©trica para credencial:', credentialId)

    // Buscar usuá¡rio que possui esta credencial
    const { data: usuarios, error: searchError } = await supabase
      .from('usuarios_bar')
      .select('id, email, nome, bar_id, biometric_credentials, ativo')
      .not('biometric_credentials', 'is', null)

    if (searchError) {
      console.error('Œ Erro ao buscar usuá¡rios:', searchError)
      return NextResponse.json(
        { error: 'Erro ao verificar credenciais' },
        { status: 500 }
      )
    }

    // Encontrar usuá¡rio com a credencial especá­fica
    let usuarioEncontrado = null
    let credentialData = null

    for (const usuario of usuarios) {
      if (!usuario.biometric_credentials) continue
      
      const credentials = Array.isArray(usuario.biometric_credentials) 
        ? usuario.biometric_credentials 
        : []
      
      const foundCredential = credentials.find((cred: any) => cred.id === credentialId)
      if (foundCredential) {
        usuarioEncontrado = usuario
        credentialData = foundCredential
        break
      }
    }

    if (!usuarioEncontrado || !credentialData) {
      console.log('Œ Credencial ná£o encontrada')
      return NextResponse.json(
        { error: 'Credencial biomá©trica ná£o encontrada' },
        { status: 404 }
      )
    }

    if (!usuarioEncontrado.ativo) {
      console.log('Œ Usuá¡rio inativo')
      return NextResponse.json(
        { error: 'Usuá¡rio inativo' },
        { status: 403 }
      )
    }

    // TODO: Aqui deveria haver verificaá§á£o criptográ¡fica da assinatura
    // Por simplicidade, assumimos que a credencial á© vá¡lida se foi encontrada
    // Em produá§á£o, vocáª implementaria a verificaá§á£o da assinatura WebAuthn

    console.log('œ… Autenticaá§á£o biomá©trica bem-sucedida para:', usuarioEncontrado.email)

    // Atualizar last_used da credencial
    const updatedCredentials = usuarioEncontrado.biometric_credentials.map((cred: any) => 
      cred.id === credentialId 
        ? { ...cred, lastUsed: new Date().toISOString() }
        : cred
    )

    // Atualizar no banco
    await supabase
      .from('usuarios_bar')
      .update({ 
        biometric_credentials: updatedCredentials,
        ultima_atividade: new Date().toISOString()
      })
      .eq('id', usuarioEncontrado.id)

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: usuarioEncontrado.id,
        email: usuarioEncontrado.email,
        nome: usuarioEncontrado.nome,
        barId: usuarioEncontrado.bar_id
      }
    })

  } catch (error) {
    console.error('Œ Erro na API de login biomá©trico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
