import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, userIds, data = {} } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: 'Aá§á£o e IDs dos usuá¡rios sá£o obrigatá³rios' 
      }, { status: 400 })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Executar aá§á£o em lote
    switch (action) {
      case 'delete':
        for (const userId of userIds) {
          try {
            const { error } = await supabase
              .from('usuarios')
              .delete()
              .eq('id', userId)

            if (error) throw error
            
            results.push({ id: userId, success: true })
            successCount++
          } catch (error) {
            results.push({ 
              id: userId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Erro desconhecido' 
            })
            errorCount++
          }
        }
        break

      case 'activate':
        try {
          const { error } = await supabase
            .from('usuarios')
            .update({ ativo: true, updated_at: new Date().toISOString() })
            .in('id', userIds)

          if (error) throw error
          
          results.push({ success: true, affected: userIds.length })
          successCount = userIds.length
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          })
          errorCount = userIds.length
        }
        break

      case 'deactivate':
        try {
          const { error } = await supabase
            .from('usuarios')
            .update({ ativo: false, updated_at: new Date().toISOString() })
            .in('id', userIds)

          if (error) throw error
          
          results.push({ success: true, affected: userIds.length })
          successCount = userIds.length
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          })
          errorCount = userIds.length
        }
        break

      case 'update_role':
        if (!data.role) {
          return NextResponse.json({ 
            error: 'Papel (role) á© obrigatá³rio para esta aá§á£o' 
          }, { status: 400 })
        }

        try {
          const { error } = await supabase
            .from('usuarios')
            .update({ 
              role: data.role, 
              updated_at: new Date().toISOString() 
            })
            .in('id', userIds)

          if (error) throw error
          
          results.push({ success: true, affected: userIds.length })
          successCount = userIds.length
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          })
          errorCount = userIds.length
        }
        break

      case 'update_bar':
        if (!data.bar_id) {
          return NextResponse.json({ 
            error: 'ID do bar á© obrigatá³rio para esta aá§á£o' 
          }, { status: 400 })
        }

        try {
          const { error } = await supabase
            .from('usuarios')
            .update({ 
              bar_id: data.bar_id, 
              updated_at: new Date().toISOString() 
            })
            .in('id', userIds)

          if (error) throw error
          
          results.push({ success: true, affected: userIds.length })
          successCount = userIds.length
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          })
          errorCount = userIds.length
        }
        break

      case 'export':
        try {
          const { data: users, error } = await supabase
            .from('usuarios')
            .select(`
              id,
              nome,
              email,
              role,
              ativo,
              created_at,
              bars (nome)
            `)
            .in('id', userIds)

          if (error) throw error

          // Preparar dados para exportaá§á£o
          const exportData = users.map((user) => ({
            'ID': user.id,
            'Nome': user.nome,
            'Email': user.email,
            'Papel': user.role,
            'Ativo': user.ativo ? 'Sim' : 'Ná£o',
            'Bar': user.bars?.nome || 'N/A',
            'Criado em': new Date(user.created_at).toLocaleDateString('pt-BR')
          }))

          return NextResponse.json({
            success: true,
            data: exportData,
            filename: `usuarios_${new Date().toISOString().split('T')[0]}.csv`
          })
        } catch (error) {
          return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Erro ao exportar' 
          }, { status: 500 })
        }

      default:
        return NextResponse.json({ 
          error: `Aá§á£o '${action}' ná£o suportada` 
        }, { status: 400 })
    }

    // Log da operaá§á£o
    console.log(`Bulk operation ${action}:`, {
      total: userIds.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: userIds.length,
        success: successCount,
        errors: errorCount,
        action
      }
    })

  } catch (error) {
    console.error('Erro na operaá§á£o em lote:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// GET para listar aá§áµes disponá­veis
export async function GET() {
  return NextResponse.json({
    actions: [
      {
        id: 'delete',
        label: 'Excluir usuá¡rios',
        description: 'Remove permanentemente os usuá¡rios selecionados',
        requiresConfirmation: true,
        destructive: true
      },
      {
        id: 'activate',
        label: 'Ativar usuá¡rios',
        description: 'Ativa os usuá¡rios selecionados',
        requiresConfirmation: false
      },
      {
        id: 'deactivate',
        label: 'Desativar usuá¡rios',
        description: 'Desativa os usuá¡rios selecionados',
        requiresConfirmation: true
      },
      {
        id: 'update_role',
        label: 'Alterar papel',
        description: 'Altera o papel dos usuá¡rios selecionados',
        requiresData: ['role'],
        requiresConfirmation: true
      },
      {
        id: 'update_bar',
        label: 'Alterar bar',
        description: 'Altera o bar dos usuá¡rios selecionados',
        requiresData: ['bar_id'],
        requiresConfirmation: true
      },
      {
        id: 'export',
        label: 'Exportar usuá¡rios',
        description: 'Exporta dados dos usuá¡rios selecionados',
        requiresConfirmation: false
      }
    ]
  })
} 
