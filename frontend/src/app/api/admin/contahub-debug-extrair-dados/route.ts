import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { registro_id = 3648 } = await request.json();
    
    console.log(`🔍 DEBUG: Testando extração para registro ${registro_id}`);
    
    // Buscar registro específico
    const { data: registro, error } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('id', registro_id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    if (!registro) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' });
    }

    console.log(`📋 Registro encontrado:`, {
      id: registro.id,
      tipo_dados: registro.tipo_dados,
      data_referencia: registro.data_referencia,
      bar_id: registro.bar_id
    });

    // Testar função extrairDados
    const dadosExtraidos = extrairDados(registro);
    
    console.log(`📊 Dados extraídos: ${dadosExtraidos.length} registros`);
    
    return NextResponse.json({
      success: true,
      registro_original: {
        id: registro.id,
        tipo_dados: registro.tipo_dados,
        data_referencia: registro.data_referencia,
        bar_id: registro.bar_id,
        tamanho_data: JSON.stringify(registro.data).length
      },
      dados_extraidos: {
        total: dadosExtraidos.length,
        primeiro: dadosExtraidos[0] || null,
        campos_primeiro: dadosExtraidos[0] ? Object.keys(dadosExtraidos[0]) : []
      },
      debug_detalhado: {
        tipo_data: typeof registro.data,
        estrutura_data: registro.data ? Object.keys(registro.data) : [],
        tem_list: !!(registro.data && registro.data.list),
        tem_todos_registros: !!(registro.data && registro.data.todos_registros),
        tem_metadados: !!(registro.data && registro.data.metadados)
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
}

// Função para extrair dados individuais de um registro (CÓPIA EXATA da função principal)
function extrairDados(registro: any) {
  try {
    console.log(`🔍 DEBUG extrairDados: Extraindo dados do registro ${registro.id}...`);
    console.log(`🔍 DEBUG extrairDados: Tipo de dados do registro: ${registro.tipo_dados}`);
    
    // 1. Extrair dados do campo 'data'
    let dados = registro.data;
    
    if (!dados) {
      console.log('❌ DEBUG extrairDados: Campo data não encontrado');
      return [];
    }
    
    console.log(`🔍 DEBUG extrairDados: Tipo de dados:`, typeof dados);
    console.log(`🔍 DEBUG extrairDados: É string?`, typeof dados === 'string');
    
    // 2. Parse se for string
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
        console.log(`✅ DEBUG extrairDados: Parse JSON bem-sucedido`);
      } catch (error) {
        console.log('❌ DEBUG extrairDados: Erro ao fazer parse dos dados JSON:', error);
        return [];
      }
    }
    
    console.log(`📊 DEBUG extrairDados: Estrutura dos dados extraídos:`, Object.keys(dados));
    console.log(`📊 DEBUG extrairDados: Tem list?`, !!(dados.list));
    console.log(`📊 DEBUG extrairDados: List é array?`, Array.isArray(dados.list));
    console.log(`📊 DEBUG extrairDados: List length:`, dados.list?.length || 'N/A');
    
    // 3. Extrair dados individuais baseado na estrutura
    let dadosIndividuais: any[] = [];
    
    // Verificar se tem campo 'list' (formato ContaHub REAL)
    if (dados.list && Array.isArray(dados.list)) {
      console.log('✅ DEBUG extrairDados: Formato ContaHub REAL - extraindo de list');
      console.log(`📊 DEBUG extrairDados: list length: ${dados.list.length}`);
      dadosIndividuais = dados.list || [];
      console.log(`📋 DEBUG extrairDados: Lista tem ${dadosIndividuais.length} itens`);
    }
    // Verificar se tem formato wrapper (metadados + todos_registros) - fallback
    else if (dados.metadados && dados.todos_registros) {
      console.log('✅ DEBUG extrairDados: Formato wrapper - extraindo de todos_registros');
      console.log(`📊 DEBUG extrairDados: todos_registros é array: ${Array.isArray(dados.todos_registros)}`);
      console.log(`📊 DEBUG extrairDados: todos_registros length: ${dados.todos_registros?.length || 'N/A'}`);
      dadosIndividuais = dados.todos_registros || [];
    }
    // Se não é wrapper, usar dados diretos
    else {
      console.log('✅ DEBUG extrairDados: Formato direto - usando dados como item único');
      console.log(`📊 DEBUG extrairDados: Dados diretos:`, Object.keys(dados));
      dadosIndividuais = [dados];
    }
    
    // 4. Log detalhado dos primeiros registros para debug
    if (dadosIndividuais.length > 0) {
      console.log(`📋 DEBUG extrairDados: Primeiro registro extraído:`, Object.keys(dadosIndividuais[0]));
      console.log(`📋 DEBUG extrairDados: Primeiro registro valores:`, dadosIndividuais[0]);
      if (dadosIndividuais.length > 1) {
        console.log(`📋 DEBUG extrairDados: Segundo registro extraído:`, Object.keys(dadosIndividuais[1]));
      }
    } else {
      console.log(`❌ DEBUG extrairDados: Nenhum dado individual extraído!`);
    }
    
    console.log(`📋 DEBUG extrairDados: Total extraídos ${dadosIndividuais.length} registros individuais para tipo: ${registro.tipo_dados}`);
    
    // 6. Retornar dados individuais
    return dadosIndividuais;
    
  } catch (error) {
    console.error('❌ DEBUG extrairDados: Erro em extrairDados:', error);
    return [];
  }
} 