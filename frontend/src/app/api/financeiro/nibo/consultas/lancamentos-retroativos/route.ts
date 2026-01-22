import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NIBO_BASE_URL = 'https://api.nibo.com.br/empresas/v1';

// Buscar credenciais do NIBO para um bar
async function getNiboCredentials(barId: number = 3) {
  const { data: credencial, error } = await supabase
    .from('api_credentials')
    .select('api_token, empresa_id')
    .eq('sistema', 'nibo')
    .eq('bar_id', barId)
    .eq('ativo', true)
    .single();

  if (error || !credencial?.api_token) {
    return null;
  }

  return credencial;
}

// GET - Buscar lançamentos retroativos (criados após X com competência antes de Y)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const criadoApos = searchParams.get('criado_apos'); // Data mínima de criação (createDate)
    const competenciaAntes = searchParams.get('competencia_antes'); // Data máxima de competência (accrualDate)
    const competenciaApos = searchParams.get('competencia_apos'); // Data mínima de competência (opcional)
    const criadoAntes = searchParams.get('criado_antes'); // Data máxima de criação (opcional)

    console.log(`[NIBO-CONSULTAS] Buscando lançamentos retroativos, bar_id=${barId}`);
    console.log(`[NIBO-CONSULTAS] Filtros: criado_apos=${criadoApos}, competencia_antes=${competenciaAntes}`);

    if (!criadoApos || !competenciaAntes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parâmetros obrigatórios: criado_apos e competencia_antes' 
        },
        { status: 400 }
      );
    }

    const credencial = await getNiboCredentials(barId);
    
    if (!credencial) {
      return NextResponse.json(
        { success: false, error: 'Credenciais NIBO não encontradas para este bar' },
        { status: 400 }
      );
    }

    // Buscar schedules da API NIBO com paginação
    // Filtrar por accrualDate (competência) primeiro, depois filtrar createDate no código
    const allSchedules: any[] = [];
    let skip = 0;
    const top = 200;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 50; // Limite de segurança

    // Montar filtro OData para competência
    let odataFilter = `accrualDate lt ${competenciaAntes}T00:00:00Z`;
    
    if (competenciaApos) {
      odataFilter += ` and accrualDate ge ${competenciaApos}T00:00:00Z`;
    }

    console.log(`[NIBO-CONSULTAS] Filtro OData: ${odataFilter}`);

    while (hasMore && pageCount < maxPages) {
      pageCount++;
      
      const url = new URL(`${NIBO_BASE_URL}/schedules`);
      url.searchParams.set('apitoken', credencial.api_token);
      url.searchParams.set('$filter', odataFilter);
      url.searchParams.set('$orderby', 'createDate desc');
      url.searchParams.set('$top', top.toString());
      url.searchParams.set('$skip', skip.toString());

      console.log(`[NIBO-CONSULTAS] Buscando página ${pageCount}...`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': credencial.api_token
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NIBO-CONSULTAS] Erro API:', response.status, errorText);
        throw new Error(`Erro NIBO: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const items = data?.items || [];

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      allSchedules.push(...items);
      console.log(`[NIBO-CONSULTAS] Página ${pageCount}: ${items.length} registros (total: ${allSchedules.length})`);

      skip += top;
      if (items.length < top) {
        hasMore = false;
      }

      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[NIBO-CONSULTAS] Total de registros da API: ${allSchedules.length}`);

    // Filtrar por createDate (data de criação) no código
    // A API NIBO pode não suportar filtro por createDate no OData
    const criadoAposDate = new Date(criadoApos + 'T00:00:00Z');
    const criadoAntesDate = criadoAntes ? new Date(criadoAntes + 'T23:59:59Z') : null;

    const lancamentosRetroativos = allSchedules.filter(schedule => {
      if (!schedule.createDate) return false;
      
      const createDate = new Date(schedule.createDate);
      
      // Verificar se foi criado após a data especificada
      if (createDate < criadoAposDate) {
        return false;
      }

      // Verificar se foi criado antes da data máxima (se especificada)
      if (criadoAntesDate && createDate > criadoAntesDate) {
        return false;
      }

      return true;
    });

    console.log(`[NIBO-CONSULTAS] Lançamentos retroativos encontrados: ${lancamentosRetroativos.length}`);

    // Formatar dados para resposta
    const resultado = lancamentosRetroativos.map(schedule => ({
      id: schedule.scheduleId,
      tipo: schedule.type,
      status: schedule.isPaid ? 'Pago' : 'Pendente',
      valor: Math.abs(schedule.value || 0),
      valorPago: Math.abs(schedule.paidValue || 0),
      
      // Datas importantes
      dataCompetencia: schedule.accrualDate?.split('T')[0] || null,
      dataVencimento: schedule.dueDate?.split('T')[0] || null,
      dataCriacao: schedule.createDate || null,
      dataAtualizacao: schedule.updateDate || null,
      
      // Quem criou/atualizou
      criadoPor: schedule.createUser || null,
      atualizadoPor: schedule.updateUser || null,
      
      // Detalhes
      descricao: schedule.description || '',
      referencia: schedule.reference || '',
      
      // Categoria
      categoriaId: schedule.category?.id || null,
      categoriaNome: schedule.category?.name || null,
      categoriaTipo: schedule.category?.type || null,
      
      // Stakeholder (fornecedor/cliente)
      stakeholderId: schedule.stakeholder?.id || null,
      stakeholderNome: schedule.stakeholder?.name || null,
      stakeholderTipo: schedule.stakeholder?.type || null,
      
      // Centro de custo
      centrosCusto: schedule.costCenters || [],
      
      // Flags
      isPaid: schedule.isPaid || false,
      isDued: schedule.isDued || false,
      isFlagged: schedule.isFlagged || false,
      hasInstallment: schedule.hasInstallment || false,
      hasRecurrence: schedule.hasRecurrence || false
    }));

    // Ordenar por data de criação (mais recente primeiro)
    resultado.sort((a, b) => {
      const dateA = new Date(a.dataCriacao || 0);
      const dateB = new Date(b.dataCriacao || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Calcular estatísticas
    const estatisticas = {
      total: resultado.length,
      totalPagos: resultado.filter(r => r.isPaid).length,
      totalPendentes: resultado.filter(r => !r.isPaid).length,
      valorTotal: resultado.reduce((sum, r) => sum + r.valor, 0),
      valorPago: resultado.reduce((sum, r) => sum + r.valorPago, 0),
      valorPendente: resultado.reduce((sum, r) => sum + (r.isPaid ? 0 : r.valor), 0),
      
      // Por usuário
      porUsuario: resultado.reduce((acc, r) => {
        const user = r.criadoPor || 'Não identificado';
        if (!acc[user]) {
          acc[user] = { count: 0, valor: 0 };
        }
        acc[user].count++;
        acc[user].valor += r.valor;
        return acc;
      }, {} as Record<string, { count: number; valor: number }>),
      
      // Por categoria
      porCategoria: resultado.reduce((acc, r) => {
        const cat = r.categoriaNome || 'Sem categoria';
        if (!acc[cat]) {
          acc[cat] = { count: 0, valor: 0 };
        }
        acc[cat].count++;
        acc[cat].valor += r.valor;
        return acc;
      }, {} as Record<string, { count: number; valor: number }>)
    };

    return NextResponse.json({
      success: true,
      filtros: {
        criadoApos,
        criadoAntes: criadoAntes || null,
        competenciaAntes,
        competenciaApos: competenciaApos || null,
        barId
      },
      estatisticas,
      data: resultado,
      total: resultado.length
    });

  } catch (error) {
    console.error('[NIBO-CONSULTAS] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno ao buscar lançamentos' 
      },
      { status: 500 }
    );
  }
}
