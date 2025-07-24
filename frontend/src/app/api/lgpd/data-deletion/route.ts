import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    // cookieStore removido - não utilizado
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Log inicial da solicitação de exclusão
    await supabase
      .from('lgpd_audit_log')
      .insert({
        user_id: user.id,
        action: 'data_deletion_requested',
        details: {
          requestedAt: new Date(),
          ipAddress: getClientIP(request),
          userEmail: user.email
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      })

    // ⚠️ PROCESSO DE EXCLUSÃO IRREVERSÍVEL ⚠️
    
    console.log(`🚨 INICIANDO EXCLUSÃO COMPLETA DE DADOS - Usuário: ${user.id}`)

    const deletionResults: {
      timestamp: Date;
      userId: string;
      email: string | undefined;
      deletedTables: string[];
      errors: string[];
    } = {
      timestamp: new Date(),
      userId: user.id,
      email: user.email,
      deletedTables: [],
      errors: []
    }

    // 1. Excluir configurações LGPD
    try {
      const { error } = await supabase
        .from('user_lgpd_settings')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('user_lgpd_settings')
    } catch (error) {
      deletionResults.errors.push(`user_lgpd_settings: ${error}`)
    }

    // 2. Excluir configurações do usuário
    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('user_settings')
    } catch (error) {
      deletionResults.errors.push(`user_settings: ${error}`)
    }

    // 3. Excluir histórico de login
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('user_sessions')
    } catch (error) {
      deletionResults.errors.push(`user_sessions: ${error}`)
    }

    // 4. Excluir execuções de checklist
    try {
      const { error } = await supabase
        .from('checklist_executions')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('checklist_executions')
    } catch (error) {
      deletionResults.errors.push(`checklist_executions: ${error}`)
    }

    // 5. Excluir notificações
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('notifications')
    } catch (error) {
      deletionResults.errors.push(`notifications: ${error}`)
    }

    // 6. Excluir uploads
    try {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('uploads')
    } catch (error) {
      deletionResults.errors.push(`uploads: ${error}`)
    }

    // 7. Remover associações com bars (mas manter histórico anônimo se necessário)
    try {
      const { error } = await supabase
        .from('user_bars')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('user_bars')
    } catch (error) {
      deletionResults.errors.push(`user_bars: ${error}`)
    }

    // 8. Anonimizar dados em tabelas que precisam manter integridade referencial
    try {
      // Exemplo: checklist_templates criados pelo usuário (manter anônimo)
      const { error } = await supabase
        .from('checklist_templates')
        .update({ 
          created_by: '00000000-0000-0000-0000-000000000000', // UUID anônimo
          creator_name: 'Usuário Removido'
        })
        .eq('created_by', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('checklist_templates (anonimizados)')
    } catch (error) {
      deletionResults.errors.push(`checklist_templates anonimization: ${error}`)
    }

    // 9. Log final da exclusão (mantido para auditoria legal)
    try {
      await supabase
        .from('lgpd_audit_log')
        .insert({
          user_id: user.id, // Última vez que será registrado
          action: 'data_deletion_completed',
          details: deletionResults,
          ip_address: getClientIP(request),
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date()
        })
    } catch (error) {
      console.error('Erro ao registrar log final:', error)
    }

    // 10. Excluir perfil do usuário (por último)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('profiles')
    } catch (error) {
      deletionResults.errors.push(`profiles: ${error}`)
    }

    // 11. Excluir conta de autenticação (Supabase Auth)
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('auth.users')
    } catch (error) {
      deletionResults.errors.push(`auth.users: ${error}`)
    }

    console.log(`✅ EXCLUSÃO CONCLUÍDA - Usuário: ${user.id}`, deletionResults)

    // Resposta final
    return NextResponse.json({
      success: true,
      message: 'Todos os seus dados foram excluídos permanentemente conforme a LGPD',
      deletedAt: new Date(),
      deletedTables: deletionResults.deletedTables,
      errors: deletionResults.errors.length > 0 ? deletionResults.errors : undefined
    })

  } catch (error) {
    console.error('ERRO CRÍTICO na exclusão de dados:', error)
    
    // Log de erro crítico
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false
          }
        }
      )
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('lgpd_audit_log')
          .insert({
            user_id: user.id,
            action: 'data_deletion_failed',
            details: {
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              timestamp: new Date()
            },
            ip_address: getClientIP(request),
            user_agent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date()
          })
      }
    } catch (logError) {
      console.error('Erro ao registrar falha:', logError)
    }

    return NextResponse.json(
      { 
        error: 'Erro crítico durante exclusão de dados',
        message: 'Entre em contato com o DPO imediatamente',
        timestamp: new Date()
      }, 
      { status: 500 }
    )
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
} 
