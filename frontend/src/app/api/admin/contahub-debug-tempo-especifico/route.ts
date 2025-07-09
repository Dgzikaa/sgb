import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    console.log(`🧪 DEBUG TEMPO: Testando processamento completo de UM registro de tempo`);
    
    // 1. Buscar um registro de tempo específico
    const { data: registro, error } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('id', 3648)
      .eq('tipo_dados', 'tempo')
      .single();

    if (error || !registro) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' });
    }

    console.log(`📋 Registro encontrado: ID ${registro.id}, tipo: ${registro.tipo_dados}`);

    // 2. Extrair dados (simular extrairDados)
    let dados = registro.data;
    if (typeof dados === 'string') {
      dados = JSON.parse(dados);
    }
    
    const dadosIndividuais = dados.list || [];
    console.log(`📊 ${dadosIndividuais.length} registros individuais extraídos`);
    
    if (dadosIndividuais.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum dado individual extraído' });
    }

    // 3. Pegar primeiro registro para teste
    const primeiroItem = dadosIndividuais[0];
    console.log(`🔍 Primeiro item:`, primeiroItem);

    // 4. Testar validação (simular validação do tempo)
    const temQtd = primeiroItem.qtd !== undefined && primeiroItem.qtd !== null;
    const temHora = primeiroItem.hora !== undefined && primeiroItem.hora !== null && primeiroItem.hora !== '';
    const temValor = primeiroItem.$valor !== undefined && primeiroItem.$valor !== null;
    const temGrpDesc = primeiroItem.grp_desc !== undefined && primeiroItem.grp_desc !== null && primeiroItem.grp_desc !== '';
    
    console.log(`🔍 Validação tempo:`, {
      temQtd, temHora, temValor, temGrpDesc,
      valores: { 
        qtd: primeiroItem.qtd, 
        hora: primeiroItem.hora, 
        valor: primeiroItem.$valor, 
        grp_desc: primeiroItem.grp_desc 
      }
    });
    
    const temDadosEssenciais = temHora && temGrpDesc;
    
    if (!temDadosEssenciais) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validação falhou',
        validacao: { temQtd, temHora, temValor, temGrpDesc }
      });
    }

    console.log(`✅ Validação passou!`);

    // 5. Processar valores (simular processamento)
    const processarNumero = (valor: any, padrao: number = 0) => {
      if (valor === undefined || valor === null || valor === '') return padrao;
      const num = parseInt(valor);
      return isNaN(num) ? padrao : num;
    };

    const dadosTempo = {
      bar_id: 3,
      sistema_raw_id: registro.id,
      
      // Valores principais
      vd: null,
      itm: null,
      prd: null,
      
      // Dados temporais 
      ano: null,
      mes: null,
      dia: null,
      dds: null,
      diadasemana: null,
      hora: primeiroItem.hora || null,
      
      // Quantidades - mapeando qtd para itm_qtd
      itm_qtd: processarNumero(primeiroItem.qtd),
      
      // Descrições
      prd_desc: null,
      grp_desc: primeiroItem.grp_desc || null,
      loc_desc: null,
      vd_mesadesc: null,
      
      // Usuários
      usr_abriu: null,
      usr_lancou: null,
      usr_produziu: null,
      usr_entregou: null,
      
      // Classificações
      prefixo: null,
      tipovenda: null,
      
      // Tempos de produção
      tempo_t0_t1: null,
      tempo_t0_t2: null,
      tempo_t0_t3: null,
      tempo_t1_t2: null,
      tempo_t1_t3: null,
      tempo_t2_t3: null,
      
      // Timestamps dos eventos
      t0_lancamento: null,
      t1_prodini: null,
      t2_prodfim: null,
      t3_entrega: null,
      
      // Novos campos
      prd_idexterno: null,
      vd_localizacao: null,
      usr_transfcancelou: null,
      
      // Dados completos para debug
      dados_completos: primeiroItem
    };

    console.log(`🔍 Dados preparados para inserção:`, {
      itm_qtd: dadosTempo.itm_qtd,
      hora: dadosTempo.hora,
      grp_desc: dadosTempo.grp_desc,
      valor_original: primeiroItem.$valor
    });

    // 6. Tentar inserir no banco
    const { error: insertError } = await supabase
      .from('contahub_tempo')
      .insert(dadosTempo);

    if (insertError) {
      console.error('❌ Erro SQL em inserção:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro na inserção', 
        detalhe: insertError.message,
        dados: dadosTempo 
      });
    }

    console.log(`✅ Tempo processado com sucesso!`);

    return NextResponse.json({
      success: true,
      message: 'Processamento de tempo bem-sucedido',
      registro_original: {
        id: registro.id,
        tipo_dados: registro.tipo_dados
      },
      dados_processados: {
        itm_qtd: dadosTempo.itm_qtd,
        hora: dadosTempo.hora,
        grp_desc: dadosTempo.grp_desc,
        valor_original: primeiroItem.$valor
      },
      validacao: { temQtd, temHora, temValor, temGrpDesc }
    });

  } catch (error) {
    console.error('❌ Erro no debug tempo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
} 