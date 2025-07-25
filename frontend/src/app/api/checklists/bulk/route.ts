import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action, checklistIds, data = {} } = await request.json();

    if (
      !action ||
      !checklistIds ||
      !Array.isArray(checklistIds) ||
      checklistIds.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Ação e IDs dos checklists são obrigatórios',
        },
        { status: 400 }
      );
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    switch (action) {
      case 'delete':
        for (const checklistId of checklistIds) {
          try {
            // Verificar se há execuções pendentes
            const { data: execucoes, error: execError } = await supabase
              .from('checklist_execucoes')
              .select('id')
              .eq('checklist_id', checklistId)
              .eq('status', 'em_andamento');

            if (execError) throw execError;

            if (execucoes && execucoes.length > 0) {
              results.push({
                id: checklistId,
                success: false,
                error: 'Checklist possui execuções em andamento',
              });
              errorCount++;
              continue;
            }

            // Deletar checklist
            const { error } = await supabase
              .from('checklists')
              .delete()
              .eq('id', checklistId);

            if (error) throw error;

            results.push({ id: checklistId, success: true });
            successCount++;
          } catch (error) {
            results.push({
              id: checklistId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Erro desconhecido',
            });
            errorCount++;
          }
        }
        break;

      case 'activate':
        try {
          const { error } = await supabase
            .from('checklists')
            .update({ ativo: true, updated_at: new Date().toISOString() })
            .in('id', checklistIds);

          if (error) throw error;

          results.push({ success: true, affected: checklistIds.length });
          successCount = checklistIds.length;
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          errorCount = checklistIds.length;
        }
        break;

      case 'deactivate':
        try {
          const { error } = await supabase
            .from('checklists')
            .update({ ativo: false, updated_at: new Date().toISOString() })
            .in('id', checklistIds);

          if (error) throw error;

          results.push({ success: true, affected: checklistIds.length });
          successCount = checklistIds.length;
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          errorCount = checklistIds.length;
        }
        break;

      case 'duplicate':
        for (const checklistId of checklistIds) {
          try {
            // Buscar checklist original
            const { data: originalChecklist, error: fetchError } =
              await supabase
                .from('checklists')
                .select(
                  `
                nome,
                descricao,
                tipo,
                bar_id,
                agendamento_config,
                checklist_items (
                  nome,
                  descricao,
                  tipo,
                  obrigatorio,
                  ordem,
                  opcoes
                )
              `
                )
                .eq('id', checklistId)
                .single();

            if (fetchError) throw fetchError;

            // Criar cópia
            const { data: newChecklist, error: createError } = await supabase
              .from('checklists')
              .insert({
                nome: `${originalChecklist.nome} (Cópia)`,
                descricao: originalChecklist.descricao,
                tipo: originalChecklist.tipo,
                bar_id: originalChecklist.bar_id,
                agendamento_config: originalChecklist.agendamento_config,
                ativo: false, // Começar desativado
              })
              .select()
              .single();

            if (createError) throw createError;

            // Copiar itens
            if (originalChecklist.checklist_items?.length > 0) {
              const itemsToInsert = originalChecklist.checklist_items.map(
                (item: any) => ({
                  checklist_id: newChecklist.id,
                  nome: item.nome,
                  descricao: item.descricao,
                  tipo: item.tipo,
                  obrigatorio: item.obrigatorio,
                  ordem: item.ordem,
                  opcoes: item.opcoes,
                })
              );

              const { error: itemsError } = await supabase
                .from('checklist_items')
                .insert(itemsToInsert);

              if (itemsError) throw itemsError;
            }

            results.push({
              id: checklistId,
              success: true,
              newId: newChecklist.id,
              newName: newChecklist.nome,
            });
            successCount++;
          } catch (error) {
            results.push({
              id: checklistId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Erro desconhecido',
            });
            errorCount++;
          }
        }
        break;

      case 'update_bar':
        if (!data.bar_id) {
          return NextResponse.json(
            {
              error: 'ID do bar é obrigatório para esta ação',
            },
            { status: 400 }
          );
        }

        try {
          const { error } = await supabase
            .from('checklists')
            .update({
              bar_id: data.bar_id,
              updated_at: new Date().toISOString(),
            })
            .in('id', checklistIds);

          if (error) throw error;

          results.push({ success: true, affected: checklistIds.length });
          successCount = checklistIds.length;
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          errorCount = checklistIds.length;
        }
        break;

      case 'export':
        try {
          const { data: checklists, error } = await supabase
            .from('checklists')
            .select(
              `
              id,
              nome,
              descricao,
              tipo,
              ativo,
              created_at,
              bars (nome),
              checklist_items (
                nome,
                tipo,
                obrigatorio
              )
            `
            )
            .in('id', checklistIds);

          if (error) throw error;

          const exportData = checklists.map(checklist => ({
            ID: checklist.id,
            Nome: checklist.nome,
            Descrição: checklist.descricao,
            Tipo: checklist.tipo,
            Ativo: checklist.ativo ? 'Sim' : 'Não',
            Bar: checklist.bars?.[0]?.nome || 'N/A',
            'Total de Itens': checklist.checklist_items?.length || 0,
            'Itens Obrigatórios':
              checklist.checklist_items?.filter((item: any) => item.obrigatorio)
                .length || 0,
            'Criado em': new Date(checklist.created_at).toLocaleDateString(
              'pt-BR'
            ),
          }));

          return NextResponse.json({
            success: true,
            data: exportData,
            filename: `checklists_${new Date().toISOString().split('T')[0]}.csv`,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error:
                error instanceof Error ? error.message : 'Erro ao exportar',
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            error: `Ação '${action}' não suportada`,
          },
          { status: 400 }
        );
    }

    console.log(`Bulk checklist operation ${action}:`, {
      total: checklistIds.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: checklistIds.length,
        success: successCount,
        errors: errorCount,
        action,
      },
    });
  } catch (error) {
    console.error('Erro na operação em lote de checklists:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    actions: [
      {
        id: 'delete',
        label: 'Excluir checklists',
        description: 'Remove permanentemente os checklists selecionados',
        requiresConfirmation: true,
        destructive: true,
      },
      {
        id: 'activate',
        label: 'Ativar checklists',
        description: 'Ativa os checklists selecionados',
        requiresConfirmation: false,
      },
      {
        id: 'deactivate',
        label: 'Desativar checklists',
        description: 'Desativa os checklists selecionados',
        requiresConfirmation: true,
      },
      {
        id: 'duplicate',
        label: 'Duplicar checklists',
        description: 'Cria cópias dos checklists selecionados',
        requiresConfirmation: true,
      },
      {
        id: 'update_bar',
        label: 'Alterar bar',
        description: 'Altera o bar dos checklists selecionados',
        requiresData: ['bar_id'],
        requiresConfirmation: true,
      },
      {
        id: 'export',
        label: 'Exportar checklists',
        description: 'Exporta dados dos checklists selecionados',
        requiresConfirmation: false,
      },
    ],
  });
}
