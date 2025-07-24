import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

// =====================================================
// GET - LISTAR METAS
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const ativas = searchParams.get('ativas') !== 'false';

    const supabase = await getAdminClient();

    // Buscar metas da coluna 'metas' da tabela bars
    const { data: bar, error } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', user.bar_id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar metas:', error);
      return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 });
    }

    // Converter a estrutura de metas existente para o formato esperado
    const metasConvertidas = converterMetasParaFormatoEsperado(bar?.metas || {});

    // Filtrar por categoria se especificada
    let metasFiltradas = [...metasConvertidas];
    if (categoria) {
      metasFiltradas = metasFiltradas.filter((m: any) => m.categoria === categoria);
    }

    // Filtrar apenas metas ativas se especificado
    if (ativas) {
      metasFiltradas = metasFiltradas.filter((m: any) => m.meta_ativa !== false);
    }

    // Organizar por categoria
    const metasOrganizadas = {
      financeiro: metasFiltradas.filter((m: any) => m.categoria === 'financeiro') || [],
      clientes: metasFiltradas.filter((m: any) => m.categoria === 'clientes') || [],
      avaliacoes: metasFiltradas.filter((m: any) => m.categoria === 'avaliacoes') || [],
      cockpit_produtos: metasFiltradas.filter((m: any) => m.categoria === 'cockpit_produtos') || [],
      marketing: metasFiltradas.filter((m: any) => m.categoria === 'marketing') || [],
    };

    return NextResponse.json({
      success: true,
      data: metasOrganizadas,
      total: metasFiltradas.length
    });

  } catch (error) {
    console.error('❌ Erro na API de metas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para converter a estrutura de metas existente para o formato esperado
function converterMetasParaFormatoEsperado(metasOriginais: any): any[] {
  const metasConvertidas: any[] = [];
  let ordemExibicao = 1;

  // Converter cockpit_vendas
  if (metasOriginais.cockpit_vendas) {
    const vendas = metasOriginais.cockpit_vendas;
    if (vendas.quisabdom) {
      metasConvertidas.push({
        id: `cockpit_vendas_quisabdom`,
        categoria: 'cockpit_vendas',
        nome: 'QUI+SÁB+DOM',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: vendas.quisabdom,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (vendas.couvert_atracoes) {
      metasConvertidas.push({
        id: `cockpit_vendas_couvert_atracoes`,
        categoria: 'cockpit_vendas',
        nome: 'Couvert / Atrações',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: vendas.couvert_atracoes,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (vendas.percent_faturamento_ate_19h) {
      metasConvertidas.push({
        id: `cockpit_vendas_faturamento_19h`,
        categoria: 'cockpit_vendas',
        nome: '% Faturamento até 19h',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: vendas.percent_faturamento_ate_19h,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (vendas.venda_balcao !== undefined) {
      metasConvertidas.push({
        id: `cockpit_vendas_balcao`,
        categoria: 'cockpit_vendas',
        nome: 'Venda Balcão',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: vendas.venda_balcao,
        ordem_exibicao: ordemExibicao++
      });
    }
  }

  // Converter cockpit_produtos
  if (metasOriginais.cockpit_produtos) {
    const produtos = metasOriginais.cockpit_produtos;
    if (produtos.stockout_comidas !== undefined) {
      metasConvertidas.push({
        id: `cockpit_produtos_stockout_comidas`,
        categoria: 'cockpit_produtos',
        nome: 'StockOut Comidas',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: produtos.stockout_comidas,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (produtos.stockout_drinks !== undefined) {
      metasConvertidas.push({
        id: `cockpit_produtos_stockout_drinks`,
        categoria: 'cockpit_produtos',
        nome: 'StockOut Drinks',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: produtos.stockout_drinks,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (produtos.stockout_bar !== undefined) {
      metasConvertidas.push({
        id: `cockpit_produtos_stockout_bar`,
        categoria: 'cockpit_produtos',
        nome: 'Stockout Bar',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: produtos.stockout_bar,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (produtos.tempo_saida_bar !== undefined) {
      metasConvertidas.push({
        id: `cockpit_produtos_tempo_bar`,
        categoria: 'cockpit_produtos',
        nome: 'Tempo Saída Bar',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: produtos.tempo_saida_bar,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (produtos.tempo_saida_cozinha !== undefined) {
      metasConvertidas.push({
        id: `cockpit_produtos_tempo_cozinha`,
        categoria: 'cockpit_produtos',
        nome: 'Tempo Saída Cozinha',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: produtos.tempo_saida_cozinha,
        ordem_exibicao: ordemExibicao++
      });
    }
  }

  // Converter indicadores_qualidade
  if (metasOriginais.indicadores_qualidade) {
    const qualidade = metasOriginais.indicadores_qualidade;
    if (qualidade.avaliacoes_5_google_trip !== undefined) {
      metasConvertidas.push({
        id: `indicadores_qualidade_avaliacoes_5`,
        categoria: 'indicadores_qualidade',
        nome: 'Avaliações 5 Google/Trip',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: qualidade.avaliacoes_5_google_trip,
        meta_mensal: 0,
        valor_atual: qualidade.avaliacoes_5_google_trip,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (qualidade.media_avaliacoes_google !== undefined) {
      metasConvertidas.push({
        id: `indicadores_qualidade_media_google`,
        categoria: 'indicadores_qualidade',
        nome: 'Média Avaliações Google',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: qualidade.media_avaliacoes_google,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (qualidade.nps_geral !== undefined) {
      metasConvertidas.push({
        id: `indicadores_qualidade_nps_geral`,
        categoria: 'indicadores_qualidade',
        nome: 'NPS Geral',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: qualidade.nps_geral,
        ordem_exibicao: ordemExibicao++
      });
    }
  }

  // Converter indicadores_estrategicos
  if (metasOriginais.indicadores_estrategicos) {
    const estrategicos = metasOriginais.indicadores_estrategicos;
    if (estrategicos.faturamento_total !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_faturamento_total`,
        categoria: 'indicadores_estrategicos',
        nome: 'Faturamento Total',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: estrategicos.faturamento_total,
        meta_mensal: 0,
        valor_atual: estrategicos.faturamento_total,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.faturamento_couvert !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_faturamento_couvert`,
        categoria: 'indicadores_estrategicos',
        nome: 'Faturamento Couvert',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: estrategicos.faturamento_couvert,
        meta_mensal: 0,
        valor_atual: estrategicos.faturamento_couvert,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.faturamento_bar !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_faturamento_bar`,
        categoria: 'indicadores_estrategicos',
        nome: 'Faturamento Bar',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: estrategicos.faturamento_bar,
        meta_mensal: 0,
        valor_atual: estrategicos.faturamento_bar,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.ticket_medio_contahub !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_ticket_medio`,
        categoria: 'indicadores_estrategicos',
        nome: 'Ticket Médio ContaHub',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: estrategicos.ticket_medio_contahub,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.clientes_atendidos !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_clientes_atendidos`,
        categoria: 'indicadores_estrategicos',
        nome: 'Clientes Atendidos',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: estrategicos.clientes_atendidos,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.clientes_ativos !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_clientes_ativos`,
        categoria: 'indicadores_estrategicos',
        nome: 'Clientes Ativos',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: estrategicos.clientes_ativos,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.reservas_totais !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_reservas_totais`,
        categoria: 'indicadores_estrategicos',
        nome: 'Reservas Totais',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: estrategicos.reservas_totais,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (estrategicos.reservas_presentes !== undefined) {
      metasConvertidas.push({
        id: `indicadores_estrategicos_reservas_presentes`,
        categoria: 'indicadores_estrategicos',
        nome: 'Reservas Presentes',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        valor_atual: estrategicos.reservas_presentes,
        ordem_exibicao: ordemExibicao++
      });
    }
  }

  // Converter indicadores_mensais
  if (metasOriginais.indicadores_mensais) {
    const mensais = metasOriginais.indicadores_mensais;
    if (mensais.faturamento_total !== undefined) {
      metasConvertidas.push({
        id: `indicadores_mensais_faturamento_total`,
        categoria: 'indicadores_mensais',
        nome: 'Faturamento Total Mensal',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: mensais.faturamento_total,
        valor_atual: mensais.faturamento_total,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (mensais.faturamento_couvert !== undefined) {
      metasConvertidas.push({
        id: `indicadores_mensais_faturamento_couvert`,
        categoria: 'indicadores_mensais',
        nome: 'Faturamento Couvert Mensal',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: mensais.faturamento_couvert,
        valor_atual: mensais.faturamento_couvert,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (mensais.faturamento_bar !== undefined) {
      metasConvertidas.push({
        id: `indicadores_mensais_faturamento_bar`,
        categoria: 'indicadores_mensais',
        nome: 'Faturamento Bar Mensal',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: mensais.faturamento_bar,
        valor_atual: mensais.faturamento_bar,
        ordem_exibicao: ordemExibicao++
      });
    }
    if (mensais.avaliacoes_5_google_trip !== undefined) {
      metasConvertidas.push({
        id: `indicadores_mensais_avaliacoes_5`,
        categoria: 'indicadores_mensais',
        nome: 'Avaliações 5 Google/Trip Mensal',
        meta_ativa: true,
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: mensais.avaliacoes_5_google_trip,
        valor_atual: mensais.avaliacoes_5_google_trip,
        ordem_exibicao: ordemExibicao++
      });
    }
  }

  return metasConvertidas;
}

// =====================================================
// POST - CRIAR NOVA META
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const body = await request.json();
    const {
      categoria,
      subcategoria,
      nome_meta,
      tipo_valor,
      valor_semanal,
      valor_mensal,
      valor_unico,
      unidade,
      descricao,
      cor_categoria,
      icone_categoria
    } = body;

    // Validações
    if (!categoria || !nome_meta || !tipo_valor) {
      return NextResponse.json(
        { error: 'Categoria, nome da meta e tipo do valor são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Buscar metas existentes
    const { data: bar, error: fetchError } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', user.bar_id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar metas existentes:', fetchError);
      return NextResponse.json({ error: 'Erro ao buscar metas existentes' }, { status: 500 });
    }

    // Garantir que metasExistentes seja sempre um array
    const metasExistentes = Array.isArray(bar?.metas) ? bar.metas : [];

    // Buscar próxima ordem
    const ultimaMeta = metasExistentes.length > 0 
      ? Math.max(...metasExistentes.map((m: any) => m.ordem_exibicao || 0))
      : 0;

    const novaOrdem = ultimaMeta + 1;

    // Criar nova meta
    const novaMeta = {
      id: crypto.randomUUID(),
      categoria,
      subcategoria,
      nome_meta,
      tipo_valor,
      valor_semanal,
      valor_mensal,
      valor_unico,
      unidade,
      descricao,
      cor_categoria,
      icone_categoria,
      ordem_exibicao: novaOrdem,
      meta_ativa: true,
      criado_por: user.user_id,
      atualizado_por: user.user_id,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    // Adicionar nova meta ao array
    const novasMetas = [...metasExistentes, novaMeta];

    // Atualizar a coluna metas
    const { error: updateError } = await supabase
      .from('bars')
      .update({ 
        metas: novasMetas,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', user.bar_id);

    if (updateError) {
      console.error('❌ Erro ao criar meta:', updateError);
      return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
    }

    console.log(`✅ Meta criada: ${nome_meta}`);
    return NextResponse.json({
      success: true,
      data: novaMeta,
      message: 'Meta criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// =====================================================
// PUT - ATUALIZAR METAS EM LOTE
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { metas } = await request.json();

    if (!Array.isArray(metas)) {
      return NextResponse.json(
        { error: 'Formato inválido: esperado array de metas' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Buscar metas existentes
    const { data: bar, error: fetchError } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', user.bar_id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar metas existentes:', fetchError);
      return NextResponse.json({ error: 'Erro ao buscar metas existentes' }, { status: 500 });
    }

    // Garantir que metasExistentes seja sempre um array
    const metasExistentes = Array.isArray(bar?.metas) ? bar.metas : [];

    // Atualizar cada meta
    const metasAtualizadas = metasExistentes.map((metaExistente: any) => {
      const metaAtualizada = metas.find((m: any) => m.id === metaExistente.id);
      if (metaAtualizada) {
        return {
          ...metaExistente,
          valor_semanal: metaAtualizada.valor_semanal,
          valor_mensal: metaAtualizada.valor_mensal,
          valor_unico: metaAtualizada.valor_unico,
          meta_ativa: metaAtualizada.meta_ativa,
          atualizado_por: user.user_id,
          atualizado_em: new Date().toISOString()
        };
      }
      return metaExistente;
    });

    // Atualizar a coluna metas
    const { error: updateError } = await supabase
      .from('bars')
      .update({ 
        metas: metasAtualizadas,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', user.bar_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar metas:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar metas' }, { status: 500 });
    }

    console.log(`✅ ${metas.length} metas atualizadas`);
    return NextResponse.json({
      success: true,
      data: metasAtualizadas,
      message: `${metas.length} metas atualizadas com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar metas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
