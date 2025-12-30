/**
 * Testar dados da Semana 52 através das APIs
 */

const BASE_URL = 'http://localhost:3000';
const BAR_ID = 1;

async function testarSemana52() {
  console.log('🔍 TESTANDO DADOS SEMANA 52\n');
  console.log('='.repeat(80));

  try {
    // 1. Testar API de Clientes Ativos para a semana 52
    console.log('\n📊 1. API /clientes-ativos (Semana 52)');
    console.log('-'.repeat(80));
    
    // Semana 52 de 2025: 22/12/2025 a 28/12/2025
    const dataInicioSemana52 = '2025-12-22';
    
    const url = `${BASE_URL}/api/clientes-ativos?periodo=semana&data_inicio=${dataInicioSemana52}&bar_id=${BAR_ID}`;
    console.log(`🌐 URL: ${url}\n`);
    
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      console.error('❌ Erro na API:', result.error);
      return;
    }

    const { data } = result;
    
    console.log(`📅 Período: ${data.label}`);
    console.log(`   Atual: ${data.periodoAtual.inicio} até ${data.periodoAtual.fim}`);
    console.log(`   Anterior: ${data.periodoAnterior.inicio} até ${data.periodoAnterior.fim}`);
    
    console.log(`\n👥 DADOS ATUAIS (Semana 52):`);
    console.log(`   Total de Clientes: ${data.atual.totalClientes}`);
    console.log(`   Novos Clientes: ${data.atual.novosClientes} (${data.atual.percentualNovos}%)`);
    console.log(`   Clientes Retornantes: ${data.atual.clientesRetornantes} (${data.atual.percentualRetornantes}%)`);
    console.log(`   Clientes Ativos: ${data.atual.clientesAtivos}`);
    
    console.log(`\n👥 DADOS ANTERIORES (Semana 51):`);
    console.log(`   Total de Clientes: ${data.anterior.totalClientes}`);
    console.log(`   Novos Clientes: ${data.anterior.novosClientes}`);
    console.log(`   Clientes Retornantes: ${data.anterior.clientesRetornantes}`);
    console.log(`   Clientes Ativos: ${data.anterior.clientesAtivos}`);
    
    console.log(`\n📈 VARIAÇÕES:`);
    console.log(`   Total: ${data.variacoes.total.toFixed(1)}%`);
    console.log(`   Novos: ${data.variacoes.novos.toFixed(1)}%`);
    console.log(`   Retornantes: ${data.variacoes.retornantes.toFixed(1)}%`);
    console.log(`   Ativos: ${data.variacoes.ativos.toFixed(1)}%`);

    if (data.fonte) {
      console.log(`\n📌 Fonte dos dados: ${data.fonte}`);
    }

    // Análise de problemas
    console.log(`\n\n🔍 ANÁLISE DE PROBLEMAS:`);
    console.log('-'.repeat(80));

    const problemas = [];

    if (data.atual.novosClientes === 0) {
      problemas.push('❌ PROBLEMA: Novos clientes = 0');
    }

    if (data.atual.clientesAtivos === data.anterior.clientesAtivos) {
      problemas.push('⚠️  ALERTA: Clientes ativos idênticos entre semanas (${data.atual.clientesAtivos})');
    }

    if (data.variacoes.ativos === 0) {
      problemas.push('⚠️  ALERTA: Variação de clientes ativos = 0%');
    }

    if (problemas.length > 0) {
      problemas.forEach(p => console.log(`   ${p}`));
    } else {
      console.log('   ✅ Nenhum problema detectado');
    }

    // 2. Testar alguns dias da semana 52
    console.log('\n\n📊 2. DADOS DIÁRIOS (Analítico Semanal)');
    console.log('-'.repeat(80));

    // Sexta (5) e Sábado (6) da semana 52
    const diasParaTestar = [
      { dia: 5, nome: 'Sexta', data: '2025-12-26' },
      { dia: 6, nome: 'Sábado', data: '2025-12-27' }
    ];

    for (const diaInfo of diasParaTestar) {
      console.log(`\n🔍 ${diaInfo.nome} (${diaInfo.data})`);
      
      const urlDia = `${BASE_URL}/api/analitico/semanal?barId=${BAR_ID}&diaSemana=${diaInfo.dia}`;
      
      try {
        const responseDia = await fetch(urlDia);
        const resultDia = await responseDia.json();

        if (resultDia.success && resultDia.data.semanas && resultDia.data.semanas.length > 0) {
          // Procurar pela semana com a data específica
          const semanaEspecifica = resultDia.data.semanas.find(s => s.data === diaInfo.data);
          
          if (semanaEspecifica) {
            console.log(`   ✅ Dados encontrados:`);
            console.log(`      Faturamento: R$ ${semanaEspecifica.faturamentoTotal.toFixed(2)}`);
            console.log(`      Total Clientes: ${semanaEspecifica.clientesTotais}`);
            console.log(`      Novos: ${semanaEspecifica.novosClientes}`);
            console.log(`      Ativos: ${semanaEspecifica.clientesAtivos}`);
            console.log(`      % Ativos: ${semanaEspecifica.percentualAtivos.toFixed(1)}%`);

            if (semanaEspecifica.clientesAtivos === 0) {
              console.log(`      ❌ PROBLEMA: Clientes ativos = 0 no dia!`);
            }
          } else {
            console.log(`   ⚠️  Dados não encontrados para ${diaInfo.data}`);
          }
        } else {
          console.log(`   ⚠️  Erro ou sem dados: ${resultDia.error || 'Sem dados'}`);
        }
      } catch (erroDia) {
        console.log(`   ❌ Erro ao buscar: ${erroDia.message}`);
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ Teste concluído\n');

  } catch (erro) {
    console.error('\n❌ ERRO GERAL:', erro.message);
    console.error(erro.stack);
  }
}

// Executar
testarSemana52();
