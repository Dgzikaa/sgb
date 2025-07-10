import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DEBUG: Verificando contexto atual...');

    // Verificar todas as tabelas possíveis onde pode estar o ContaAzul
    const tabelas = [
      'api_credentials',
      'contaazul_configuracoes', 
      'integracoes',
      'oauth_tokens'
    ];

    const resultados: any = {};

    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .ilike('sistema', '%conta%')
          .or('sistema.eq.contaazul,provider.eq.contaazul,nome.ilike.%conta%');

        resultados[tabela] = {
          existe: !error,
          registros: data?.length || 0,
          dados: data,
          erro: error?.message
        };
      } catch (err) {
        resultados[tabela] = {
          existe: false,
          erro: err instanceof Error ? err.message : String(err)
        };
      }
    }

    // Verificar estrutura da tabela api_credentials
    const { data: estruturaApi } = await supabase
      .from('api_credentials')
      .select('*')
      .limit(5);

    // Verificar se existe tabela contaazul_configuracoes
    const { data: estruturaContaAzul } = await supabase
      .from('contaazul_configuracoes')
      .select('*')
      .limit(5);

    // Buscar TODOS os bars disponíveis
    const { data: bars } = await supabase
      .from('bars')
      .select('id, nome, ativo')
      .limit(10);

    return NextResponse.json({
      debug: 'Análise completa do contexto ContaAzul',
      timestamp: new Date().toISOString(),
      tabelas_investigadas: resultados,
      estrutura_api_credentials: {
        registros_total: estruturaApi?.length || 0,
        primeiros_registros: estruturaApi
      },
      estrutura_contaazul_configuracoes: {
        registros_total: estruturaContaAzul?.length || 0,
        primeiros_registros: estruturaContaAzul
      },
      bars_disponiveis: {
        total: bars?.length || 0,
        bars: bars
      },
      recomendacoes: [
        'Verificar se usuário tem bar selecionado no contexto',
        'Verificar se ContaAzul foi configurado na tabela correta',
        'Considerar configurar ContaAzul manualmente',
        'Verificar logs do componente ContaAzulOAuth'
      ]
    });

  } catch (error) {
    console.error('❌ Erro no debug de contexto:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 