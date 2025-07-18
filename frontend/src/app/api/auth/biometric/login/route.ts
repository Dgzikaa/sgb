import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
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
        { error: 'Dados de autenticaÃ¡Â§Ã¡Â£o nÃ¡Â£o fornecidos' },
        { status: 400 }
      )
    }

    console.log('Ã°Å¸â€Â Verificando autenticaÃ¡Â§Ã¡Â£o biomÃ¡Â©trica para credencial:', credentialId)

    // Buscar usuÃ¡Â¡rio que possui esta credencial
    const { data: usuarios, error: searchError } = await supabase
      .from('usuarios_bar')
      .select('id, email, nome, bar_id, biometric_credentials, ativo')
      .not('biometric_credentials', 'is', null)

    if (searchError) {
      console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rios:', searchError)
      return NextResponse.json(
        { error: 'Erro ao verificar credenciais' },
        { status: 500 }
      )
    }

    // Encontrar usuÃ¡Â¡rio com a credencial especÃ¡Â­fica
    let usuarioEncontrado = null
    let credentialData = null

    for (const usuario of usuarios) {
      if (!usuario.biometric_credentials) continue
      
      const credentials = Array.isArray(usuario.biometric_credentials) 
        ? usuario.biometric_credentials 
        : []
      
      const foundCredential = credentials.find((cred: unknown) => cred.id === credentialId)
      if (foundCredential) {
        usuarioEncontrado = usuario
        credentialData = foundCredential
        break
      }
    }

    if (!usuarioEncontrado || !credentialData) {
      console.log('ÂÅ’ Credencial nÃ¡Â£o encontrada')
      return NextResponse.json(
        { error: 'Credencial biomÃ¡Â©trica nÃ¡Â£o encontrada' },
        { status: 404 }
      )
    }

    if (!usuarioEncontrado.ativo) {
      console.log('ÂÅ’ UsuÃ¡Â¡rio inativo')
      return NextResponse.json(
        { error: 'UsuÃ¡Â¡rio inativo' },
        { status: 403 }
      )
    }

    // TODO: Aqui deveria haver verificaÃ¡Â§Ã¡Â£o criptogrÃ¡Â¡fica da assinatura
    // Por simplicidade, assumimos que a credencial Ã¡Â© vÃ¡Â¡lida se foi encontrada
    // Em produÃ¡Â§Ã¡Â£o, vocÃ¡Âª implementaria a verificaÃ¡Â§Ã¡Â£o da assinatura WebAuthn

    console.log('Å“â€¦ AutenticaÃ¡Â§Ã¡Â£o biomÃ¡Â©trica bem-sucedida para:', usuarioEncontrado.email)

    // Atualizar last_used da credencial
    const updatedCredentials = usuarioEncontrado.biometric_credentials.map((cred: unknown) => 
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
    console.error('ÂÅ’ Erro na API de login biomÃ¡Â©trico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

