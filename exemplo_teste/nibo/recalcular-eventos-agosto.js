// Script para recalcular eventos de agosto 2025
// Executa a função calculate_evento_metrics para corrigir te_real e tb_real

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
// Você precisa definir a SUPABASE_SERVICE_ROLE_KEY como variável de ambiente
// ou substituir diretamente aqui pela chave do projeto
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalcularEventosAgosto() {
  console.log('🔄 Iniciando recálculo de eventos de agosto 2025...');
  
  try {
    // 1. Buscar eventos de agosto 2025
    console.log('📅 Buscando eventos de agosto 2025...');
    const { data: eventos, error: selectError } = await supabase
      .from('eventos_base')
      .select('id, data_evento, nome, te_real, tb_real')
      .gte('data_evento', '2025-08-01')
      .lte('data_evento', '2025-08-31')
      .order('data_evento');

    if (selectError) {
      console.error('❌ Erro ao buscar eventos:', selectError);
      return;
    }

    console.log(`📊 Encontrados ${eventos.length} eventos em agosto 2025`);
    
    // Mostrar eventos com te_real/tb_real nulos
    const eventosComProblema = eventos.filter(e => !e.te_real || !e.tb_real);
    console.log(`🚨 Eventos com te_real/tb_real nulos: ${eventosComProblema.length}`);
    
    if (eventosComProblema.length > 0) {
      console.log('📋 Primeiros 5 eventos com problema:');
      eventosComProblema.slice(0, 5).forEach(evento => {
        console.log(`  - ${evento.data_evento}: ${evento.nome} (te_real: ${evento.te_real}, tb_real: ${evento.tb_real})`);
      });
    }

    // 2. Marcar todos os eventos para recálculo
    console.log('\n🔄 Marcando eventos para recálculo...');
    const { error: updateError } = await supabase
      .from('eventos_base')
      .update({ 
        precisa_recalculo: true,
        atualizado_em: new Date().toISOString()
      })
      .gte('data_evento', '2025-08-01')
      .lte('data_evento', '2025-08-31');

    if (updateError) {
      console.error('❌ Erro ao marcar eventos:', updateError);
      return;
    }

    console.log('✅ Eventos marcados para recálculo');

    // 3. Recalcular eventos um por um
    console.log('\n⚙️ Iniciando recálculo individual...');
    let totalRecalculados = 0;
    let totalComErro = 0;

    for (const evento of eventos) {
      try {
        console.log(`🔄 Recalculando evento ${evento.id} (${evento.data_evento})...`);
        
        const { error: calcError } = await supabase
          .rpc('calculate_evento_metrics', { evento_id: evento.id });

        if (calcError) {
          console.error(`❌ Erro ao recalcular evento ${evento.id}:`, calcError.message);
          totalComErro++;
        } else {
          console.log(`✅ Evento ${evento.id} recalculado com sucesso`);
          totalRecalculados++;
        }

        // Aguardar um pouco entre recálculos para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro inesperado ao recalcular evento ${evento.id}:`, error.message);
        totalComErro++;
      }
    }

    // 4. Verificar resultados
    console.log('\n📊 Verificando resultados...');
    const { data: eventosAtualizados, error: verifyError } = await supabase
      .from('eventos_base')
      .select('id, data_evento, nome, te_real, tb_real, real_r, cl_real, calculado_em')
      .gte('data_evento', '2025-08-01')
      .lte('data_evento', '2025-08-31')
      .order('data_evento');

    if (verifyError) {
      console.error('❌ Erro ao verificar resultados:', verifyError);
      return;
    }

    const eventosComDados = eventosAtualizados.filter(e => e.te_real && e.tb_real);
    const eventosAindaSemDados = eventosAtualizados.filter(e => !e.te_real || !e.tb_real);

    console.log('\n🎉 RESULTADO FINAL:');
    console.log('=====================================');
    console.log(`📊 Total de eventos: ${eventos.length}`);
    console.log(`✅ Recalculados com sucesso: ${totalRecalculados}`);
    console.log(`❌ Erros durante recálculo: ${totalComErro}`);
    console.log(`📈 Eventos com te_real/tb_real preenchidos: ${eventosComDados.length}`);
    console.log(`🚨 Eventos ainda sem dados: ${eventosAindaSemDados.length}`);
    console.log('=====================================');

    if (eventosComDados.length > 0) {
      console.log('\n📋 Primeiros 5 eventos com dados atualizados:');
      eventosComDados.slice(0, 5).forEach(evento => {
        console.log(`  - ${evento.data_evento}: ${evento.nome}`);
        console.log(`    TE Real: R$ ${evento.te_real?.toFixed(2) || '0.00'}`);
        console.log(`    TB Real: R$ ${evento.tb_real?.toFixed(2) || '0.00'}`);
        console.log(`    Receita: R$ ${evento.real_r?.toFixed(2) || '0.00'}`);
        console.log(`    Clientes: ${evento.cl_real || 0}`);
        console.log(`    Calculado em: ${evento.calculado_em || 'N/A'}`);
        console.log('');
      });
    }

    if (eventosAindaSemDados.length > 0) {
      console.log('\n🚨 Eventos ainda com problema:');
      eventosAindaSemDados.slice(0, 5).forEach(evento => {
        console.log(`  - ${evento.data_evento}: ${evento.nome} (te_real: ${evento.te_real}, tb_real: ${evento.tb_real})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no recálculo:', error);
  }
}

// Executar o script
recalcularEventosAgosto();
