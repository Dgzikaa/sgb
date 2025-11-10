/**
 * Script para testar a Edge Function deployada
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzI5NTksImV4cCI6MjA0MjM0ODk1OX0.Oo4Gj-jQGZoUiLHUxHKJrGjxiKTzPqzTzlP7_q-Kx-0';

async function testarEdgeFunction() {
  console.log('🧪 Testando Edge Function...\n');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/sync-pesquisa-felicidade`;
    
    console.log(`📡 URL: ${url}`);
    console.log('⏳ Executando...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO!\n');
      console.log('📋 Resultado:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`\n🎉 ${data.message}`);
        console.log(`   Total processado: ${data.total}`);
        console.log(`   Inseridos/Atualizados: ${data.inserted}`);
      }
    } else {
      console.error('❌ ERRO!\n');
      console.error('📋 Detalhes:');
      console.error(JSON.stringify(data, null, 2));
      
      if (response.status === 403 || response.status === 404) {
        console.error('\n⚠️ POSSÍVEL CAUSA:');
        console.error('   O arquivo do Google Drive precisa ser compartilhado com:');
        console.error('   contaazul-sheets-service@canvas-landing-447918-h7.iam.gserviceaccount.com');
        console.error('\n📝 Como compartilhar:');
        console.error('   1. Abra: https://drive.google.com/file/d/1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn/view');
        console.error('   2. Clique em "Compartilhar"');
        console.error('   3. Cole o email acima');
        console.error('   4. Dê permissão de "Visualizador"');
        console.error('   5. Clique em "Enviar"');
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR:');
    console.error(error.message);
    console.error('\nStack:', error.stack);
  }
}

testarEdgeFunction();

