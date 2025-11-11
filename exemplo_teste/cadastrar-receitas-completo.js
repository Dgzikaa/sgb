#!/usr/bin/env node

/**
 * Script para cadastrar receitas com insumos vinculados
 * Processa base de receitas (pc#### = Produção Cozinha, pd#### = Produção Drinks)
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

// Dados das receitas (colados do usuário)
const RECEITAS_RAW = `
${fs.readFileSync(path.join(__dirname, 'receitas-base.txt'), 'utf-8')}
`.trim();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectarUnidade(quantidade, nomeInsumo, unidadePadrao) {
  const qStr = String(quantidade).toLowerCase();
  const nomeUpper = nomeInsumo.toUpperCase();
  
  // Baseado no nome do insumo
  if (nomeUpper.includes(' KG') || nomeUpper.endsWith('KG')) return 'kg';
  if (nomeUpper.includes(' G') && !nomeUpper.includes(' KG')) return 'g';
  if (nomeUpper.includes(' ML') || nomeUpper.match(/\d+ML/)) return 'ml';
  if (nomeUpper.includes(' L') && !nomeUpper.includes('ML')) return 'l';
  if (nomeUpper.includes('UND') || nomeUpper.includes('UNIDADE')) return 'unid';
  if (nomeUpper.includes('PCT') || nomeUpper.includes('PACOTE')) return 'pct';
  if (nomeUpper.includes('MÇ') || nomeUpper.includes('MAÇO')) return 'unid';
  if (nomeUpper.includes('BDJ') || nomeUpper.includes('BANDEJA')) return 'unid';
  
  // Se tem unidade padrão do insumo, usa
  if (unidadePadrao) return unidadePadrao;
  
  // Fallback: se quantidade > 100, provavelmente é g ou ml
  if (parseFloat(quantidade) >= 100) return 'g';
  
  return 'unid';
}

async function buscarInsumo(codigo) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos?busca=${codigo}`);
    if (response.ok) {
      const data = await response.json();
      const insumo = data.data?.find(i => i.codigo === codigo);
      return insumo;
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar insumo ${codigo}:`, error.message);
  }
  return null;
}

async function cadastrarReceita(receita) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receita),
    });
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`❌ Erro ao cadastrar receita ${receita.receita_codigo}:`, error.message);
    return null;
  }
}

async function main() {
  console.log(`🌐 URL da API: ${API_BASE_URL}`);
  console.log(`📦 BAR_ID: ${BAR_ID}\n`);
  console.log('🚀 Iniciando cadastro de receitas...\n');
  
  // Parse dos dados
  const linhas = RECEITAS_RAW.split('\n').filter(l => l.trim());
  const receitasMap = new Map();
  
  console.log(`📖 Processando ${linhas.length} linhas...\n`);
  
  for (const linha of linhas) {
    const partes = linha.split('\t').filter(p => p);
    if (partes.length < 3) continue;
    
    const codigoReceita = partes[0];
    const nomeReceita = partes[1];
    const codigoInsumo = partes[2];
    const nomeInsumo = partes[3] || '';
    const quantidade = partes[4] || '0';
    
    // Ignorar linhas sem código de receita válido
    if (!codigoReceita.match(/^(pc|pd|PC|PD)\d{4}$/i)) continue;
    
    const codigoNormalizado = codigoReceita.toLowerCase();
    
    if (!receitasMap.has(codigoNormalizado)) {
      // Detectar tipo_local e categoria
      const isProdCozinha = codigoNormalizado.startsWith('pc');
      const tipo_local = isProdCozinha ? 'cozinha' : 'bar';
      const categoria = isProdCozinha ? 'producao' : 'drinks';
      
      receitasMap.set(codigoNormalizado, {
        receita_codigo: codigoNormalizado,
        receita_nome: nomeReceita,
        receita_categoria: categoria,
        tipo_local: tipo_local,
        rendimento_esperado: 1,
        insumos: [],
        bar_id: BAR_ID,
        ativo: true,
      });
    }
    
    const receita = receitasMap.get(codigoNormalizado);
    
    // Adicionar insumo à receita
    if (codigoInsumo && codigoInsumo.trim()) {
      receita.insumos.push({
        codigo: codigoInsumo,
        nome: nomeInsumo,
        quantidade_necessaria: parseFloat(quantidade.replace(',', '.')) || 0,
        is_chefe: false, // Primeiro insumo será marcado como chefe depois
      });
    }
  }
  
  console.log(`✅ Total de receitas identificadas: ${receitasMap.size}\n`);
  
  // Buscar insumos e preparar para cadastro
  const receitas = Array.from(receitasMap.values());
  let processadas = 0;
  let sucesso = 0;
  let erros = 0;
  
  for (const receita of receitas) {
    processadas++;
    console.log(`\n[${processadas}/${receitas.length}] 📦 ${receita.receita_codigo} - ${receita.receita_nome}`);
    console.log(`   Insumos: ${receita.insumos.length}`);
    
    // Buscar informações dos insumos
    const insumosCompletos = [];
    for (const insumoReceita of receita.insumos) {
      const codigo = insumoReceita.codigo;
      
      // Se é código de receita (pc####, pd####), pular por enquanto
      if (codigo.match(/^(pc|pd)/i)) {
        console.log(`   ⚠️  ${codigo} - Receita dentro de receita (ignorado por enquanto)`);
        continue;
      }
      
      // Buscar insumo no banco
      const insumo = await buscarInsumo(codigo);
      
      if (insumo) {
        const unidade = detectarUnidade(
          insumoReceita.quantidade_necessaria,
          insumoReceita.nome,
          insumo.unidade_medida
        );
        
        insumosCompletos.push({
          insumo_id: insumo.id,
          codigo: insumo.codigo,
          nome: insumo.nome,
          quantidade_necessaria: insumoReceita.quantidade_necessaria,
          unidade_medida: unidade,
          is_chefe: false,
        });
      } else {
        console.log(`   ⚠️  ${codigo} - Insumo não encontrado`);
      }
      
      await delay(50); // Evitar sobrecarga
    }
    
    // Marcar primeiro insumo como chefe
    if (insumosCompletos.length > 0) {
      insumosCompletos[0].is_chefe = true;
    }
    
    // Preparar receita para cadastro
    const receitaParaCadastrar = {
      ...receita,
      insumos: insumosCompletos,
    };
    
    // Cadastrar receita
    if (insumosCompletos.length > 0) {
      const resultado = await cadastrarReceita(receitaParaCadastrar);
      
      if (resultado) {
        console.log(`   ✅ Receita cadastrada com ${insumosCompletos.length} insumos`);
        sucesso++;
      } else {
        console.log(`   ❌ Erro ao cadastrar receita`);
        erros++;
      }
    } else {
      console.log(`   ⚠️  Sem insumos válidos - receita ignorada`);
      erros++;
    }
    
    await delay(200); // Delay entre receitas
  }
  
  console.log(`\n============================================================`);
  console.log(`📊 RESUMO DO CADASTRO`);
  console.log(`============================================================`);
  console.log(`📦 Receitas processadas: ${processadas}`);
  console.log(`✅ Cadastradas com sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`============================================================\n`);
  
  console.log('✅ Importação concluída!\n');
}

main().catch(console.error);

