// Teste direto da API em produção
const testAPI = async () => {
  console.log('🧪 TESTE API PRODUÇÃO');
  
  try {
    const url = 'https://zykor.com.br/api/analitico/semanal-horario?barId=3&diaSemana=todos&meses=2025-10,2025-09,2025-08&modo=individual';
    console.log('📡 URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📊 Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📊 Response JSON:', json);
    } catch (e) {
      console.log('❌ Não é JSON válido');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

// Executar teste
testAPI();
