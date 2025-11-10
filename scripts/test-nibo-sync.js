#!/usr/bin/env node

/**
 * SCRIPT DE TESTE - SINCRONIZAÇÃO NIBO
 * 
 * Este script testa a sincronização do Nibo passo a passo
 * para identificar onde está o gargalo.
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

console.log('🚀 INICIANDO TESTES DE SINCRONIZAÇÃO NIBO');
console.log('=' .repeat(60));

// TESTE 1: Verificar conectividade básica com Supabase
async function teste1_conectividade() {
  console.log('\n📡 TESTE 1: Conectividade com Supabase');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/api_credentials?sistema=eq.nibo&bar_id=eq.3&select=id,ativo`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conectividade OK');
      console.log('📊 Credenciais encontradas:', data.length);
      return { success: true, data };
    } else {
      console.log('❌ Erro na conectividade:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ Erro na conectividade:', error.message);
    return { success: false, error: error.message };
  }
}

// TESTE 2: Chamar Edge Function de sincronização completa
async function teste2_edge_function_sync() {
  console.log('\n🔄 TESTE 2: Edge Function Nibo Sync (Modo Completo)');
  console.log('-'.repeat(60));
  
  try {
    console.log('📤 Chamando nibo-sync com sync_mode=daily_complete...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/nibo-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        barId: '3',
        cronSecret: 'manual_test',
        sync_mode: 'daily_complete' // Sincronização completa dos últimos 3 meses
      })
    });
    
    const responseText = await response.text();
    console.log('📥 Status:', response.status);
    console.log('📥 Response:', responseText.substring(0, 500));
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Sincronização executada');
      console.log('📊 Resultado:', JSON.stringify(result, null, 2));
      return { success: true, result };
    } else {
      console.log('❌ Erro na sincronização:', response.status);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.log('❌ Erro na sincronização:', error.message);
    return { success: false, error: error.message };
  }
}

// TESTE 3: Verificar se dados foram inseridos
async function teste3_verificar_dados() {
  console.log('\n🔍 TESTE 3: Verificar dados inseridos no banco');
  console.log('-'.repeat(60));
  
  try {
    // Aguardar alguns segundos para processamento
    console.log('⏳ Aguardando 5 segundos para processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar última sincronização
    const logResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_logs_sincronizacao?bar_id=eq.3&order=data_inicio.desc&limit=1&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    
    if (logResponse.ok) {
      const logs = await logResponse.json();
      console.log('📊 Último log de sincronização:');
      console.log(JSON.stringify(logs[0], null, 2));
    }
    
    // Verificar agendamentos de novembro 2025
    const agendamentosResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&select=count`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (agendamentosResponse.ok) {
      const countHeader = agendamentosResponse.headers.get('content-range');
      console.log('\n📊 Agendamentos em Novembro 2025:', countHeader);
    }
    
    // Verificar especificamente Atrações Programação
    const atracoesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&categoria_nome=eq.Atrações Programação&select=count`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (atracoesResponse.ok) {
      const countHeader = atracoesResponse.headers.get('content-range');
      console.log('📊 Atrações Programação em Novembro 2025:', countHeader);
    }
    
    // Verificar Produção Eventos
    const producaoResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&categoria_nome=eq.Produção Eventos&select=count`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (producaoResponse.ok) {
      const countHeader = producaoResponse.headers.get('content-range');
      console.log('📊 Produção Eventos em Novembro 2025:', countHeader);
    }
    
    return { success: true };
  } catch (error) {
    console.log('❌ Erro ao verificar dados:', error.message);
    return { success: false, error: error.message };
  }
}

// TESTE 4: Verificar estrutura dos dados existentes
async function teste4_estrutura_dados() {
  console.log('\n📋 TESTE 4: Verificar estrutura dos dados existentes');
  console.log('-'.repeat(60));
  
  try {
    // Buscar algumas atrações de setembro (que sabemos que existem)
    const setembroResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-09-01&data_competencia=lt.2025-10-01&categoria_nome=eq.Atrações Programação&limit=3&select=nibo_id,categoria_nome,stakeholder_nome,valor,data_competencia`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    
    if (setembroResponse.ok) {
      const dados = await setembroResponse.json();
      console.log('📊 Exemplo de dados de Setembro 2025 (Atrações):');
      console.log(JSON.stringify(dados, null, 2));
    }
    
    return { success: true };
  } catch (error) {
    console.log('❌ Erro ao verificar estrutura:', error.message);
    return { success: false, error: error.message };
  }
}

// EXECUTAR TODOS OS TESTES
async function executarTodosTestes() {
  console.log('\n');
  console.log('🎯 PLANO DE AÇÃO - IDENTIFICAÇÃO DE GARGALO');
  console.log('=' .repeat(60));
  console.log('1. Testar conectividade com Supabase');
  console.log('2. Executar sincronização completa via Edge Function');
  console.log('3. Verificar se dados foram inseridos');
  console.log('4. Analisar estrutura dos dados existentes');
  console.log('=' .repeat(60));
  
  const resultados = {
    teste1: await teste1_conectividade(),
    teste2: await teste2_edge_function_sync(),
    teste3: await teste3_verificar_dados(),
    teste4: await teste4_estrutura_dados()
  };
  
  console.log('\n');
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  console.log('Teste 1 (Conectividade):', resultados.teste1.success ? '✅ OK' : '❌ FALHOU');
  console.log('Teste 2 (Sincronização):', resultados.teste2.success ? '✅ OK' : '❌ FALHOU');
  console.log('Teste 3 (Dados Inseridos):', resultados.teste3.success ? '✅ OK' : '❌ FALHOU');
  console.log('Teste 4 (Estrutura):', resultados.teste4.success ? '✅ OK' : '❌ FALHOU');
  console.log('=' .repeat(60));
  
  if (!resultados.teste2.success) {
    console.log('\n❌ GARGALO IDENTIFICADO: Edge Function de sincronização');
    console.log('Próximos passos:');
    console.log('  1. Verificar logs da Edge Function');
    console.log('  2. Testar diretamente a API do Nibo');
    console.log('  3. Verificar permissões e credenciais');
  } else if (resultados.teste3.success && resultados.teste1.success && resultados.teste2.success) {
    console.log('\n✅ Sincronização funcionando corretamente!');
    console.log('Se ainda há problema no planejamento comercial, o gargalo está na lógica de busca.');
  }
}

// Executar
if (require.main === module) {
  executarTodosTestes().catch(console.error);
}

