import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// Mapear Query ID para tipo de dados
function getQueryTypeFromId(queryId: number): string | null {
  const mapeamento: Record<number, string> = {
    5: 'periodo_completo',
    15: 'tempo',
    7: 'pagamentos',
    101: 'fatporhora',
    93: 'clientes_faturamento',
    94: 'clientes_presenca',
    59: 'clientes_cpf',
    77: 'analitico',
    73: 'nfs',
    20: 'compra_produto_dtnf',
    26: 'compras_vendas'
  };
  
  return mapeamento[queryId] || null;
}

// Simular processamento específico
async function processarDadosEspecificos(tipoDados: string, dados: any[], registro: any, supabase: any): Promise<boolean> {
  try {
    let processados = 0;
    
    for (const item of dados) {
      // Simular inserção com UPSERT básico
      const dadosBasicos: any = {
        bar_id: registro.bar_id,
        sistema_raw_id: registro.id,
        dados_completos: item,
        criado_em: new Date()
      };
      
      if (tipoDados === 'analitico') {
        dadosBasicos.vd = parseInt(item.vd || 0);
        dadosBasicos.itm = parseInt(item.itm || 0);
        dadosBasicos.prd = parseInt(item.prd || 0);
        dadosBasicos.prd_desc = item.prd_desc || null;
        
        const { error } = await supabase
          .from('contahub_analitico')
          .upsert(dadosBasicos, { onConflict: 'bar_id,sistema_raw_id,vd,itm,prd' });
          
        if (!error) processados++;
      } else if (tipoDados === 'clientes_cpf') {
        dadosBasicos.cpf = item.cpf || null;
        dadosBasicos.nome = item.nome || null;
        dadosBasicos.qtd = parseInt(item.qtd || 0);
        dadosBasicos.vd_vrpagamentos = parseFloat(item.vd_vrpagamentos || 0);
        
        const { error } = await supabase
          .from('contahub_clientes_cpf')
          .upsert(dadosBasicos, { onConflict: 'bar_id,sistema_raw_id,cpf' });
          
        if (!error) processados++;
      } else if (tipoDados === 'nfs') {
        dadosBasicos.nf_tipo = item.nf_tipo || null;
        dadosBasicos.nf_serie = parseInt(item.nf_serie || 0);
        dadosBasicos.autorizada = parseInt(item.autorizada || 0);
        dadosBasicos.cancelada = parseInt(item.cancelada || 0);
        
        const { error } = await supabase
          .from('contahub_nfs')
          .upsert(dadosBasicos, { onConflict: 'bar_id,sistema_raw_id,nf_serie' });
          
        if (!error) processados++;
      } else if (tipoDados === 'compra_produto_dtnf') {
        dadosBasicos.cmp = item.cmp || null;
        dadosBasicos.dt_nf = item.dt_nf || null;
        dadosBasicos.cit_qtd = parseFloat(item.cit_qtd || 0);
        dadosBasicos.prd_desc = item.prd_desc || null;
        dadosBasicos.frn_alias = item.frn_alias || null;
        dadosBasicos.cit_vrtotal = parseFloat(item.cit_vrtotal || 0);
        
        const { error } = await supabase
          .from('contahub_compra_produto_dtnf')
          .upsert(dadosBasicos, { onConflict: 'bar_id,sistema_raw_id,cmp,dt_nf' });
          
        if (!error) processados++;
      }
    }
    
    console.log(`✅ ${processados} de ${dados.length} registros processados para ${tipoDados}`);
    return processados > 0;
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${tipoDados}:`, error);
    return false;
  }
}

export async function POST() {
  try {
    console.log('🔧 Forçando processamento dos registros com dados válidos...');
    
    const supabase = await getAdminClient();
    
    // IDs específicos que sabemos que têm dados
    const registrosComDados = [3002, 3003, 3004, 3005];
    
    console.log(`🎯 Focando nos registros: ${registrosComDados.join(', ')}`);
    
    // 1. Resetar esses registros para processado = false
    console.log('🔄 Resetando status de processamento...');
    const { error: resetError } = await supabase
      .from('sistema_raw')
      .update({ processado: false })
      .in('id', registrosComDados);
      
    if (resetError) {
      throw resetError;
    }
    
    // 2. Buscar esses registros específicos
    const { data: registros, error: fetchError } = await supabase
      .from('sistema_raw')
      .select('*')
      .in('id', registrosComDados)
      .eq('bar_id', 3)
      .order('id', { ascending: false });
      
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Encontrados ${registros?.length || 0} registros para processamento forçado`);
    
    if (!registros || registros.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum registro encontrado com os IDs especificados'
      });
    }
    
    // 3. Processar cada registro
    let totalSucesso = 0;
    let totalErros = 0;
    const detalhes: any[] = [];
    
    for (const registro of registros) {
      console.log(`\n📋 Processando: ${registro.tipo_dados} (ID: ${registro.id})`);
      
      try {
        // Identificar tipo de dados usando metadados
        const tipoDados = registro.data?.metadados?.query_id ? 
          getQueryTypeFromId(registro.data.metadados.query_id) : null;
        console.log(`🏷️ Tipo identificado: ${tipoDados}`);
        
        if (!tipoDados) {
          console.log(`❌ Tipo não identificado`);
          totalErros++;
          continue;
        }
        
        // Extrair dados do campo list
        const dadosParaProcessar = registro.data?.list || [];
        console.log(`📦 Dados extraídos: ${dadosParaProcessar.length} registros`);
        
        if (dadosParaProcessar.length === 0) {
          console.log(`⚠️ Nenhum dado para processar`);
          continue;
        }
        
        const sucesso = await processarDadosEspecificos(tipoDados, dadosParaProcessar, registro, supabase);
        
        if (sucesso) {
          // Marcar como processado
          await supabase
            .from('sistema_raw')
            .update({ processado: true })
            .eq('id', registro.id);
            
          totalSucesso += dadosParaProcessar.length;
          console.log(`✅ ${registro.tipo_dados}: ${dadosParaProcessar.length} registros processados`);
        } else {
          totalErros++;
          console.log(`❌ ${registro.tipo_dados}: Falha no processamento`);
        }
        
        detalhes.push({
          id: registro.id,
          tipo: registro.tipo_dados,
          totalRegistros: dadosParaProcessar.length,
          sucesso
        });
        
      } catch (error) {
        console.error(`❌ Erro ao processar registro ${registro.id}:`, error);
        totalErros++;
      }
    }
    
    console.log(`\n🎉 Processamento forçado concluído: ${totalSucesso} sucessos, ${totalErros} erros`);
    
    return NextResponse.json({
      success: true,
      message: `Processamento forçado concluído: ${totalSucesso} registros processados com sucesso`,
      total_sucesso: totalSucesso,
      total_erros: totalErros,
      detalhes
    });
    
  } catch (error) {
    console.error('❌ Erro no processamento forçado:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro no processamento forçado',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 