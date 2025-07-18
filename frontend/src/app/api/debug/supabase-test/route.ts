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
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€Â Testando configuraÃ¡Â§Ã¡Â£o do Supabase...')
    
    // Verificar variÃ¡Â¡veis de ambiente
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'NÃ¡Â£o configurada',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'NÃ¡Â£o configurada',
      SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY ? 'Configurada' : 'NÃ¡Â£o configurada'
    }
    
    console.log('Ã°Å¸â€Â VariÃ¡Â¡veis de ambiente:', envCheck)
    
    // Testar cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
      console.log('Å“â€¦ Cliente administrativo criado com sucesso')
    } catch (adminError) {
      console.error('ÂÅ’ Erro ao criar cliente administrativo:', adminError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar cliente administrativo',
        details: adminError instanceof Error ? adminError.message : 'Erro desconhecido',
        envCheck
      }, { status: 500 })
    }
    
    // Testar conexÃ¡Â£o com banco
    try {
      const { data, error } = await adminClient
        .from('usuarios_bar')
        .select('id, nome, email')
        .limit(1)
      
      if (error) {
        console.error('ÂÅ’ Erro ao conectar com banco:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao conectar com banco',
          details: error.message,
          envCheck
        }, { status: 500 })
      }
      
      console.log('Å“â€¦ ConexÃ¡Â£o com banco funcionando')
      
      return NextResponse.json({
        success: true,
        message: 'ConfiguraÃ¡Â§Ã¡Â£o do Supabase estÃ¡Â¡ funcionando corretamente',
        envCheck,
        testQuery: {
          success: true,
          recordCount: data?.length || 0
        }
      })
      
    } catch (dbError) {
      console.error('ÂÅ’ Erro na query de teste:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro na query de teste',
        details: dbError instanceof Error ? dbError.message : 'Erro desconhecido',
        envCheck
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('ÂÅ’ Erro geral no teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral no teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

