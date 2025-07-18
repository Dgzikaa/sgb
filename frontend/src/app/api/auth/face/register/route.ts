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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('Ã°Å¸â€Â API de registro facial iniciada')
  
  try {
    const { descriptor, confidence, userEmail, barId } = await request.json()

    console.log('Ã°Å¸â€œÅ  Dados recebidos:', { 
      userEmail, 
      barId, 
      confidence,
      descriptorLength: descriptor?.length 
    })

    // Validar dados obrigatÃ¡Â³rios
    if (!descriptor || !userEmail || !barId) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatÃ¡Â³rios nÃ¡Â£o fornecidos' },
        { status: 400 }
      )
    }

    // Validar descriptor
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Descritor facial invÃ¡Â¡lido' },
        { status: 400 }
      )
    }

    // Validar confidence
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { success: false, error: 'ConfianÃ¡Â§a invÃ¡Â¡lida' },
        { status: 400 }
      )
    }

    console.log('Å“â€¦ ValidaÃ¡Â§Ã¡Âµes passaram')

    // Buscar usuÃ¡Â¡rio pelo email
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_bar')
      .select('user_id, id, nome')
      .eq('email', userEmail)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError) {
      console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado ou inativo' },
        { status: 404 }
      )
    }

    const usuario = usuarios[0]
    console.log('Ã°Å¸â€˜Â¤ UsuÃ¡Â¡rio encontrado:', usuario.nome)

    // Verificar se jÃ¡Â¡ existe face registrada para este usuÃ¡Â¡rio/bar
    const { data: existingFace, error: faceCheckError } = await supabase
      .from('face_descriptors')
      .select('id')
      .eq('user_id', usuario.user_id)
      .eq('bar_id', barId)
      .eq('active', true)

    if (faceCheckError) {
      console.error('ÂÅ’ Erro ao verificar face existente:', faceCheckError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingFace && existingFace.length > 0) {
      // Atualizar face existente
      console.log('Ã°Å¸â€â€ž Atualizando face existente')
      
      const { error: updateError } = await supabase
        .from('face_descriptors')
        .update({
          descriptor: descriptor,
          confidence_threshold: Math.max(0.6, confidence - 0.1), // Threshold ligeiramente menor que a confianÃ¡Â§a
          updated_at: new Date().toISOString()
        })
        .eq('user_id', usuario.user_id)
        .eq('bar_id', barId)

      if (updateError) {
        console.error('ÂÅ’ Erro ao atualizar face:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar registro facial' },
          { status: 500 }
        )
      }

      console.log('Å“â€¦ Face atualizada com sucesso')
    } else {
      // Criar nova face
      console.log('Å¾â€¢ Criando nova face')
      
      const { error: insertError } = await supabase
        .from('face_descriptors')
        .insert({
          user_id: usuario.user_id,
          bar_id: barId,
          descriptor: descriptor,
          confidence_threshold: Math.max(0.6, confidence - 0.1), // Threshold ligeiramente menor que a confianÃ¡Â§a
          active: true
        })

      if (insertError) {
        console.error('ÂÅ’ Erro ao inserir face:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erro ao registrar face' },
          { status: 500 }
        )
      }

      console.log('Å“â€¦ Face registrada com sucesso')
    }

    // Log de auditoria
    console.log(`Ã°Å¸Å½â€° REGISTRO FACIAL CONCLUÃ¡ÂDO: ${usuario.nome} (${userEmail}) - Bar ${barId}`)

    return NextResponse.json({
      success: true,
      message: 'Face registrada com sucesso',
      user: {
        nome: usuario.nome,
        email: userEmail
      }
    })

  } catch (error) {
    console.error('Ã°Å¸â€Â¥ Erro fatal na API de registro facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

