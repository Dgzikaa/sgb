import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json(
        { error: 'Bar ID é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar credenciais do NIBO para o bar
    const { data: credenciais, error: credError } = await supabase
      .from('credenciais')
      .select('*')
      .eq('bar_id', barId)
      .eq('servico', 'nibo')
      .single();

    if (credError || !credenciais) {
      return NextResponse.json({
        connected: false,
        message: 'Nenhuma credencial NIBO encontrada para este estabelecimento',
      });
    }

    // Verificar se a API key está configurada
    if (!credenciais.api_key) {
      return NextResponse.json({
        connected: false,
        message: 'API key NIBO não configurada',
      });
    }

    // Buscar estatísticas das tabelas NIBO
    const stats = await getNiboStats(barId);

    return NextResponse.json({
      connected: true,
      apiKeyMasked: maskApiKey(credenciais.api_key),
      organizationId: credenciais.organization_id,
      lastSync: credenciais.updated_at,
      stats,
    });
  } catch (error) {
    console.error('Erro ao verificar status NIBO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function getNiboStats(barId: string) {
  try {
    // Contar registros em cada tabela NIBO
    const [
      { count: stakeholders },
      { count: agendamentos },
      { count: categorias },
      { count: usuarios },
      { count: contasBancarias },
    ] = await Promise.all([
      supabase
        .from('nibo_stakeholders')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId),
      supabase
        .from('nibo_agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId),
      supabase
        .from('nibo_categorias')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId),
      supabase
        .from('nibo_usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId),
      supabase
        .from('nibo_contas_bancarias')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId),
    ]);

    return {
      stakeholders: stakeholders || 0,
      agendamentos: agendamentos || 0,
      categorias: categorias || 0,
      usuarios: usuarios || 0,
      contasBancarias: contasBancarias || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas NIBO:', error);
    return {
      stakeholders: 0,
      agendamentos: 0,
      categorias: 0,
      usuarios: 0,
      contasBancarias: 0,
    };
  }
}

function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '***';
  return `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`;
}
