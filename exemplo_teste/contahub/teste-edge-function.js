// ========================================
// TESTE DA EDGE FUNCTION CONTAHUB-SYNC-AUTOMATICO
// Script para testar a Edge Function deployada
// ========================================

const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
try {
  require('dotenv').config({ path: '../../frontend/.env.local' });
  console.log('🔧 .env.local carregado');
} catch (error) {
  console.log('⚠️ dotenv não encontrado');
}

async function testarEdgeFunction() {
  console.log('🎯 TESTE DA EDGE FUNCTION CONTAHUB-SYNC-AUTOMATICO');
  console.log('================================================');
  
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente não encontradas');
    }
    
    console.log('📡 Chamando Edge Function...');
    console.log('🔗 URL:', `${supabaseUrl}/functions/v1/contahub-sync-automatico`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/contahub-sync-automatico`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('================================================');
    console.log('✅ RESULTADO DO TESTE');
    console.log('================================================');
    console.log('📅 Data processada:', result.data?.date);
    console.log('⏱️ Tempo de execução Edge Function:', result.data?.executionTime);
    console.log('⏱️ Tempo total do teste:', `${executionTime}s`);
    console.log('📊 Módulos com sucesso:', `${result.data?.modules?.success}/${result.data?.modules?.total}`);
    console.log('📊 Registros inseridos:', result.data?.records?.inserted);
    console.log('📊 Registros processados:', result.data?.records?.processed);
    
    console.log('\n📋 DETALHES POR MÓDULO:');
    result.data?.details?.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.module}: ${detail.status === 'success' ? '✅' : '❌'} ${detail.inserted || 0} registros`);
    });
    
    console.log('\n🎯 Status:', result.success ? '✅ SUCESSO TOTAL' : '❌ ERRO');
    
  } catch (error) {
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    console.log('================================================');
    console.log('❌ ERRO NO TESTE');
    console.log('================================================');
    console.log('💥 Erro:', error.message);
    console.log('⏱️ Tempo total:', `${executionTime}s`);
  }
}

// Executar teste
testarEdgeFunction(); 