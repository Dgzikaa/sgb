// Script local para processar dados pendentes da sistema_raw
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.r9VBZFCzOcAhJqYXIIwxGvQYX9qLJVEhDQVOBJdCW2o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function processarDadosLocalmente() {
  console.log('🔄 INICIANDO PROCESSAMENTO DOS DADOS RAW LOCALMENTE');
  
  try {
    // Buscar dados não processados do ContaHub
    console.log('🔍 Buscando dados raw não processados...');
    const { data: rawData, error: fetchError } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('sistema', 'contahub')
      .eq('processado', false)
      .order('criado_em', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Erro ao buscar dados raw: ${fetchError.message}`);
    }
    
    if (!rawData || rawData.length === 0) {
      console.log('✅ Nenhum dado raw para processar');
      return;
    }
    
    console.log(`📊 Encontrados ${rawData.length} registros para processar`);
    
    let totalProcessados = 0;
    let totalErros = 0;
    
    // Processar cada registro
    for (const registro of rawData) {
      const { id, tipo_dados, data: rawJsonData, data_referencia, bar_id } = registro;
      
      console.log(`\n📋 Processando: ${tipo_dados} (ID: ${id}) - Data: ${data_referencia}`);
      
      try {
        // Pegar todos os registros
        const todosRegistros = rawJsonData.todos_registros || [rawJsonData.primeiro_registro];
        
        if (!todosRegistros || todosRegistros.length === 0) {
          console.log(`⚠️ ${tipo_dados}: Sem dados para processar`);
          continue;
        }
        
        console.log(`📊 ${tipo_dados}: ${todosRegistros.length} registros para distribuir`);
        
        // Processar cada registro individual
        let processadosComSucesso = 0;
        
        for (const regIndividual of todosRegistros) {
          if (!regIndividual) continue;
          
          let sucesso = false;
          
          switch (tipo_dados) {
            case 'periodo':
              sucesso = await processarPeriodo(regIndividual, bar_id, data_referencia, id);
              break;
            case 'analitico':
              sucesso = await processarAnalitico(regIndividual, bar_id, data_referencia, id);
              break;
            case 'tempo':
              sucesso = await processarTempo(regIndividual, bar_id, data_referencia, id);
              break;
            case 'pagamentos':
              sucesso = await processarPagamentos(regIndividual, bar_id, data_referencia, id);
              break;
            case 'fatporhora':
              sucesso = await processarFatPorHora(regIndividual, bar_id, data_referencia, id);
              break;
            case 'clientes_cpf':
              sucesso = await processarClientesCPF(regIndividual, bar_id, data_referencia, id);
              break;
            case 'clientes_faturamento':
              sucesso = await processarClientesFaturamento(regIndividual, bar_id, data_referencia, id);
              break;
            case 'clientes_presenca':
              sucesso = await processarClientesPresenca(regIndividual, bar_id, data_referencia, id);
              break;
            default:
              console.log(`⚠️ Tipo ${tipo_dados} não implementado`);
              continue;
          }
          
          if (sucesso) {
            processadosComSucesso++;
          }
        }
        
        // Marcar como processado se pelo menos alguns foram processados
        if (processadosComSucesso > 0) {
          await supabase
            .from('sistema_raw')
            .update({ 
              processado: true, 
              processado_em: new Date().toISOString()
            })
            .eq('id', id);
          
          console.log(`✅ ${tipo_dados}: ${processadosComSucesso}/${todosRegistros.length} registros processados`);
          totalProcessados++;
        } else {
          console.log(`❌ ${tipo_dados}: Nenhum registro processado com sucesso`);
          totalErros++;
        }
        
      } catch (error) {
        console.error(`💥 Erro ao processar ${tipo_dados}:`, error);
        totalErros++;
      }
    }
    
    console.log(`\n📊 RESUMO DO PROCESSAMENTO:`);
    console.log(`  • Total de registros: ${rawData.length}`);
    console.log(`  • Processados com sucesso: ${totalProcessados}`);
    console.log(`  • Erros: ${totalErros}`);
    
  } catch (error) {
    console.error('💥 Erro geral no processamento:', error);
  }
}

// Função para processar período
async function processarPeriodo(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_periodo')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: registro.vd,
        cli: parseInt(registro.cli || 0),
        trn: registro.trn,
        motivo: registro.motivo,
        vd_cpf: registro.vd_cpf,
        cli_cpf: registro.cli_cpf,
        cli_fone: registro.cli_fone,
        cli_nome: registro.cli_nome,
        pessoas: parseInt(registro.pessoas || 0),
        qtd_itens: parseInt(registro.qtd_itens || 0),
        tipovenda: registro.tipovenda,
        usr_abriu: registro.usr_abriu,
        vr_couvert: parseFloat(registro['$vr_couvert'] || 0),
        vr_repique: parseFloat(registro['$vr_repique'] || 0),
        vr_desconto: parseFloat(registro['$vr_desconto'] || 0),
        vr_produtos: parseFloat(registro['$vr_produtos'] || 0),
        vd_mesadesc: registro.vd_mesadesc,
        dt_gerencial: registro.dt_gerencial ? new Date(registro.dt_gerencial) : null,
        ultimo_pedido: registro.ultimo_pedido ? new Date(registro.ultimo_pedido) : null,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarPeriodo:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarPeriodo:', error);
    return false;
  }
}

// Função para processar analítico
async function processarAnalitico(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_analitico')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: parseInt(registro.vd || 0),
        ano: registro.ano,
        mes: registro.mes,
        dia: registro.dia ? new Date(registro.dia) : null,
        dds: registro.dds,
        diadasemana: registro.diadasemana,
        hora: registro.hora,
        itm: parseInt(registro.itm || 0),
        prd: parseInt(registro.prd || 0),
        itm_qtd: parseInt(registro.itm_qtd || 0),
        prd_desc: registro.prd_desc,
        grp_desc: registro.grp_desc,
        preco_unitario: parseFloat(registro.preco_unitario || 0),
        valor_total: parseFloat(registro.valor_total || (registro.preco_unitario * registro.itm_qtd) || 0),
        usr_lancou: registro.usr_lancou,
        usr_abriu: registro.usr_abriu,
        vd_mesadesc: registro.vd_mesadesc,
        tipovenda: registro.tipovenda,
        loc_desc: registro.loc_desc,
        prefixo: registro.prefixo,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarAnalitico:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarAnalitico:', error);
    return false;
  }
}

// Função para processar tempo (CORRIGIDA para colunas reais)
async function processarTempo(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_tempo')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: parseInt(registro.vd || 0),
        ano: registro.ano,
        mes: registro.mes,
        dia: registro.dia ? new Date(registro.dia) : null,
        dds: registro.dds,
        diadasemana: registro.diadasemana,
        hora: registro.hora,
        itm: parseInt(registro.itm || 0),
        prd: parseInt(registro.prd || 0),
        itm_qtd: parseInt(registro.itm_qtd || 0),
        prd_desc: registro.prd_desc,
        grp_desc: registro.grp_desc,
        loc_desc: registro.loc_desc,
        prefixo: registro.prefixo,
        tipovenda: registro.tipovenda,
        usr_abriu: registro.usr_abriu,
        usr_lancou: registro.usr_lancou,
        usr_entregou: registro.usr_entregou,
        usr_produziu: registro.usr_produziu,
        vd_mesadesc: registro.vd_mesadesc,
        tempo_t0_t1: parseInt(registro.tempo_t0_t1 || 0),
        tempo_t0_t3: parseInt(registro.tempo_t0_t3 || 0),
        tempo_t1_t3: parseInt(registro.tempo_t1_t3 || 0),
        tempo_t0_t2: parseInt(registro.tempo_t0_t2 || 0),
        tempo_t1_t2: parseInt(registro.tempo_t1_t2 || 0),
        tempo_t2_t3: parseInt(registro.tempo_t2_t3 || 0),
        t0_lancamento: registro.t0_lancamento ? new Date(registro.t0_lancamento) : null,
        t1_prodini: registro.t1_prodini ? new Date(registro.t1_prodini) : null,
        t2_prodfim: registro.t2_prodfim ? new Date(registro.t2_prodfim) : null,
        t3_entrega: registro.t3_entrega ? new Date(registro.t3_entrega) : null,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarTempo:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarTempo:', error);
    return false;
  }
}

// Função para processar pagamentos (CORRIGIDA para colunas reais)
async function processarPagamentos(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_pagamentos')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: registro.vd,
        cli: parseInt(registro.cli || 0),
        pag: registro.pag,
        trn: registro.trn,
        meio: registro.meio,
        mesa: registro.mesa,
        tipo: registro.tipo,
        valor_bruto: parseFloat(registro.valor_bruto || registro['$valor'] || 0),
        valor_liquido: parseFloat(registro.valor_liquido || registro['$liquido'] || 0),
        valor_pagamentos: parseFloat(registro.valor_pagamentos || registro['$vr_pagamentos'] || 0),
        cartao: registro.cartao,
        cliente: registro.cliente,
        autorizacao: registro.autorizacao,
        dt_gerencial: registro.dt_gerencial ? new Date(registro.dt_gerencial) : null,
        dt_transacao: registro.dt_transacao ? new Date(registro.dt_transacao) : null,
        hr_transacao: registro.hr_transacao ? new Date(registro.hr_transacao) : null,
        hr_lancamento: registro.hr_lancamento ? new Date(registro.hr_lancamento) : null,
        usr_abriu: registro.usr_abriu,
        usr_lancou: registro.usr_lancou,
        motivodesconto: registro.motivodesconto,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarPagamentos:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarPagamentos:', error);
    return false;
  }
}

// Função para processar faturamento por hora (CORRIGIDA para colunas reais)
async function processarFatPorHora(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_fatporhora')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        dds: registro.dds,
        dia: registro.dia,
        hora: registro.hora,
        qtd: parseInt(registro.qtd || 0),
        valor: parseFloat(registro.valor || registro['$valor'] || 0),
        vd_dtgerencial: registro.vd_dtgerencial ? new Date(registro.vd_dtgerencial) : null,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarFatPorHora:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarFatPorHora:', error);
    return false;
  }
}

// Função para processar clientes CPF (VERIFICADA - OK)
async function processarClientesCPF(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_clientes_cpf')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        cpf: registro.cpf,
        nome: registro.nome,
        qtd: parseInt(registro.qtd || 0),
        ultima: registro.ultima ? new Date(registro.ultima) : null,
        vd_vrpagamentos: parseFloat(registro.vd_vrpagamentos || 0),
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarClientesCPF:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarClientesCPF:', error);
    return false;
  }
}

// Função para processar clientes faturamento
async function processarClientesFaturamento(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_clientes_faturamento')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: parseInt(registro.vd || 0),
        cli_cpf: registro.cli_cpf,
        cli_fone: registro.cli_fone,
        cli_nome: registro.cli_nome,
        valor: parseFloat(registro.valor || 0),
        vendas: parseInt(registro.vendas || 0),
        ultima: registro.ultima ? new Date(registro.ultima) : null,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarClientesFaturamento:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarClientesFaturamento:', error);
    return false;
  }
}

// Função para processar clientes presença
async function processarClientesPresenca(registro, barId, dataRef, rawId) {
  try {
    const { error } = await supabase
      .from('contahub_clientes_presenca')
      .insert({
        bar_id: barId,
        sistema_raw_id: rawId,
        vd: parseInt(registro.vd || 0),
        cli_cpf: registro.cli_cpf,
        cli_fone: registro.cli_fone,
        cli_nome: registro.cli_nome,
        valor: parseFloat(registro.valor || 0),
        vendas: parseInt(registro.vendas || 0),
        ultima: registro.ultima ? new Date(registro.ultima) : null,
        dados_completos: registro
      });
    
    if (error) {
      console.error('Erro SQL em processarClientesPresenca:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro em processarClientesPresenca:', error);
    return false;
  }
}

// Executar o processamento
processarDadosLocalmente(); 