// Teste simples da função extractTimestamp
function extractTimestamp(isoString) {
  console.log(`\n🧪 Testando: "${isoString}"`);
  
  if (!isoString || isoString === '' || isoString === 'undefined' || isoString === 'null') {
    console.log(`❌ String vazia ou inválida`);
    return null;
  }
  
  try {
    // Remover timezone e converter T para espaço
    let cleanString = isoString
      .replace(/T/, ' ')
      .replace(/-0300$/, '')
      .replace(/\+0000$/, '')
      .replace(/-03:00$/, '')
      .replace(/\+00:00$/, '')
      .replace(/Z$/, '');
    
    console.log(`🔄 Após limpeza: "${cleanString}"`);
    
    // Validar se é um timestamp válido antes de processar
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      console.log(`❌ Timestamp inválido: "${isoString}"`);
      return null;
    }
    
    console.log(`✅ Data válida: ${date.toISOString()}`);
    
    // Garantir formato correto YYYY-MM-DD HH:MM:SS
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanString)) {
      console.log(`❌ Formato timestamp incorreto após limpeza: "${cleanString}"`);
      return null;
    }
    
    console.log(`✅ Timestamp convertido: "${isoString}" → "${cleanString}"`);
    return cleanString;
    
  } catch (error) {
    console.log(`❌ Erro ao processar timestamp: "${isoString}"`, error);
    return null;
  }
}

// Testar com os valores reais
const testCases = [
  "2025-02-01T18:48:53-0300",
  "2025-02-02T01:33:18-0300",
  "",
  null,
  undefined
];

console.log('🧪 Teste da função extractTimestamp');

testCases.forEach((testCase, index) => {
  console.log(`\n=== TESTE ${index + 1} ===`);
  const result = extractTimestamp(testCase);
  console.log(`Resultado: ${result}`);
});
