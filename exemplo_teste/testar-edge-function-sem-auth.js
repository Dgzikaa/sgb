/**
 * Script para testar a Edge Function com autenticação
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

async function testarEdgeFunction() {
  console.log('🧪 Testando Edge Function...\n');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/sync-pesquisa-felicidade`;
    
    console.log(`📡 URL: ${url}`);
    console.log('⏳ Executando...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    const text = await response.text();
    console.log('📋 Resposta (raw):');
    console.log(text);
    console.log('');

    try {
      const data = JSON.parse(text);
      
      if (response.ok) {
        console.log('✅ SUCESSO!\n');
        console.log('📋 Resultado:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log(`\n🎉 ${data.message}`);
          console.log(`   Total processado: ${data.total || 0}`);
          console.log(`   Inseridos/Atualizados: ${data.inserted || 0}`);
        }
      } else {
        console.error('❌ ERRO!\n');
        console.error('📋 Detalhes:');
        console.error(JSON.stringify(data, null, 2));
        
        if (data.error && data.error.includes('403')) {
          console.error('\n⚠️ ERRO 403: Arquivo não compartilhado!');
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
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON');
      console.error('Resposta recebida:', text);
    }

  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR:');
    console.error(error.message);
  }
}

testarEdgeFunction();

