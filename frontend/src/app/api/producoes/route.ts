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
import { getSupabaseClient } from '@/lib/supabase'

interface ProducaoInsumo {
  codigo?: string;
  nome?: string;
  unidade_medida?: string;
  quantidade_necessaria?: number | string;
  quantidade_calculada?: number | string;
  quantidade_real?: number | string;
  is_chefe?: boolean;
}

// POST - Salvar produÃ¡Â§Ã¡Â£o na tabela producoes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Ã°Å¸â€™Â¾ Dados recebidos para salvar produÃ¡Â§Ã¡Â£o:', body)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Validar dados obrigatÃ¡Â³rios
    if (!body.receita_codigo || !body.receita_nome) {
      return NextResponse.json({
        success: false,
        error: 'Receita cÃ¡Â³digo e nome sÃ¡Â£o obrigatÃ¡Â³rios'
      }, { status: 400 })
    }

    if (!body.rendimento_real || parseFloat(body.rendimento_real) <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Rendimento real Ã¡Â© obrigatÃ¡Â³rio e deve ser maior que zero'
      }, { status: 400 })
    }

    // Calcular percentual de aderÃ¡Âªncia Ã¡Â  receita baseado nos insumos
    let percentual_aderencia_receita = 100 // Default se nÃ¡Â£o hÃ¡Â¡ insumos
    let total_desvio_insumos = 0
    let insumos_validos = 0

    if (body.insumos && Array.isArray(body.insumos) && body.insumos.length > 0) {
      const insumos: ProducaoInsumo[] = body.insumos;
      console.log('Ã°Å¸â€œÅ  Calculando aderÃ¡Âªncia Ã¡Â  receita com', insumos.length, 'insumos');
      insumos.forEach((insumo: ProducaoInsumo, index: number) => {
        const planejado = parseFloat(insumo.quantidade_necessaria as string) || 0;
        const calculado = parseFloat(insumo.quantidade_calculada as string) || planejado;
        const real = parseFloat(insumo.quantidade_real as string) || 0;
        if (calculado > 0 && real > 0) {
          // Calcular desvio percentual do real vs calculado
          const aderencia = (real / calculado) * 100;
          const desvio = Math.abs(100 - aderencia);
          total_desvio_insumos += desvio;
          insumos_validos++;
          console.log(`ðŸ“ƒ Insumo ${index + 1} (${insumo.nome}): Calculado=${calculado}${insumo.unidade_medida}, Real=${real}${insumo.unidade_medida}, AderÃªncia=${aderencia.toFixed(1)}%`);
        }
      });
      if (insumos_validos > 0) {
        const desvio_medio = total_desvio_insumos / insumos_validos;
        percentual_aderencia_receita = Math.max(0, 100 - desvio_medio);
        console.log(`Ã°Å¸Å½Â¯ Desvio mÃ¡Â©dio: ${desvio_medio.toFixed(1)}% | AderÃ¡Âªncia final: ${percentual_aderencia_receita.toFixed(1)}%`);
      }
    }

    // Preparar dados para inserÃ¡Â§Ã¡Â£o
    const dadosProducao = {
      bar_id: body.bar_id || 3,
      receita_codigo: body.receita_codigo,
      receita_nome: body.receita_nome,
      receita_categoria: body.receita_categoria,
      criado_por_nome: body.criado_por_nome || 'Sistema',
      inicio_producao: body.inicio_producao ? new Date(body.inicio_producao).toISOString() : new Date().toISOString(),
      fim_producao: body.fim_producao ? new Date(body.fim_producao).toISOString() : new Date().toISOString(),
      peso_bruto_proteina: parseFloat(body.peso_bruto_proteina || 0),
      peso_limpo_proteina: parseFloat(body.peso_limpo_proteina || 0),
      rendimento_real: parseFloat(body.rendimento_real),
      rendimento_esperado: parseFloat(body.rendimento_esperado || 0),
      insumo_chefe_id: body.insumo_chefe_id,
      insumo_chefe_nome: body.insumo_chefe_nome,
      peso_insumo_chefe: parseFloat(body.peso_insumo_chefe || 0),
      percentual_aderencia_receita: Math.round(percentual_aderencia_receita * 100) / 100, // 2 decimais
      observacoes: body.observacoes || '',
      status: body.status || 'finalizada'
    }

    // Inserir produÃ¡Â§Ã¡Â£o
    const { data: producaoSalva, error } = await supabase
      .from('producoes')
      .insert([dadosProducao])
      .select('*')
      .single()

    if (error) {
      console.error('ÂÅ’ Erro ao inserir produÃ¡Â§Ã¡Â£o:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar produÃ¡Â§Ã¡Â£o: ' + error.message
      }, { status: 500 })
    }

    console.log('Å“â€¦ ProduÃ¡Â§Ã¡Â£o salva com sucesso:', producaoSalva.id)

    // Salvar dados detalhados dos insumos se fornecidos
    if (body.insumos && Array.isArray(body.insumos) && body.insumos.length > 0) {
      const insumos: ProducaoInsumo[] = body.insumos;
      console.log('Ã°Å¸â€™Â¾ Salvando dados detalhados de', insumos.length, 'insumos...');
      const insumosParaSalvar = insumos.map((insumo: ProducaoInsumo) => ({
        producao_id: producaoSalva.id,
        codigo_insumo: insumo.codigo || '',
        nome_insumo: insumo.nome || '',
        unidade: insumo.unidade_medida || 'g',
        quantidade_planejada: parseFloat(insumo.quantidade_necessaria as string) || 0,
        quantidade_calculada: parseFloat(insumo.quantidade_calculada as string) || parseFloat(insumo.quantidade_necessaria as string) || 0,
        quantidade_utilizada_real: parseFloat(insumo.quantidade_real as string) || 0,
        is_chefe: insumo.is_chefe || false
      }));

      const { data: insumosData, error: insumosError } = await supabase
        .from('producao_insumos_calculados')
        .insert(insumosParaSalvar)
        .select('*')

      if (insumosError) {
        console.error('Å¡Â Ã¯Â¸Â Erro ao salvar insumos (produÃ¡Â§Ã¡Â£o salva):', insumosError)
        // NÃ¡Â£o falhar a produÃ¡Â§Ã¡Â£o por erro nos insumos
      } else {
        console.log('Å“â€¦ Salvos', insumosData?.length || 0, 'insumos detalhados')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ProduÃ¡Â§Ã¡Â£o salva com sucesso',
      data: {
        ...producaoSalva,
        percentual_aderencia_receita,
        insumos_salvos: body.insumos?.length || 0
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na API produÃ¡Â§Ã¡Â£o:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
}

// GET - Buscar histÃ¡Â³rico de produÃ¡Â§Ã¡Âµes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    const funcionario = searchParams.get('funcionario')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const receita_codigo = searchParams.get('receita_codigo')
    const limite = parseInt(searchParams.get('limite') || '50')

    console.log(`Ã°Å¸â€œÅ  Buscando histÃ¡Â³rico de produÃ¡Â§Ã¡Âµes para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Construir query
    let query = supabase
      .from('producoes')
      .select('*')
      .eq('bar_id', barId)
      .order('criado_em', { ascending: false })
      .limit(limite)

    // Aplicar filtros opcionais
    if (funcionario) {
      query = query.eq('criado_por_nome', funcionario)
    }
    
    if (dataInicio) {
      query = query.gte('criado_em', dataInicio)
    }
    
    if (dataFim) {
      query = query.lte('criado_em', dataFim + 'T23:59:59')
    }

    if (receita_codigo) {
      query = query.eq('receita_codigo', receita_codigo)
    }

    const { data: producoes, error } = await query

    if (error) {
      console.error('ÂÅ’ Erro ao buscar produÃ¡Â§Ã¡Âµes:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar histÃ¡Â³rico: ' + error.message
      }, { status: 500 })
    }

    // Calcular estatÃ¡Â­sticas
    const estatisticas = {
      total_producoes: producoes?.length || 0,
      desvio_medio: 0,
      eficiencia_excelente: 0,
      eficiencia_boa: 0,
      eficiencia_regular: 0,
      eficiencia_ruim: 0
    }

    // Interface para Producoes (GET)
    interface Producao {
      id?: string;
      bar_id?: number;
      receita_codigo?: string;
      receita_nome?: string;
      receita_categoria?: string;
      criado_por_nome?: string;
      inicio_producao?: string;
      fim_producao?: string;
      peso_bruto_proteina?: number;
      peso_limpo_proteina?: number;
      rendimento_real?: number;
      rendimento_esperado?: number;
      insumo_chefe_id?: string;
      insumo_chefe_nome?: string;
      peso_insumo_chefe?: number;
      percentual_aderencia_receita?: number;
      observacoes?: string;
      status?: string;
      desvio?: number;
      [key: string]: unknown;
    }

    if (producoes && producoes.length > 0) {
      const desvios = producoes
        .filter(function(p: Producao): boolean { return p.desvio !== undefined && p.desvio > 0; })
        .map(function(p: Producao): number { return p.desvio as number; });
      
      if (desvios.length > 0) {
        estatisticas.desvio_medio = desvios.reduce((a: number, b: number) => a + b, 0) / desvios.length;
        estatisticas.eficiencia_excelente = desvios.filter(function(d: number): boolean { return d >= 95; }).length;
        estatisticas.eficiencia_boa = desvios.filter(function(d: number): boolean { return d >= 85 && d < 95; }).length;
        estatisticas.eficiencia_regular = desvios.filter(function(d: number): boolean { return d >= 75 && d < 85; }).length;
        estatisticas.eficiencia_ruim = desvios.filter(function(d: number): boolean { return d < 75; }).length;
      }
    }

    console.log(`Å“â€¦ ${producoes?.length || 0} produÃ¡Â§Ã¡Âµes encontradas`)

    return NextResponse.json({
      success: true,
      producoes: producoes || [],
      estatisticas,
      total: producoes?.length || 0
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na API histÃ¡Â³rico:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 

