/**
 * 🧪 TESTE: Clientes Ativos - 90 dias vs 30 dias
 * 
 * Simula o cálculo de clientes ativos considerando:
 * - Período atual: 30 dias (2+ visitas)
 * - Período proposto: 90 dias (2+ visitas)
 * 
 * Dados reais do bar_id = 3 (Ordinário)
 */

// Simulação baseada nos dados reais consultados
const dadosReais = {
  ultimos30Dias: {
    totalClientesUnicos: 8290,
    clientesAtivos: 530,
    taxaRetencao: 6.39
  },
  ultimos90Dias: {
    totalClientesUnicos: 22508,
    clientesAtivos: 2893,
    taxaRetencao: 12.85
  }
};

// Distribuição de visitas nos últimos 90 dias
const distribuicaoVisitas90Dias = [
  { visitas: 1, clientes: 19615, percentual: 87.15 },
  { visitas: 2, clientes: 2079, percentual: 9.24 },
  { visitas: 3, clientes: 482, percentual: 2.14 },
  { visitas: 4, clientes: 176, percentual: 0.78 },
  { visitas: 5, clientes: 74, percentual: 0.33 },
  { visitas: 6, clientes: 38, percentual: 0.17 },
  { visitas: 7, clientes: 10, percentual: 0.04 },
  { visitas: 8, clientes: 10, percentual: 0.04 },
  { visitas: 9, clientes: 6, percentual: 0.03 },
  { visitas: 10, clientes: 6, percentual: 0.03 }
];

console.log('🧪 TESTE: CLIENTES ATIVOS - COMPARAÇÃO 30 vs 90 DIAS');
console.log('=' .repeat(60));

console.log('\n📊 RESULTADOS ATUAIS (30 DIAS):');
console.log(`• Total de Clientes Únicos: ${dadosReais.ultimos30Dias.totalClientesUnicos.toLocaleString('pt-BR')}`);
console.log(`• Clientes Ativos (2+ visitas): ${dadosReais.ultimos30Dias.clientesAtivos.toLocaleString('pt-BR')}`);
console.log(`• Taxa de Retenção: ${dadosReais.ultimos30Dias.taxaRetencao}%`);

console.log('\n📈 RESULTADOS PROPOSTOS (90 DIAS):');
console.log(`• Total de Clientes Únicos: ${dadosReais.ultimos90Dias.totalClientesUnicos.toLocaleString('pt-BR')}`);
console.log(`• Clientes Ativos (2+ visitas): ${dadosReais.ultimos90Dias.clientesAtivos.toLocaleString('pt-BR')}`);
console.log(`• Taxa de Retenção: ${dadosReais.ultimos90Dias.taxaRetencao}%`);

console.log('\n🔍 ANÁLISE COMPARATIVA:');
const diferencaClientes = dadosReais.ultimos90Dias.clientesAtivos - dadosReais.ultimos30Dias.clientesAtivos;
const diferencaTaxa = dadosReais.ultimos90Dias.taxaRetencao - dadosReais.ultimos30Dias.taxaRetencao;
const multiplicadorClientes = (dadosReais.ultimos90Dias.clientesAtivos / dadosReais.ultimos30Dias.clientesAtivos).toFixed(1);

console.log(`• Diferença de Clientes Ativos: +${diferencaClientes.toLocaleString('pt-BR')} (${multiplicadorClientes}x mais)`);
console.log(`• Diferença na Taxa de Retenção: +${diferencaTaxa.toFixed(2)} pontos percentuais`);
console.log(`• Aumento percentual: +${((diferencaTaxa / dadosReais.ultimos30Dias.taxaRetencao) * 100).toFixed(1)}%`);

console.log('\n📋 DISTRIBUIÇÃO DE VISITAS (90 DIAS):');
console.log('Visitas | Clientes | % do Total');
console.log('-'.repeat(35));

distribuicaoVisitas90Dias.forEach(item => {
  const status = item.visitas >= 2 ? '✅ ATIVO' : '❌ Inativo';
  console.log(`${item.visitas.toString().padStart(7)} | ${item.clientes.toString().padStart(8)} | ${item.percentual.toString().padStart(6)}% ${status}`);
});

// Calcular clientes ativos (2+ visitas)
const clientesAtivos90d = distribuicaoVisitas90Dias
  .filter(item => item.visitas >= 2)
  .reduce((sum, item) => sum + item.clientes, 0);

console.log('-'.repeat(35));
console.log(`TOTAL ATIVOS: ${clientesAtivos90d.toLocaleString('pt-BR')} clientes`);

console.log('\n💡 INSIGHTS:');
console.log('• Período de 90 dias captura muito mais clientes ativos');
console.log('• Taxa de retenção dobra (6.39% → 12.85%)');
console.log('• 87.15% dos clientes visitam apenas 1 vez em 90 dias');
console.log('• Apenas 12.85% são verdadeiramente "ativos" (2+ visitas)');

console.log('\n🎯 RECOMENDAÇÃO:');
console.log('✅ USAR 90 DIAS para clientes ativos é mais representativo');
console.log('✅ Fornece uma visão mais realista da fidelização');
console.log('✅ Permite identificar melhor os clientes recorrentes');

console.log('\n🔧 IMPLEMENTAÇÃO SUGERIDA:');
console.log(`
// Alterar de 30 para 90 dias no código:
const dataLimite90Dias = new Date();
dataLimite90Dias.setDate(dataLimite90Dias.getDate() - 90); // ← Era 30

const { data: clientesAtivosData } = await supabase
  .from('contahub_periodo')
  .select('cli_fone')
  .eq('bar_id', barIdNum)
  .gte('dt_gerencial', dataLimite90Dias.toISOString().split('T')[0])
  .not('cli_fone', 'is', null);
`);

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE CONCLUÍDO');
