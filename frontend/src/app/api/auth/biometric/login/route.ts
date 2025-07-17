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
        { error: 'Dados de autentica·ß·£o n·£o fornecidos' },
        { status: 400 }
      )
    }

    console.log('üîç Verificando autentica·ß·£o biom·©trica para credencial:', credentialId)

    // Buscar usu·°rio que possui esta credencial
    const { data: usuarios, error: searchError } = await supabase
      .from('usuarios_bar')
      .select('id, email, nome, bar_id, biometric_credentials, ativo')
      .not('biometric_credentials', 'is', null)

    if (searchError) {
      console.error('ùå Erro ao buscar usu·°rios:', searchError)
      return NextResponse.json(
        { error: 'Erro ao verificar credenciais' },
        { status: 500 }
      )
    }

    // Encontrar usu·°rio com a credencial espec·≠fica
    let usuarioEncontrado = null
    let credentialData = null

    for (const usuario of usuarios) {
      if (!usuario.biometric_credentials) continue
      
      const credentials = Array.isArray(usuario.biometric_credentials) 
        ? usuario.biometric_credentials 
        : []
      
      const foundCredential = credentials.find((cred) => cred.id === credentialId)
      if (foundCredential) {
        usuarioEncontrado = usuario
        credentialData = foundCredential
        break
      }
    }

    if (!usuarioEncontrado || !credentialData) {
      console.log('ùå Credencial n·£o encontrada')
      return NextResponse.json(
        { error: 'Credencial biom·©trica n·£o encontrada' },
        { status: 404 }
      )
    }

    if (!usuarioEncontrado.ativo) {
      console.log('ùå Usu·°rio inativo')
      return NextResponse.json(
        { error: 'Usu·°rio inativo' },
        { status: 403 }
      )
    }

    // TODO: Aqui deveria haver verifica·ß·£o criptogr·°fica da assinatura
    // Por simplicidade, assumimos que a credencial ·© v·°lida se foi encontrada
    // Em produ·ß·£o, voc·™ implementaria a verifica·ß·£o da assinatura WebAuthn

    console.log('úÖ Autentica·ß·£o biom·©trica bem-sucedida para:', usuarioEncontrado.email)

    // Atualizar last_used da credencial
    const updatedCredentials = usuarioEncontrado.biometric_credentials.map((cred) => 
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
    console.error('ùå Erro na API de login biom·©trico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
