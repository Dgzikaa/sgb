#!/usr/bin/env node

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

console.log('🚀 SINCRONIZAÇÃO OUTUBRO 2025 COMPLETO (01/10 a 31/10)');
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
  
  const dados = await response.json();
  return dados[0].api_token;
}

async function buscarAgendamentosNibo(apiToken, startDate, endDate) {
  console.log(`\n📥 Buscando agendamentos do Nibo entre ${startDate} e ${endDate}...`);
  
  const allAgendamentos = [];
  let skip = 0;
  const top = 100;
  let hasMore = true;
  let pageCount = 0;
  
  while (hasMore && pageCount < 20) {
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
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Total: ${allAgendamentos.length} agendamentos`);
  return allAgendamentos;
}

async function inserirAgendamentos(agendamentos) {
  console.log(`\n💾 Inserindo ${agendamentos.length} agendamentos...`);
  
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
        console.log(`  ✅ Batch ${Math.floor(i/batchSize) + 1}: ${processedBatch.length} registros`);
      } else {
        erros += processedBatch.length;
      }
    } catch (error) {
      erros += processedBatch.length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Resultado: ${inseridos} inseridos, ${erros} erros`);
  return { inseridos, erros };
}

async function sync() {
  try {
    console.log('\n🔐 Buscando credenciais...');
    const apiToken = await getCredenciais();
    console.log('✅ Credenciais encontradas');
    
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';
    
    const agendamentos = await buscarAgendamentosNibo(apiToken, startDate, endDate);
    
    if (agendamentos.length === 0) {
      console.log('\n⚠️ Nenhum agendamento encontrado');
      return;
    }
    
    await inserirAgendamentos(agendamentos);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Sincronização de outubro completa!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  sync().catch(console.error);
}

