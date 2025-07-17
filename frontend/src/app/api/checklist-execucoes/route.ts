import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import DiscordChecklistService from '@/lib/discord-checklist-service'

// For·ßar renderiza·ß·£o din·¢mica devido ao uso de request.url
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      checklist_id,
      responsavel_id,
      tempo_execucao,
      total_itens,
      itens_ok,
      itens_problema,
      itens_na,
      observacoes_gerais,
      respostas,
      bar_id
    } = body

    // Valida·ß·µes b·°sicas
    if (!checklist_id || !responsavel_id || !bar_id) {
      return NextResponse.json({
        error: 'Dados obrigat·≥rios: checklist_id, responsavel_id, bar_id'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Criar registro de execu·ß·£o
    const { data: execucao, error: execucaoError } = await supabase
      .from('checklist_execucoes')
      .insert({
        checklist_id,
        responsavel_id,
        status: 'concluido',
        concluido_em: new Date().toISOString(),
        tempo_execucao,
        total_itens: total_itens || 0,
        itens_ok: itens_ok || 0,
        itens_problema: itens_problema || 0,
        itens_na: itens_na || 0,
        observacoes_gerais,
        bar_id,
        dispositivo_info: {
          user_agent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (execucaoError) {
      console.error('ùå Erro ao criar execu·ß·£o:', execucaoError)
      return NextResponse.json({
        error: 'Erro ao salvar execu·ß·£o do checklist',
        details: execucaoError.message
      }, { status: 500 })
    }

    console.log('úÖ Execu·ß·£o criada:', execucao.id)

    // 2. Salvar respostas individuais
    if (respostas && Array.isArray(respostas) && respostas.length > 0) {
      const respostasFormatadas = respostas.map((resposta) => ({
        execucao_id: execucao.id,
        item_id: resposta.item_id,
        valor: resposta.valor,
        observacoes: resposta.observacoes,
        arquivos: resposta.arquivos || [],
        status: resposta.status || 'ok'
      }))

      const { error: respostasError } = await supabase
        .from('checklist_respostas')
        .insert(respostasFormatadas)

      if (respostasError) {
        console.error('ùå Erro ao salvar respostas:', respostasError)
        // N·£o falhar a opera·ß·£o se s·≥ as respostas deram erro
      } else {
        console.log(`úÖ ${respostasFormatadas.length} respostas salvas`)
      }
    }

    // 3. Calcular nota geral usando sistema inteligente
    let scoreResult = null
    try {
      const { calcularScoreFinal } = await import('@/lib/checklist-scoring')
      const mockExecucao = {
        respostas: { secoes: respostas.map((r) => ({ itens: [r] })) },
        estrutura_checklist: { secoes: [] } // Estrutura simplificada para compatibilidade
      }
      scoreResult = calcularScoreFinal(mockExecucao)
      
      // Atualizar execu·ß·£o com score calculado
      const { error: scoreError } = await supabase
        .from('checklist_execucoes')
        .update({
          score_final: scoreResult.score_total,
          score_detalhado: scoreResult,
          categoria_score: scoreResult.categoria
        })
        .eq('id', execucao.id)

      if (scoreError) {
        console.error('ùå Erro ao salvar score:', scoreError)
      } else {
        console.log(`úÖ Score calculado: ${scoreResult.score_total}/100 (${scoreResult.categoria})`)
      }
    } catch (scoreError) {
      console.error('ùå Erro no c·°lculo de score:', scoreError)
    }

    // 4. üî• ENVIAR NOTIFICA·á·ÉO DISCORD DE CONCLUS·ÉO
    try {
      // Buscar dados do checklist e usu·°rio para notifica·ß·£o completa
      const { data: checklistData } = await supabase
        .from('checklists')
        .select('nome, categoria, setor')
        .eq('id', checklist_id)
        .single()

      const { data: userData } = await supabase
        .from('usuarios_bar')
        .select('nome')
        .eq('id', responsavel_id)
        .single()

      if (checklistData && userData) {
        const executionNotification = {
          id: execucao.id,
          checklist_id: checklist_id,
          titulo: checklistData.nome || 'Checklist',
          responsavel: userData.nome || 'Usu·°rio',
          setor: checklistData.setor || 'N·£o informado',
          tempo_execucao: tempo_execucao || 0,
          total_itens: total_itens || 0,
          itens_ok: itens_ok || 0,
          itens_problema: itens_problema || 0,
          status: 'concluido',
          observacoes_gerais: observacoes_gerais || '',
          concluido_em: execucao.concluido_em,
          pontuacao_final: scoreResult?.score_total || null
        }

        await DiscordChecklistService.sendCompletion(executionNotification)
        console.log(`üéØ Notifica·ß·£o Discord enviada: ${checklistData.nome} conclu·≠do por ${userData.nome}`)
      }
    } catch (discordError) {
      console.error('ùå Erro ao enviar notifica·ß·£o Discord:', discordError)
      // N·£o falhar a opera·ß·£o se s·≥ o Discord der erro
    }

    return NextResponse.json({
      success: true,
      execucao_id: execucao.id,
      message: 'Checklist enviado com sucesso!',
      discord_notification: true
    })

  } catch (error) {
    console.error('ùå Erro na API checklist-execucoes:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')
    const responsavel_id = searchParams.get('responsavel_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!bar_id) {
      return NextResponse.json({
        error: 'Par·¢metro bar_id ·© obrigat·≥rio'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklists:checklist_id (
          nome,
          descricao,
          setor,
          tipo
        ),
        usuarios_bar:responsavel_id (
          nome,
          email
        )
      `)
      .eq('bar_id', bar_id)
      .order('concluido_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (responsavel_id) {
      query = query.eq('responsavel_id', responsavel_id)
    }

    const { data: execucoes, error } = await query

    if (error) {
      console.error('ùå Erro ao buscar execu·ß·µes:', error)
      return NextResponse.json({
        error: 'Erro ao buscar execu·ß·µes',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      execucoes: execucoes || [],
      total: execucoes?.length || 0
    })

  } catch (error) {
    console.error('ùå Erro na API GET checklist-execucoes:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 })
  }
} 
