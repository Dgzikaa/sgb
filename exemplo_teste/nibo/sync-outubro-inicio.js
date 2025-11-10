#!/usr/bin/env node

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

console.log('🚀 SINCRONIZAÇÃO 01/10 a 06/10 (período faltante)');

async function sync() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/api_credentials?sistema=eq.nibo&bar_id=eq.3&ativo=eq.true&select=api_token`,
    { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }}
  );
  const apiToken = (await response.json())[0].api_token;
  
  const url = new URL('https://api.nibo.com.br/empresas/v1/schedules');
  url.searchParams.set('apitoken', apiToken);
  url.searchParams.set('$filter', 'accrualDate ge 2025-10-01 and accrualDate le 2025-10-06');
  url.searchParams.set('$top', '500');
  
  console.log('\n📥 Buscando dados...');
  const niboResponse = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'accept': 'application/json', 'apitoken': apiToken }
  });
  
  const data = await niboResponse.json();
  const agendamentos = data?.items || [];
  
  console.log(`✅ ${agendamentos.length} registros encontrados\n`);
  
  if (agendamentos.length === 0) return;
  
  const processedData = agendamentos.map(a => ({
    nibo_id: String(a.scheduleId || a.id),
    bar_id: 3,
    tipo: String(a.type || 'receita'),
    status: String(a.status || 'pendente'),
    valor: parseFloat(a.value || 0),
    valor_pago: parseFloat(a.paidValue || 0),
    data_vencimento: a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : null,
    data_pagamento: a.paymentDate ? new Date(a.paymentDate).toISOString().split('T')[0] : null,
    data_competencia: a.accrualDate ? new Date(a.accrualDate).toISOString().split('T')[0] : null,
    categoria_nome: String(a.category?.name || ''),
    stakeholder_nome: String(a.stakeholder?.name || ''),
    descricao: String(a.description || ''),
    data_atualizacao: a.updateDate ? new Date(a.updateDate).toISOString() : null,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }));
  
  console.log('💾 Inserindo no banco...');
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/nibo_agendamentos`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(processedData)
  });
  
  console.log(insertResponse.ok ? '✅ Dados inseridos!' : '⚠️ Alguns já existiam (duplicatas)');
  console.log('\n✅ Concluído!');
}

sync().catch(console.error);

