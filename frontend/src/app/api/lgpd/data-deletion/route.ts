import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃ¡Â§Ã¡Â£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ¡Â£o autorizado' }, { status: 401 })
    }

    // Log inicial da solicitaÃ¡Â§Ã¡Â£o de exclusÃ¡Â£o
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

    // Å¡Â Ã¯Â¸Â PROCESSO DE EXCLUSÃ¡Æ’O IRREVERSÃ¡ÂVEL Å¡Â Ã¯Â¸Â
    
    console.log(`Ã°Å¸Å¡Â¨ INICIANDO EXCLUSÃ¡Æ’O COMPLETA DE DADOS - UsuÃ¡Â¡rio: ${user.id}`)

    const deletionResults = {
      deletedTables: [] as string[],
      errors: [] as string[]
    };

    // 1. Excluir configuraÃ¡Â§Ã¡Âµes LGPD
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

    // 2. Excluir configuraÃ¡Â§Ã¡Âµes do usuÃ¡Â¡rio
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

    // 3. Excluir histÃ¡Â³rico de login
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

    // 4. Excluir execuÃ¡Â§Ã¡Âµes de checklist
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

    // 5. Excluir notificaÃ¡Â§Ã¡Âµes
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

    // 7. Remover associaÃ¡Â§Ã¡Âµes com bars (mas manter histÃ¡Â³rico anÃ¡Â´nimo se necessÃ¡Â¡rio)
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
      // Exemplo: checklist_templates criados pelo usuÃ¡Â¡rio (manter anÃ¡Â´nimo)
      const { error } = await supabase
        .from('checklist_templates')
        .update({ 
          created_by: '00000000-0000-0000-0000-000000000000', // UUID anÃ¡Â´nimo
          creator_name: 'UsuÃ¡Â¡rio Removido'
        })
        .eq('created_by', user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('checklist_templates (anonimizados)')
    } catch (error) {
      deletionResults.errors.push(`checklist_templates anonimization: ${error}`)
    }

    // 9. Log final da exclusÃ¡Â£o (mantido para auditoria legal)
    try {
      await supabase
        .from('lgpd_audit_log')
        .insert({
          user_id: user.id, // Ã¡Å¡ltima vez que serÃ¡Â¡ registrado
          action: 'data_deletion_completed',
          details: deletionResults,
          ip_address: getClientIP(request),
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date()
        })
    } catch (error) {
      console.error('Erro ao registrar log final:', error)
    }

    // 10. Excluir perfil do usuÃ¡Â¡rio (por Ã¡Âºltimo)
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

    // 11. Excluir conta de autenticaÃ¡Â§Ã¡Â£o (Supabase Auth)
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) throw error
      deletionResults.deletedTables.push('auth.users')
    } catch (error) {
      deletionResults.errors.push(`auth.users: ${error}`)
    }

    console.log(`Å“â€¦ EXCLUSÃ¡Æ’O CONCLUÃ¡ÂDA - UsuÃ¡Â¡rio: ${user.id}`, deletionResults)

    // Resposta final
    return NextResponse.json({
      success: true,
      message: 'Todos os seus dados foram excluÃ¡Â­dos permanentemente conforme a LGPD',
      deletedAt: new Date(),
      deletedTables: deletionResults.deletedTables,
      errors: deletionResults.errors.length > 0 ? deletionResults.errors : undefined
    })

  } catch (error) {
    console.error('ERRO CRÃ¡ÂTICO na exclusÃ¡Â£o de dados:', error)
    
    // Log de erro crÃ¡Â­tico
    try {
      const supabase = createRouteHandlerClient({ cookies })
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
        error: 'Erro crÃ¡Â­tico durante exclusÃ¡Â£o de dados',
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

