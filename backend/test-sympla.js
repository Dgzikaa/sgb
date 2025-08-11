// Teste simples da função sympla-sync
const url = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sympla-sync';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M';

async function testSympla() {
  try {
    console.log('🚀 Testando sympla-sync...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        automated: true,
        bar_id: 3
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📄 Response:', result);
    
    if (response.ok) {
      console.log('✅ Função executada com sucesso!');
    } else {
      console.log('❌ Erro na execução da função');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testSympla();
