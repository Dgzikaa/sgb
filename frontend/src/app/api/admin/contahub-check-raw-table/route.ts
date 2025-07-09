import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🔍 Verificando estrutura real da tabela sistema_raw...');
    
    // Buscar um registro de exemplo para ver todos os campos
    const { data: registros, error } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('sistema', 'contahub')
      .limit(3);

    if (error) {
      return NextResponse.json({ 
        error: `Erro ao buscar registros: ${error.message}`,
        details: error 
      }, { status: 500 });
    }

    if (!registros || registros.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum registro encontrado',
        total: 0
      });
    }

    const analise = registros.map((registro, index) => {
      const todosOsCampos = Object.keys(registro);
      const camposComValor = todosOsCampos.filter(campo => 
        registro[campo] !== null && 
        registro[campo] !== undefined && 
        registro[campo] !== ''
      );
      
      const camposVazios = todosOsCampos.filter(campo => 
        registro[campo] === null || 
        registro[campo] === undefined || 
        registro[campo] === ''
      );

      // Verificar se algum campo contém JSON
      const camposComJSON = todosOsCampos.reduce((acc, campo) => {
        const valor = registro[campo];
        if (typeof valor === 'string' && valor.length > 0) {
          try {
            JSON.parse(valor);
            acc[campo] = 'JSON_VÁLIDO';
          } catch {
            acc[campo] = 'STRING_NORMAL';
          }
        } else if (typeof valor === 'object' && valor !== null) {
          acc[campo] = 'OBJETO';
        }
        return acc;
      }, {} as Record<string, string>);

      return {
        registro_id: registro.id,
        tipo_dados: registro.tipo_dados,
        data_referencia: registro.data_referencia,
        
        estrutura: {
          total_campos: todosOsCampos.length,
          todos_os_campos: todosOsCampos,
          campos_com_valor: camposComValor,
          campos_vazios: camposVazios,
          campos_com_json: camposComJSON
        },
        
        // Amostra de alguns campos importantes
        amostra_campos: {
          id: registro.id,
          tipo_dados: registro.tipo_dados,
          dados: registro.dados,
          data: registro.data,
          hash: registro.hash,
          // Verificar se existe campo com outro nome
          content: registro.content,
          payload: registro.payload,
          json_data: registro.json_data,
          raw_data: registro.raw_data
        },
        
        // Verificar tamanho dos campos string
        tamanho_campos: todosOsCampos.reduce((acc, campo) => {
          const valor = registro[campo];
          if (typeof valor === 'string') {
            acc[campo] = valor.length;
          }
          return acc;
        }, {} as Record<string, number>)
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Verificação da tabela concluída',
      total_registros: registros.length,
      analise,
      resumo: {
        campos_unicos: [...new Set(analise.flatMap(a => a.estrutura.todos_os_campos))],
        campos_sempre_vazios: analise.length > 0 ? 
          analise[0].estrutura.todos_os_campos.filter(campo => 
            analise.every(a => a.estrutura.campos_vazios.includes(campo))
          ) : [],
        campos_sempre_preenchidos: analise.length > 0 ? 
          analise[0].estrutura.todos_os_campos.filter(campo => 
            analise.every(a => a.estrutura.campos_com_valor.includes(campo))
          ) : []
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação da tabela:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 