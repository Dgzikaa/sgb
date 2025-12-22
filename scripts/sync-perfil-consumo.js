/**
 * Script para sincronizar perfis de consumo dos clientes
 * Usa dados do contahub_analitico para criar perfis detalhados
 * 
 * LÓGICA DE CRUZAMENTO (descoberta em 16/12/2025):
 * - Para itens com vd_mesadesc numérico: cruzar direto com vendas.vd_mesadesc
 * - Para itens de Insumo: cruzar via comandaorigem com vendas.vd_mesadesc
 * 
 * Uso: 
 *   cd F:\Zykor\frontend
 *   node ../scripts/sync-perfil-consumo.js
 */

const fs = require('fs');
const path = require('path');

// Carregar .env.local
function loadEnvFile(envPath) {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
    console.log('✅ Variáveis de ambiente carregadas');
  } catch (e) {
    console.log('⚠️ Não foi possível carregar .env.local:', e.message);
  }
}

const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(__dirname, '..', 'frontend', '.env.local')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadEnvFile(envPath);
    break;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BAR_ID = 3;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis SUPABASE não encontradas!');
  process.exit(1);
}

// Função para buscar dados via REST API
async function fetchData(table, params = '') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar ${table}: ${response.statusText}`);
  }
  return response.json();
}

// Função para inserir/atualizar dados
async function upsertData(table, data, onConflict = '') {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates'
  };
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao inserir em ${table}: ${error}`);
  }
  return response;
}

function normalizarTelefone(tel) {
  if (!tel) return null;
  const numeros = tel.replace(/\D/g, '');
  if (numeros.length < 10) return null;
  if (numeros.length === 13 && numeros.startsWith('55')) {
    return numeros.slice(2);
  }
  if (numeros.length === 11 || numeros.length === 10) {
    return numeros;
  }
  return null;
}

async function main() {
  console.log('🚀 Iniciando sincronização de perfis de consumo...');
  console.log(`🏪 Bar ID: ${BAR_ID}`);
  console.log('');

  try {
    // 1. Buscar vendas COM PAGINAÇÃO para mapear comandas -> clientes
    console.log('📊 Buscando dados de vendas...');
    
    let vendas = [];
    let vendasOffset = 0;
    const vendasBatchSize = 5000;
    
    while (true) {
      const batch = await fetchData('contahub_vendas', 
        `bar_id=eq.${BAR_ID}&cli_fone=not.is.null&cli_fone=neq.&select=cli_fone,cli_nome,cli_email,vd_mesadesc,dt_gerencial,trn,vr_pagamentos&order=id&limit=${vendasBatchSize}&offset=${vendasOffset}`
      );
      
      if (batch.length === 0) break;
      
      vendas = vendas.concat(batch);
      vendasOffset += vendasBatchSize;
      process.stdout.write(`   📋 ${vendas.length} vendas carregadas...\r`);
    }
    
    console.log(`\n   ✅ ${vendas.length} vendas com telefone encontradas`);
    
    // 2. Criar mapa de cliente e mapa de mesa+data+turno -> telefone
    console.log('\n🔗 Criando mapas de cruzamento...');
    
    const clienteDataMap = new Map();
    const mesaDataTurnoMap = new Map();
    
    for (const v of vendas) {
      const telefone = normalizarTelefone(v.cli_fone);
      if (!telefone) continue;
      
      // Mapa de cliente
      if (!clienteDataMap.has(telefone)) {
        clienteDataMap.set(telefone, {
          telefone,
          telefone_original: v.cli_fone,
          nome: v.cli_nome || '',
          email: v.cli_email || '',
          produtos: {},
          categorias: {},
          visitas: new Set(),
          dias_semana: {},
          total_valor: 0,
          total_itens: 0
        });
      }
      
      const cliente = clienteDataMap.get(telefone);
      
      // Atualizar nome se o atual for mais completo
      if (v.cli_nome && v.cli_nome.length > cliente.nome.length) {
        cliente.nome = v.cli_nome;
      }
      
      // Registrar visita
      const dataVisita = v.dt_gerencial?.split('T')[0];
      if (dataVisita) {
        cliente.visitas.add(dataVisita);
        cliente.total_valor += parseFloat(v.vr_pagamentos) || 0;
        
        // Contar dia da semana
        const dia = new Date(v.dt_gerencial).toLocaleDateString('pt-BR', { weekday: 'long' });
        cliente.dias_semana[dia] = (cliente.dias_semana[dia] || 0) + 1;
      }
      
      // Mapa de mesa+data+turno -> telefone
      // vd_mesadesc pode ser numérico (1820) ou com prefixo (X Bia)
      if (v.vd_mesadesc && v.dt_gerencial && v.trn) {
        const mesa = v.vd_mesadesc.toString().trim();
        const data = v.dt_gerencial.split('T')[0];
        const turno = v.trn;
        
        // Chave: "mesa|data|turno"
        const chave = `${mesa}|${data}|${turno}`;
        mesaDataTurnoMap.set(chave, telefone);
      }
    }
    
    console.log(`   👥 ${clienteDataMap.size} clientes únicos identificados`);
    console.log(`   🗺️ ${mesaDataTurnoMap.size} mapeamentos mesa+data+turno criados`);
    
    // 3. Buscar dados do analítico para produtos consumidos
    console.log('\n📦 Buscando produtos consumidos do analítico...');
    
    let offset = 0;
    const batchSize = 5000;
    let totalAnalitico = 0;
    let cruzadosDireto = 0;
    let cruzadosInsumo = 0;
    let naoNumerico = 0;
    let semMatch = 0;
    
    while (true) {
      const analitico = await fetchData('contahub_analitico',
        `bar_id=eq.${BAR_ID}&select=vd_mesadesc,comandaorigem,prd_desc,grp_desc,qtd,valorfinal,trn_dtgerencial,trn&limit=${batchSize}&offset=${offset}`
      );
      
      if (analitico.length === 0) break;
      
      for (const item of analitico) {
        const data = item.trn_dtgerencial?.split('T')[0];
        const turno = item.trn;
        
        if (!data || !turno) continue;
        
        let telefone = null;
        let tipoMatch = '';
        
        const vdMesa = (item.vd_mesadesc || '').toString().trim();
        const comandaOrigem = (item.comandaorigem || '').toString().trim();
        
        // LÓGICA DE CRUZAMENTO:
        // 1. Se vd_mesadesc é numérico, cruzar direto
        if (/^\d+$/.test(vdMesa)) {
          const chave = `${vdMesa}|${data}|${turno}`;
          telefone = mesaDataTurnoMap.get(chave);
          if (telefone) {
            tipoMatch = 'direto';
            cruzadosDireto++;
          }
        }
        // 2. Se vd_mesadesc é "Insumo", usar comandaorigem
        else if (vdMesa === 'Insumo' && /^\d+$/.test(comandaOrigem)) {
          const chave = `${comandaOrigem}|${data}|${turno}`;
          telefone = mesaDataTurnoMap.get(chave);
          if (telefone) {
            tipoMatch = 'insumo';
            cruzadosInsumo++;
          }
        }
        // 3. Outros casos (funcionários, etc)
        else {
          naoNumerico++;
        }
        
        if (!telefone) {
          if (tipoMatch === '') continue; // Era funcionário ou outro
          semMatch++;
          continue;
        }
        
        if (!clienteDataMap.has(telefone)) continue;
        
        const cliente = clienteDataMap.get(telefone);
        const produto = item.prd_desc || 'Desconhecido';
        const categoria = item.grp_desc || 'Outros';
        const qtd = parseFloat(item.qtd) || 1;
        const valor = parseFloat(item.valorfinal) || 0;
        
        // Agregar produto
        if (!cliente.produtos[produto]) {
          cliente.produtos[produto] = { qtd: 0, vezes: 0, categoria };
        }
        cliente.produtos[produto].qtd += qtd;
        cliente.produtos[produto].vezes += 1;
        
        // Agregar categoria
        if (!cliente.categorias[categoria]) {
          cliente.categorias[categoria] = { qtd: 0, valor: 0 };
        }
        cliente.categorias[categoria].qtd += qtd;
        cliente.categorias[categoria].valor += valor;
        
        cliente.total_itens += qtd;
      }
      
      totalAnalitico += analitico.length;
      offset += batchSize;
      
      const totalCruzados = cruzadosDireto + cruzadosInsumo;
      const percent = totalAnalitico > 0 ? (totalCruzados / totalAnalitico * 100).toFixed(1) : '0';
      process.stdout.write(`   📊 ${totalAnalitico} itens processados, ${totalCruzados} cruzados (${percent}%)...\r`);
    }
    
    const totalCruzados = cruzadosDireto + cruzadosInsumo;
    const percentTotal = totalAnalitico > 0 ? (totalCruzados / totalAnalitico * 100).toFixed(1) : '0';
    
    console.log(`\n   ✅ ${totalAnalitico} itens do analítico processados`);
    console.log(`   🔗 ${totalCruzados} itens cruzados com clientes (${percentTotal}%)`);
    console.log(`      📌 ${cruzadosDireto} via vd_mesadesc direto`);
    console.log(`      📌 ${cruzadosInsumo} via comandaorigem (insumos)`);
    console.log(`      ⏭️ ${naoNumerico} funcionários/outros (ignorados)`);
    console.log(`      ❓ ${semMatch} sem match encontrado`);
    
    // 4. Gerar perfis
    console.log('\n🏷️ Gerando perfis de consumo...');
    
    const perfis = [];
    
    for (const [telefone, cliente] of clienteDataMap) {
      // Top 5 produtos favoritos
      const produtosFavoritos = Object.entries(cliente.produtos)
        .map(([produto, data]) => ({
          produto,
          categoria: data.categoria,
          quantidade: data.qtd,
          vezes_pediu: data.vezes
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
      
      // Top 3 categorias favoritas
      const categoriasFavoritas = Object.entries(cliente.categorias)
        .map(([categoria, data]) => ({
          categoria,
          quantidade: data.qtd,
          valor_total: data.valor
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 3);
      
      // Gerar tags
      const tags = [];
      
      // Tags por categoria principal
      if (categoriasFavoritas.length > 0) {
        const catPrincipal = categoriasFavoritas[0].categoria.toLowerCase();
        if (catPrincipal.includes('cerveja') || catPrincipal.includes('chopp')) {
          tags.push('cervejeiro');
        }
        if (catPrincipal.includes('vinho')) {
          tags.push('apreciador_vinho');
        }
        if (catPrincipal.includes('drink') || catPrincipal.includes('cocktail') || catPrincipal.includes('gin') || catPrincipal.includes('dose')) {
          tags.push('drinks_lover');
        }
        if (catPrincipal.includes('comida') || catPrincipal.includes('porcao') || catPrincipal.includes('petisco') || catPrincipal.includes('prato')) {
          tags.push('foodie');
        }
      }
      
      // Tags por produto específico
      for (const prod of produtosFavoritos) {
        const prodLower = prod.produto.toLowerCase();
        if (prodLower.includes('spaten') && !tags.includes('prefere_spaten')) {
          tags.push('prefere_spaten');
        }
        if (prodLower.includes('heineken') && !tags.includes('prefere_heineken')) {
          tags.push('prefere_heineken');
        }
        if (prodLower.includes('gin') && !tags.includes('gin_lover')) {
          tags.push('gin_lover');
        }
        if (prodLower.includes('original') && !tags.includes('prefere_original')) {
          tags.push('prefere_original');
        }
      }
      
      // Tags por frequência
      const visitas = cliente.visitas.size;
      if (visitas >= 10) {
        tags.push('cliente_vip');
      } else if (visitas >= 5) {
        tags.push('cliente_frequente');
      }
      
      // Dias preferidos
      const diasPreferidos = Object.entries(cliente.dias_semana)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([dia]) => dia);
      
      if (diasPreferidos.some(d => d.includes('sexta') || d.includes('sábado'))) {
        tags.push('fim_de_semana');
      }
      
      // Calcular datas
      const visitasArray = Array.from(cliente.visitas).sort();
      const primeiraVisita = visitasArray[0] || null;
      const ultimaVisita = visitasArray[visitasArray.length - 1] || null;
      
      // Calcular frequência mensal (visitas por mês)
      let frequenciaMensal = 0;
      if (primeiraVisita && ultimaVisita) {
        const meses = Math.max(1, (new Date(ultimaVisita) - new Date(primeiraVisita)) / (1000 * 60 * 60 * 24 * 30));
        frequenciaMensal = visitas / meses;
      }
      
      perfis.push({
        bar_id: BAR_ID,
        telefone,
        nome: cliente.nome,
        email: cliente.email || null,
        total_visitas: visitas,
        total_itens_consumidos: Math.round(cliente.total_itens),
        valor_total_consumo: cliente.total_valor,
        primeira_visita: primeiraVisita,
        ultima_visita: ultimaVisita,
        produtos_favoritos: produtosFavoritos,
        categorias_favoritas: categoriasFavoritas,
        tags,
        ticket_medio_consumo: visitas > 0 ? cliente.total_valor / visitas : 0,
        frequencia_mensal: frequenciaMensal,
        dias_preferidos: diasPreferidos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`   ✅ ${perfis.length} perfis gerados`);
    
    // 5. Salvar no banco
    console.log('\n💾 Salvando perfis no banco...');
    
    // Deletar perfis antigos
    await fetch(`${SUPABASE_URL}/rest/v1/cliente_perfil_consumo?bar_id=eq.${BAR_ID}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    // Inserir em batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < perfis.length; i += BATCH_SIZE) {
      const batch = perfis.slice(i, i + BATCH_SIZE);
      await upsertData('cliente_perfil_consumo', batch);
      process.stdout.write(`   💾 ${Math.min(i + BATCH_SIZE, perfis.length)}/${perfis.length} salvos...\r`);
    }
    
    // Estatísticas finais
    const clientesComProdutos = perfis.filter(p => p.total_itens_consumidos > 0).length;
    const clientesVIP = perfis.filter(p => p.tags.includes('cliente_vip')).length;
    const clientesFrequentes = perfis.filter(p => p.tags.includes('cliente_frequente')).length;
    const clientesComTags = perfis.filter(p => p.tags.length > 0).length;
    
    console.log(`\n\n🎉 Sincronização concluída!`);
    console.log(`   👥 ${perfis.length} perfis de consumo criados`);
    console.log(`   📦 ${clientesComProdutos} clientes com produtos mapeados`);
    console.log(`   🏷️ ${clientesComTags} clientes com tags`);
    console.log(`   ⭐ ${clientesVIP} clientes VIP (10+ visitas)`);
    console.log(`   ✨ ${clientesFrequentes} clientes frequentes (5-9 visitas)`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
