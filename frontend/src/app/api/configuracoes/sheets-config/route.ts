import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/configuracoes/sheets-config
 * Retorna a configuração de planilha Google Sheets para um bar específico
 * 
 * Query params:
 * - bar_id: ID do bar (obrigatório)
 * - tipo: Tipo de planilha (opcional: 'insumos', 'desempenho', 'cmv')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');
    const tipo = searchParams.get('tipo') || 'insumos';

    if (!barId) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Buscar configuração de Google Sheets para o bar
    const { data: config, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'google_sheets')
      .eq('ativo', true)
      .single();

    if (error || !config) {
      // Retorna configuração vazia se não encontrar
      return NextResponse.json({
        success: true,
        spreadsheet_id: null,
        message: 'Nenhuma configuração de sheets encontrada para este bar'
      });
    }

    const configuracoes = config.configuracoes as Record<string, string>;
    
    // Mapear tipo para o campo correto
    let spreadsheetId: string | null = null;
    
    switch (tipo) {
      case 'desempenho':
        spreadsheetId = configuracoes?.desempenho_spreadsheet_id || null;
        break;
      case 'cmv':
        spreadsheetId = configuracoes?.cmv_spreadsheet_id || configuracoes?.spreadsheet_id || null;
        break;
      case 'insumos':
      default:
        spreadsheetId = configuracoes?.spreadsheet_id || null;
        break;
    }

    return NextResponse.json({
      success: true,
      spreadsheet_id: spreadsheetId,
      aba_insumos: configuracoes?.aba_insumos || 'INSUMOS',
      api_key: configuracoes?.api_key || null
    });

  } catch (error) {
    console.error('Erro ao buscar configuração de sheets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
