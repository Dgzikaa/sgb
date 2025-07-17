import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// Ã°Å¸â€œâ€¹ API PARA COPIAR ITENS ENTRE CHECKLISTS
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃ¡Â§Ã¡Â£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ¡Â£o autorizado' }, { status: 401 })
    }

    const { targetChecklistId, items } = await req.json()

    if (!targetChecklistId || !items || !Array.isArray(items)) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡Â¡lidos' 
      }, { status: 400 })
    }

    // Verificar se o checklist de destino existe e pertence ao usuÃ¡Â¡rio
    const { data: targetChecklist, error: checklistError } = await supabase
      .from('checklists')
      .select('id, titulo, user_id')
      .eq('id', targetChecklistId)
      .eq('user_id', user.id)
      .single()

    if (checklistError || !targetChecklist) {
      return NextResponse.json({ 
        error: 'Checklist de destino nÃ¡Â£o encontrado' 
      }, { status: 404 })
    }

    // Obter a prÃ¡Â³xima ordem disponÃ¡Â­vel no checklist de destino
    const { data: lastItem } = await supabase
      .from('checklist_items')
      .select('ordem')
      .eq('checklist_id', targetChecklistId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    let nextOrder = lastItem?.ordem ? lastItem.ordem + 1 : 1

    // Preparar itens para inserÃ¡Â§Ã¡Â£o
    const itemsToInsert = items.map((item) => ({
      checklist_id: targetChecklistId,
      titulo: item.titulo,
      tipo: item.tipo,
      obrigatorio: item.obrigatorio,
      secao: item.secao || null,
      placeholder: item.placeholder || null,
      descricao: item.descricao || null,
      ordem: nextOrder++,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Inserir itens
    const { data: insertedItems, error: insertError } = await supabase
      .from('checklist_items')
      .insert(itemsToInsert)
      .select()

    if (insertError) {
      console.error('Erro ao inserir itens:', insertError)
      return NextResponse.json({ 
        error: 'Erro ao copiar itens' 
      }, { status: 500 })
    }

    // Atualizar estatÃ¡Â­sticas do checklist de destino
    const { error: updateError } = await supabase
      .from('checklists')
      .update({
        total_itens: (targetChecklist.total_itens || 0) + itemsToInsert.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetChecklistId)

    if (updateError) {
      console.error('Erro ao atualizar estatÃ¡Â­sticas:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: `${itemsToInsert.length} itens copiados com sucesso`,
      targetChecklist: targetChecklist.titulo,
      copiedItems: insertedItems.length,
      items: insertedItems
    })

  } catch (error) {
    console.error('Erro ao copiar itens:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 

