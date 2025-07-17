import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import DiscordChecklistService from '@/lib/discord-checklist-service'

// ForÃ¡Â§ar renderizaÃ¡Â§Ã¡Â£o dinÃ¡Â¢mica devido ao uso de request.url
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

    // ValidaÃ¡Â§Ã¡Âµes bÃ¡Â¡sicas
    if (!checklist_id || !responsavel_id || !bar_id) {
      return NextResponse.json({
        error: 'Dados obrigatÃ³rios: checklist_id, responsavel_id, bar_id'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Criar registro de execuÃ§Ã£o
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
      console.error('ÂÅ’ Erro ao criar execuÃ§Ã£o:', execucaoError)
      return NextResponse.json({
        error: 'Erro ao salvar execuÃ§Ã£o do checklist',
        details: execucaoError.message
      }, { status: 500 })
    }

    console.log('Å“â€¦ ExecuÃ§Ã£o criada:', execucao.id)

    // 2. Salvar respostas individuais
    if (respostas && Array.isArray(respostas) && respostas.length > 0) {
      const respostasFormatadas = respostas.map((resposta: any) => ({
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
        console.error('ÂÅ’ Erro ao salvar respostas:', respostasError)
        // NÃ£o falhar a operaÃ§Ã£o se sÃ³ as respostas deram erro
      } else {
        console.log(`Å“â€¦ ${respostasFormatadas.length} respostas salvas`)
      }
    }

    // 3. Calcular nota geral usando sistema inteligente
    let scoreResult = null
    try {
      const { calcularScoreFinal } = await import('@/lib/checklist-scoring')
      const mockExecucao = {
        respostas: { secoes: respostas.map((r: any) => ({ itens: [r] })) },
        estrutura_checklist: { secoes: [] } // Estrutura simplificada para compatibilidade
      }
      scoreResult = calcularScoreFinal(mockExecucao)
      
      // Atualizar execuÃ§Ã£o com score calculado
      const { error: scoreError } = await supabase
        .from('checklist_execucoes')
        .update({
          score_final: scoreResult.score_total,
          score_detalhado: scoreResult,
          categoria_score: scoreResult.categoria
        })
        .eq('id', execucao.id)

      if (scoreError) {
        console.error('ÂÅ’ Erro ao salvar score:', scoreError)
      } else {
        console.log(`Å“â€¦ Score calculado: ${scoreResult.score_total}/100 (${scoreResult.categoria})`)
      }
    } catch (scoreError) {
      console.error('ÂÅ’ Erro no cÃ¡lculo de score:', scoreError)
    }

    // 4. Ã°Å¸â€Â¥ ENVIAR NOTIFICAÃ§Ã£O DISCORD DE CONCLUSÃ£O
    try {
      // Buscar dados do checklist e usuÃ¡rio para notificaÃ§Ã£o completa
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
          responsavel: userData.nome || 'UsuÃ¡rio',
          setor: checklistData.setor || 'NÃ£o informado',
          tempo_execucao: tempo_execucao || 0,
          total_itens: total_itens || 0,
          itens_ok: itens_ok || 0,
          itens_problema: itens_problema || 0,
          status: 'concluido',
          observacoes_gerais: observacoes_gerais || '',
          concluido_em: execucao.concluido_em,
          pontuacao_final: scoreResult?.score_total || undefined
        }

        await DiscordChecklistService.sendCompletion(executionNotification)
        console.log(`Ã°Å¸Å½Â¯ NotificaÃ§Ã£o Discord enviada: ${checklistData.nome} concluÃ­do por ${userData.nome}`)
      }
    } catch (discordError) {
      console.error('ÂÅ’ Erro ao enviar notificaÃ§Ã£o Discord:', discordError)
      // NÃ£o falhar a operaÃ§Ã£o se sÃ³ o Discord der erro
    }

    return NextResponse.json({
      success: true,
      execucao_id: execucao.id,
      message: 'Checklist enviado com sucesso!',
      discord_notification: true
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API checklist-execucoes:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: (error as any).message
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
        error: 'ParÃ¢metro bar_id Ã© obrigatÃ³rio'
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
      console.error('ÂÅ’ Erro ao buscar execuÃ§Ãµes:', error)
      return NextResponse.json({
        error: 'Erro ao buscar execuÃ§Ãµes',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      execucoes: execucoes || [],
      total: execucoes?.length || 0
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API GET checklist-execucoes:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: (error as any).message
    }, { status: 500 })
  }
} 

