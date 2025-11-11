const fs = require('fs');
const path = require('path');

// ====================================
// CONFIGURAÇÕES
// ====================================
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

// ====================================
// INSUMOS FALTANTES IDENTIFICADOS
// ====================================
const INSUMOS_FALTANTES = [
  { codigo: 'i0210', nome: 'Água da Casa', tipo_local: 'cozinha', categoria: 'líquido', unidade_medida: 'l', custo_unitario: 0 },
  { codigo: 'i0160', nome: 'Salsinha', tipo_local: 'cozinha', categoria: 'tempero', unidade_medida: 'g', custo_unitario: 0.50 },
  { codigo: 'i0150', nome: 'Pimenta do reino em grão', tipo_local: 'cozinha', categoria: 'tempero', unidade_medida: 'g', custo_unitario: 0.80 },
  { codigo: 'i0165', nome: 'Tomate Extra', tipo_local: 'cozinha', categoria: 'hortifruti', unidade_medida: 'g', custo_unitario: 0.01 },
  { codigo: 'i0045', nome: 'Manjericão', tipo_local: 'cozinha', categoria: 'tempero', unidade_medida: 'g', custo_unitario: 0.60 },
  { codigo: 'i0301', nome: 'Polpa de Frutas Vermelhas', tipo_local: 'bar', categoria: 'polpa', unidade_medida: 'g', custo_unitario: 0.015 },
  { codigo: 'i0577', nome: 'Jabuticaba', tipo_local: 'bar', categoria: 'fruta', unidade_medida: 'g', custo_unitario: 0.02 },
];

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cadastra insumo via API
 */
async function cadastrarInsumo(insumo) {
  try {
    console.log(`📦 Cadastrando: ${insumo.codigo} - ${insumo.nome}`);

    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: insumo.codigo,
        nome: insumo.nome,
        tipo_local: insumo.tipo_local,
        categoria: insumo.categoria,
        unidade_medida: insumo.unidade_medida,
        custo_unitario: insumo.custo_unitario,
        observacoes: 'Cadastrado automaticamente via script de receitas',
        bar_id: BAR_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Verificar se já existe
      if (data.error && data.error.includes('já existe')) {
        console.log(`   ⚠️  ${insumo.codigo} já existe`);
        return { success: true, skipped: true };
      }
      
      console.error(`   ❌ Erro: ${data.error || 'Erro desconhecido'}`);
      return { success: false, error: data.error };
    }

    console.log(`   ✅ Cadastrado com sucesso!`);
    return { success: true, data: data.data };
  } catch (error) {
    console.error(`   ❌ Erro ao cadastrar ${insumo.codigo}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ====================================
// MAIN
// ====================================
async function main() {
  console.log('🚀 CADASTRO DE INSUMOS FALTANTES\n');
  console.log(`🌐 URL da API: ${API_BASE_URL}`);
  console.log(`🏢 Bar ID: ${BAR_ID}\n`);
  console.log(`📊 Total de insumos a cadastrar: ${INSUMOS_FALTANTES.length}\n`);

  let sucessos = 0;
  let erros = 0;
  let jaExistentes = 0;

  for (let i = 0; i < INSUMOS_FALTANTES.length; i++) {
    const insumo = INSUMOS_FALTANTES[i];
    
    console.log(`\n[${i + 1}/${INSUMOS_FALTANTES.length}]`);
    const resultado = await cadastrarInsumo(insumo);

    if (resultado.success) {
      if (resultado.skipped) {
        jaExistentes++;
      } else {
        sucessos++;
      }
    } else {
      erros++;
    }

    await delay(100);
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Insumos cadastrados com sucesso: ${sucessos}`);
  console.log(`⚠️  Insumos já existentes: ${jaExistentes}`);
  console.log(`❌ Insumos com erro: ${erros}`);
  console.log(`📦 Total processado: ${INSUMOS_FALTANTES.length}`);
  console.log('='.repeat(60) + '\n');

  if (erros === 0) {
    console.log('✅ Todos os insumos foram cadastrados!');
    console.log('🎯 Agora você pode executar novamente o script de receitas:\n');
    console.log('   node exemplo_teste/cadastrar-receitas-estruturado.js\n');
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

