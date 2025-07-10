import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Examinando dados coletados do Storage...');
    
    const { storage_path, tipo = 'receitas' } = await request.json();
    
    if (!storage_path) {
      return NextResponse.json(
        { success: false, message: 'storage_path é obrigatório' },
        { status: 400 }
      );
    }

    // Determinar o arquivo a examinar
    const fileName = tipo === 'receitas' 
      ? `receitas_completas_2025-01-01_2025-01-31.json`
      : `despesas_completas_2025-01-01_2025-01-31.json`;
    
    const filePath = `${storage_path}${fileName}`;
    
    console.log(`📁 Baixando arquivo: ${filePath}`);

    // Baixar arquivo do Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('contaazul-dados')
      .download(filePath);

    if (downloadError) {
      console.error('❌ Erro ao baixar arquivo:', downloadError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro ao baixar arquivo do Storage',
          error: downloadError.message,
          filePath 
        },
        { status: 500 }
      );
    }

    // Converter blob para JSON
    const jsonText = await fileData.text();
    const jsonData = JSON.parse(jsonText);

    console.log(`✅ Arquivo baixado: ${jsonData.metadata.total_parcelas} parcelas`);

    // Examinar estrutura das primeiras parcelas
    const amostra = jsonData.parcelas.slice(0, 3); // Primeiras 3 parcelas
    const estruturaAnalise = {
      total_parcelas: jsonData.metadata.total_parcelas,
      parcelas_com_rateio: jsonData.metadata.parcelas_com_rateio,
      amostra_parcelas: []
    };

    // Analisar cada parcela da amostra
    for (let i = 0; i < amostra.length; i++) {
      const parcela = amostra[i];
      const analise: any = {
        index: i + 1,
        id: parcela.id,
        descricao: parcela.descricao || parcela.observacao,
        valor: parcela.valor,
        data_vencimento: parcela.data_vencimento,
        
        // Verificar diferentes locais onde podem estar as categorias
        tem_detalhes_completos: !!parcela.detalhes_completos,
        tem_rateio: parcela.tem_rateio,
        
        // Campos diretos na parcela
        categoria_direta: parcela.categoria || parcela.categoria_id || null,
        centro_custo_direto: parcela.centro_custo || parcela.centro_custo_id || null,
        
        // Campos no evento (se existir)
        evento: null,
        rateio_array: [],
        
        // Outros campos que podem conter categorização
        campos_extras: {}
      };

      // Examinar detalhes completos se existirem
      if (parcela.detalhes_completos) {
        const detalhes = parcela.detalhes_completos;
        
        // Verificar evento
        if (detalhes.evento) {
          analise.evento = {
            tem_rateio: !!detalhes.evento.rateio,
            rateio_length: detalhes.evento.rateio ? detalhes.evento.rateio.length : 0,
            categoria_evento: detalhes.evento.categoria || null,
            centro_custo_evento: detalhes.evento.centro_custo || null
          };

          // Examinar array de rateio
          if (detalhes.evento.rateio && detalhes.evento.rateio.length > 0) {
            analise.rateio_array = detalhes.evento.rateio.map((r: any) => ({
              categoria: r.categoria || r.categoria_id || null,
              centro_custo: r.centro_custo || r.centro_custo_id || null,
              valor: r.valor,
              percentual: r.percentual
            }));
          }
        }

        // Procurar categorias em outros lugares
        const camposParaVerificar = [
          'categoria', 'categoria_id', 'category', 'category_id',
          'centro_custo', 'centro_custo_id', 'cost_center', 'cost_center_id',
          'conta_categoria', 'conta_categoria_id',
          'plano_conta', 'plano_conta_id',
          'classificacao', 'classificacao_id'
        ];

        for (const campo of camposParaVerificar) {
          if (detalhes[campo]) {
            analise.campos_extras[campo] = detalhes[campo];
          }
        }
      }

      // Procurar na parcela básica também
      const camposBasicos = Object.keys(parcela).filter(key => 
        key.includes('categ') || key.includes('centro') || key.includes('classif') || key.includes('conta')
      );
      
      if (camposBasicos.length > 0) {
        analise.campos_suspeitos_parcela = {};
        for (const campo of camposBasicos) {
          analise.campos_suspeitos_parcela[campo] = parcela[campo];
        }
      }

      estruturaAnalise.amostra_parcelas.push(analise);
    }

    // Analisar todos os campos únicos encontrados
    const todosOsCampos = new Set<string>();
    for (const parcela of jsonData.parcelas.slice(0, 10)) {
      Object.keys(parcela).forEach(key => todosOsCampos.add(key));
      if (parcela.detalhes_completos) {
        Object.keys(parcela.detalhes_completos).forEach(key => todosOsCampos.add(`detalhes.${key}`));
        if (parcela.detalhes_completos.evento) {
          Object.keys(parcela.detalhes_completos.evento).forEach(key => todosOsCampos.add(`detalhes.evento.${key}`));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Análise estrutural concluída',
      storage_path,
      arquivo_examinado: fileName,
      metadata: jsonData.metadata,
      estrutura_analise: estruturaAnalise,
      todos_campos_encontrados: Array.from(todosOsCampos).sort(),
      conclusao: estruturaAnalise.parcelas_com_rateio > 0 
        ? '✅ Rateios encontrados nos dados!' 
        : '❌ Nenhum rateio encontrado - categorias podem estar em outro campo'
    });

  } catch (error) {
    console.error('❌ Erro ao examinar dados:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao examinar dados coletados',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 