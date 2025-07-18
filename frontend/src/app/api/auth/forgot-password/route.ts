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

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-mail Ã¡Â© obrigatÃ¡Â³rio' 
      }, { status: 400 })
    }

    // Verificar se o usuÃ¡Â¡rio existe na tabela usuario_bares
    const { data: user, error: userError } = await supabase
      .from('usuario_bares')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'E-mail nÃ¡Â£o encontrado em nosso sistema' 
      }, { status: 404 })
    }

    // Gerar token de redefiniÃ¡Â§Ã¡Â£o de senha
    const resetToken = crypto.randomUUID()
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Expira em 1 hora

    // Salvar token no banco
    const { error: updateError } = await supabase
      .from('usuario_bares')
      .update({ 
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao salvar token:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    // Enviar e-mail de recuperaÃ¡Â§Ã¡Â£o (usando Supabase Auth)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/redefinir-senha?token=${resetToken}&email=${encodeURIComponent(email)}`
    })

    if (authError) {
      console.error('Erro ao enviar e-mail:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar e-mail de recuperaÃ¡Â§Ã¡Â£o' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'E-mail de recuperaÃ¡Â§Ã¡Â£o enviado com sucesso' 
    })

  } catch (error) {
    console.error('Erro na recuperaÃ¡Â§Ã¡Â£o de senha:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 

