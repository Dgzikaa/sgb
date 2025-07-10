import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DEBUG: Investigando estrutura REAL da api_credentials...');

    // Buscar TODOS os registros da api_credentials SEM filtros
    const { data: todosRegistros, error: erroTodos } = await supabase
      .from('api_credentials')
      .select('*');

    console.log('📋 TODOS os registros api_credentials:', todosRegistros);
    console.log('❌ Erro (se houver):', erroTodos);

    // Buscar apenas registros que contenham 'conta' em qualquer campo
    const registrosContaAzul = todosRegistros?.filter((registro: any) => {
      const texto = JSON.stringify(registro).toLowerCase();
      return texto.includes('conta') || texto.includes('azul');
    });

    // Analisar estrutura dos campos
    const estruturaExemplo = todosRegistros?.[0] ? Object.keys(todosRegistros[0]) : [];

    // Buscar especificamente por sistema = 'contaazul'
    const { data: sistemaContaAzul, error: erroSistema } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul');

    console.log('🎯 Registros sistema=contaazul:', sistemaContaAzul);

    // Buscar por diferentes variações
    const variacoesBusca = [
      { filtro: 'sistema.eq.contaazul', nome: 'sistema igual contaazul' },
      { filtro: 'sistema.ilike.%conta%', nome: 'sistema contém conta' },
      { filtro: 'ativo.eq.true', nome: 'ativo igual true' }
    ];

    const resultadosVariacoes: any = {};

    for (const variacao of variacoesBusca) {
      try {
        let query = supabase.from('api_credentials').select('*');
        
        if (variacao.filtro.includes('sistema.eq.contaazul')) {
          query = query.eq('sistema', 'contaazul');
        } else if (variacao.filtro.includes('sistema.ilike')) {
          query = query.ilike('sistema', '%conta%');
        } else if (variacao.filtro.includes('ativo.eq.true')) {
          query = query.eq('ativo', true);
        }

        const { data, error } = await query;
        
        resultadosVariacoes[variacao.nome] = {
          registros: data?.length || 0,
          dados: data,
          erro: error?.message
        };
      } catch (err) {
        resultadosVariacoes[variacao.nome] = {
          erro: err instanceof Error ? err.message : String(err)
        };
      }
    }

    return NextResponse.json({
      debug: 'Estrutura REAL da api_credentials',
      timestamp: new Date().toISOString(),
      total_registros_sem_filtro: todosRegistros?.length || 0,
      erro_busca_geral: erroTodos?.message,
      estrutura_campos: estruturaExemplo,
      registros_com_conta_azul: {
        total: registrosContaAzul?.length || 0,
        dados: registrosContaAzul
      },
      busca_sistema_contaazul: {
        total: sistemaContaAzul?.length || 0,
        dados: sistemaContaAzul,
        erro: erroSistema?.message
      },
      variacoes_busca: resultadosVariacoes,
      todos_registros_exemplo: todosRegistros?.slice(0, 3), // Primeiros 3 para ver estrutura
      recomendacao: todosRegistros && todosRegistros.length > 0 ? 
        'Registros encontrados! Verificar filtros das APIs de investigação.' :
        'Nenhum registro encontrado. Verificar se tabela está correta.'
    });

  } catch (error) {
    console.error('❌ Erro no debug estrutura real:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 