/**
 * Script para sincronizar dados retroativos do Sympla e Yuzer para domingos
 * Período: Agosto a Novembro 2025
 */

// Usar variável de ambiente ou pedir ao usuário
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida');
  console.error('');
  console.error('💡 Como usar:');
  console.error('   Windows PowerShell:');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="sua_chave_aqui"; node sync-retroativo-sympla-yuzer-domingos.js');
  console.error('');
  console.error('   Linux/Mac:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY="sua_chave_aqui" node sync-retroativo-sympla-yuzer-domingos.js');
  console.error('');
  process.exit(1);
}

/**
 * Buscar domingos sem dados Sympla/Yuzer
 */
async function buscarDomingosSemDados() {
  console.log('🔍 Buscando domingos sem dados Sympla/Yuzer...\n');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos_base?select=id,data_evento,nome,dia_semana,sympla_liquido,yuzer_liquido&dia_semana=in.(DOMINGO,Domingo)&data_evento=gte.2025-08-01&ativo=eq.true&order=data_evento.asc`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar eventos: ${response.statusText}`);
  }

  const eventos = await response.json();
  
  // Filtrar apenas domingos sem dados (sympla_liquido e yuzer_liquido = 0)
  const domingosSemDados = eventos.filter(e => 
    (parseFloat(e.sympla_liquido) === 0 || !e.sympla_liquido) && 
    (parseFloat(e.yuzer_liquido) === 0 || !e.yuzer_liquido)
  );

  console.log(`📊 Total de domingos: ${eventos.length}`);
  console.log(`⚠️  Sem dados Sympla/Yuzer: ${domingosSemDados.length}\n`);

  return domingosSemDados;
}

/**
 * Sincronizar Sympla para um período
 */
async function syncSympla(dataInicio, dataFim) {
  console.log(`🎪 Sincronizando Sympla: ${dataInicio} a ${dataFim}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sympla-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filtro_eventos: 'ordi',
        data_inicio: dataInicio,
        data_fim: dataFim,
        automated: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Erro Sympla: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ Sympla sincronizado:`, result.message || 'OK');
    return true;

  } catch (error) {
    console.error(`  ❌ Erro ao chamar Sympla Sync:`, error.message);
    return false;
  }
}

/**
 * Sincronizar Yuzer para um período
 */
async function syncYuzer(dataInicio, dataFim) {
  console.log(`🎮 Sincronizando Yuzer: ${dataInicio} a ${dataFim}`);

  // Converter formato de data para Yuzer (DD.MM.YYYY)
  const [anoI, mesI, diaI] = dataInicio.split('-');
  const [anoF, mesF, diaF] = dataFim.split('-');
  const dataInicioYuzer = `${diaI}.${mesI}.${anoI}`;
  const dataFimYuzer = `${diaF}.${mesF}.${anoF}`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/yuzer-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bar_id: 3,
        start_date: dataInicioYuzer,
        end_date: dataFimYuzer,
        automated: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Erro Yuzer: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ Yuzer sincronizado:`, result.message || 'OK');
    return true;

  } catch (error) {
    console.error(`  ❌ Erro ao chamar Yuzer Sync:`, error.message);
    return false;
  }
}

/**
 * Aguardar alguns segundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 SYNC RETROATIVO - SYMPLA & YUZER (DOMINGOS)\n');
  console.log('═'.repeat(60));

  try {
    // 1. Buscar domingos sem dados
    const domingos = await buscarDomingosSemDados();

    if (domingos.length === 0) {
      console.log('✅ Todos os domingos já têm dados!');
      return;
    }

    console.log('📅 Domingos a sincronizar:\n');
    domingos.forEach(d => {
      console.log(`  ${d.data_evento} - ${d.nome.substring(0, 40)}`);
    });
    console.log('\n' + '═'.repeat(60) + '\n');

    // 2. Agrupar por meses para sincronizar em lotes
    const meses = {};
    domingos.forEach(d => {
      const [ano, mes] = d.data_evento.split('-');
      const chave = `${ano}-${mes}`;
      if (!meses[chave]) {
        meses[chave] = [];
      }
      meses[chave].push(d);
    });

    // 3. Sincronizar por mês
    let totalSucesso = 0;
    let totalErro = 0;

    for (const [mesChave, eventosMes] of Object.entries(meses)) {
      const [ano, mes] = mesChave.split('-');
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const dataFim = `${ano}-${mes}-${ultimoDia}`;

      console.log(`\n📆 Processando ${mesChave} (${eventosMes.length} domingos)`);
      console.log('─'.repeat(60));

      // Sympla
      const symplaOk = await syncSympla(dataInicio, dataFim);
      await sleep(2000); // Aguardar 2s

      // Yuzer
      const yuzerOk = await syncYuzer(dataInicio, dataFim);
      await sleep(2000); // Aguardar 2s

      if (symplaOk && yuzerOk) {
        totalSucesso += eventosMes.length;
        console.log(`  ✅ Mês ${mesChave} sincronizado com sucesso!`);
      } else {
        totalErro += eventosMes.length;
        console.log(`  ⚠️  Mês ${mesChave} teve erros parciais`);
      }
    }

    // 4. Resumo final
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMO FINAL\n');
    console.log(`  ✅ Sucesso: ${totalSucesso} domingos`);
    console.log(`  ❌ Erros:   ${totalErro} domingos`);
    console.log(`  📅 Total:   ${domingos.length} domingos`);
    console.log('\n' + '═'.repeat(60));
    console.log('\n✨ Sincronização retroativa concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
main().catch(console.error);

