#!/usr/bin/env node

/**
 * SINCRONIZAÇÃO DIRETA - NOVEMBRO 2025
 * 
 * Este script busca dados diretamente da API do Nibo
 * e insere no banco, contornando a Edge Function com bug.
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

console.log('🚀 SINCRONIZAÇÃO DIRETA - NOVEMBRO 2025');
console.log('=' .repeat(60));

async function getCredenciais() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/api_credentials?sistema=eq.nibo&bar_id=eq.3&ativo=eq.true&select=api_token`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Erro ao buscar credenciais');
  }
  
  const dados = await response.json();
  if (!dados || dados.length === 0) {
    throw new Error('Credenciais não encontradas');
  }
  
  return dados[0].api_token;
}

async function buscarAgendamentosNibo(apiToken, startDate, endDate) {
  console.log(`\n📥 Buscando agendamentos do Nibo entre ${startDate} e ${endDate}...`);
  
  const allAgendamentos = [];
  let skip = 0;
  const top = 100;
  let hasMore = true;
  let pageCount = 0;
  
  while (hasMore && pageCount < 10) { // Máximo 10 páginas = 1000 registros
    pageCount++;
    
    const url = new URL('https://api.nibo.com.br/empresas/v1/schedules');
    url.searchParams.set('apitoken', apiToken);
    url.searchParams.set('$filter', `accrualDate ge ${startDate} and accrualDate le ${endDate}`);
    url.searchParams.set('$orderby', 'accrualDate desc');
    url.searchParams.set('$top', top.toString());
    url.searchParams.set('$skip', skip.toString());
    
    console.log(`  📄 Página ${pageCount}: buscando...`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': apiToken
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Nibo: ${response.status}`);
    }
    
    const data = await response.json();
    const items = data?.items || [];
    
    if (items.length === 0) {
      hasMore = false;
      break;
    }
    
    allAgendamentos.push(...items);
    console.log(`  ✅ Página ${pageCount}: ${items.length} registros`);
    
    if (items.length < top) {
      hasMore = false;
    } else {
      skip += top;
    }
    
    // Pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Total de agendamentos encontrados: ${allAgendamentos.length}`);
  return allAgendamentos;
}

async function inserirAgendamentos(agendamentos) {
  console.log(`\n💾 Inserindo ${agendamentos.length} agendamentos no banco...`);
  
  const batchSize = 50;
  let inseridos = 0;
  let erros = 0;
  
  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize);
    
    const processedBatch = batch.map(agendamento => ({
      nibo_id: String(agendamento.scheduleId || agendamento.id || ''),
      bar_id: 3,
      tipo: String(agendamento.type || 'receita'),
      status: String(agendamento.status || 'pendente'),
      valor: parseFloat(agendamento.value || 0),
      valor_pago: parseFloat(agendamento.paidValue || 0),
      data_vencimento: agendamento.dueDate ? new Date(agendamento.dueDate).toISOString().split('T')[0] : null,
      data_pagamento: agendamento.paymentDate ? new Date(agendamento.paymentDate).toISOString().split('T')[0] : null,
      data_competencia: agendamento.accrualDate ? new Date(agendamento.accrualDate).toISOString().split('T')[0] : null,
      descricao: String(agendamento.description || ''),
      observacoes: String(agendamento.notes || ''),
      categoria_id: String(agendamento.category?.id || ''),
      categoria_nome: String(agendamento.category?.name || ''),
      stakeholder_id: String(agendamento.stakeholder?.id || ''),
      stakeholder_nome: String(agendamento.stakeholder?.name || ''),
      stakeholder_tipo: String(agendamento.stakeholder?.type || ''),
      conta_bancaria_id: String(agendamento.bankAccount?.id || ''),
      conta_bancaria_nome: String(agendamento.bankAccount?.name || ''),
      centro_custo_id: String(agendamento.costCenter?.id || ''),
      centro_custo_nome: String(agendamento.costCenter?.name || ''),
      numero_documento: String(agendamento.documentNumber || ''),
      numero_parcela: parseInt(agendamento.installmentNumber) || null,
      total_parcelas: parseInt(agendamento.totalInstallments) || null,
      recorrente: Boolean(agendamento.recurring),
      frequencia_recorrencia: String(agendamento.recurrenceFrequency || ''),
      data_atualizacao: agendamento.updateDate ? new Date(agendamento.updateDate).toISOString() : null,
      usuario_atualizacao: String(agendamento.updateUser || ''),
      titulo: String(agendamento.title || ''),
      anexos: agendamento.attachments || null,
      tags: agendamento.tags || null,
      recorrencia_config: agendamento.recurrenceConfig || null,
      deletado: Boolean(agendamento.deleted),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }));
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nibo_agendamentos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(processedBatch)
      });
      
      if (response.ok) {
        inseridos += processedBatch.length;
        console.log(`  ✅ Batch ${Math.floor(i/batchSize) + 1}: ${processedBatch.length} registros inseridos`);
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Batch ${Math.floor(i/batchSize) + 1}: Erro - ${errorText.substring(0, 100)}`);
        erros += processedBatch.length;
      }
    } catch (error) {
      console.log(`  ❌ Batch ${Math.floor(i/batchSize) + 1}: Erro - ${error.message}`);
      erros += processedBatch.length;
    }
    
    // Pausa entre batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Inserção concluída: ${inseridos} inseridos, ${erros} erros`);
  return { inseridos, erros };
}

async function verificarResultado() {
  console.log('\n🔍 Verificando resultado no banco...');
  
  // Verificar novembro
  const novResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&select=categoria_nome,stakeholder_nome,valor,data_competencia`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    }
  );
  
  if (novResponse.ok) {
    const dados = await novResponse.json();
    const countHeader = novResponse.headers.get('content-range');
    
    console.log(`\n📊 Total em Novembro 2025: ${countHeader}`);
    
    // Agrupar por categoria
    const categorias = {};
    dados.forEach(item => {
      const cat = item.categoria_nome || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });
    
    console.log('\n📋 Por categoria:');
    Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  • ${cat}: ${count} registros`);
      });
    
    // Mostrar atrações
    const atracoes = dados.filter(d => d.categoria_nome === 'Atrações Programação');
    if (atracoes.length > 0) {
      console.log('\n🎭 Atrações Programação:');
      atracoes.forEach(a => {
        console.log(`  • ${a.data_competencia}: ${a.stakeholder_nome} - R$ ${a.valor}`);
      });
      const total = atracoes.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);
      console.log(`  📊 TOTAL ATRAÇÕES: R$ ${total.toFixed(2)}`);
    }
    
    // Mostrar produção
    const producao = dados.filter(d => d.categoria_nome === 'Produção Eventos');
    if (producao.length > 0) {
      console.log('\n🎬 Produção Eventos:');
      producao.forEach(p => {
        console.log(`  • ${p.data_competencia}: ${p.stakeholder_nome} - R$ ${p.valor}`);
      });
      const total = producao.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
      console.log(`  📊 TOTAL PRODUÇÃO: R$ ${total.toFixed(2)}`);
    }
  }
}

async function sync() {
  try {
    // 1. Buscar credenciais
    console.log('\n🔐 Buscando credenciais do Nibo...');
    const apiToken = await getCredenciais();
    console.log('✅ Credenciais encontradas');
    
    // 2. Definir período - Agosto a Dezembro 2025
    const startDate = '2025-08-01';
    const endDate = '2025-12-31';
    
    // 3. Buscar agendamentos do Nibo
    const agendamentos = await buscarAgendamentosNibo(apiToken, startDate, endDate);
    
    if (agendamentos.length === 0) {
      console.log('\n⚠️ Nenhum agendamento encontrado no período');
      return;
    }
    
    // 4. Inserir no banco
    await inserirAgendamentos(agendamentos);
    
    // 5. Verificar resultado
    await verificarResultado();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Sincronização direta concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro na sincronização:', error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  sync().catch(console.error);
}

