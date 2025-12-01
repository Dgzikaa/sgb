/**
 * 📊 SCRIPT - IMPORTAÇÃO DE HISTÓRICO DE CONTAGENS
 * 
 * Importa histórico de contagens 1 DIA POR VEZ
 * 
 * USO:
 *   node scripts/importar-historico-contagens.js
 * 
 * O script salva o progresso e pode ser interrompido e continuado
 */

const fs = require('fs');
const path = require('path');

// Configuração
const API_URL = 'https://zykor.com.br/api/ferramentas/contagem-estoque/sync';
const DATA_INICIO = '2025-02-01';
const DATA_FIM = '2025-11-30';
const DELAY_ENTRE_REQUESTS = 3000; // 3 segundos
const ARQUIVO_PROGRESSO = path.join(__dirname, 'progresso-importacao.json');

// Cores para terminal
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  azul: '\x1b[34m',
  amarelo: '\x1b[33m',
  vermelho: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Gerar array de datas entre duas datas
 */
function gerarArrayDatas(inicio, fim) {
  const datas = [];
  const dataAtual = new Date(inicio + 'T00:00:00');
  const dataFinal = new Date(fim + 'T00:00:00');
  
  while (dataAtual <= dataFinal) {
    datas.push(dataAtual.toISOString().split('T')[0]);
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  return datas;
}

/**
 * Carregar progresso salvo
 */
function carregarProgresso() {
  try {
    if (fs.existsSync(ARQUIVO_PROGRESSO)) {
      const conteudo = fs.readFileSync(ARQUIVO_PROGRESSO, 'utf8');
      return JSON.parse(conteudo);
    }
  } catch (error) {
    console.error('Erro ao carregar progresso:', error.message);
  }
  
  return {
    datasImportadas: [],
    datasComErro: [],
    ultimaData: null,
  };
}

/**
 * Salvar progresso
 */
function salvarProgresso(progresso) {
  try {
    fs.writeFileSync(
      ARQUIVO_PROGRESSO,
      JSON.stringify(progresso, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Erro ao salvar progresso:', error.message);
  }
}

/**
 * Importar uma data específica
 */
async function importarData(data) {
  try {
    const response = await fetch(`${API_URL}?data=${data}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cronSecret: 'manual_test',
        data: data,
      }),
    });
    
    const resultado = await response.json();
    
    if (resultado.success || response.ok) {
      return { sucesso: true, resultado };
    } else {
      return { sucesso: false, erro: resultado.error || 'Erro desconhecido' };
    }
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Aguardar X milissegundos
 */
function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formatar tempo
 */
function formatarTempo(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  } else if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  } else {
    return `${segs}s`;
  }
}

/**
 * Executar importação
 */
async function executarImportacao() {
  console.log(cores.cyan + '╔═══════════════════════════════════════════════════════════╗' + cores.reset);
  console.log(cores.cyan + '║  📊 IMPORTAÇÃO DE HISTÓRICO DE CONTAGENS                  ║' + cores.reset);
  console.log(cores.cyan + '╚═══════════════════════════════════════════════════════════╝' + cores.reset);
  console.log('');
  
  // Carregar progresso
  const progresso = carregarProgresso();
  
  // Gerar todas as datas
  const todasDatas = gerarArrayDatas(DATA_INICIO, DATA_FIM);
  
  // Filtrar datas já importadas
  const datasRestantes = todasDatas.filter(
    data => !progresso.datasImportadas.includes(data)
  );
  
  console.log(cores.azul + `📅 Período: ${DATA_INICIO} até ${DATA_FIM}` + cores.reset);
  console.log(cores.azul + `📊 Total de dias: ${todasDatas.length}` + cores.reset);
  console.log(cores.verde + `✅ Já importados: ${progresso.datasImportadas.length}` + cores.reset);
  console.log(cores.amarelo + `⏳ Restantes: ${datasRestantes.length}` + cores.reset);
  
  if (progresso.datasComErro.length > 0) {
    console.log(cores.vermelho + `❌ Com erro: ${progresso.datasComErro.length}` + cores.reset);
  }
  
  console.log('');
  
  if (datasRestantes.length === 0) {
    console.log(cores.verde + '🎉 Importação já concluída!' + cores.reset);
    return;
  }
  
  // Calcular tempo estimado
  const tempoEstimado = (datasRestantes.length * DELAY_ENTRE_REQUESTS) / 1000;
  console.log(cores.cyan + `⏱️  Tempo estimado: ${formatarTempo(Math.ceil(tempoEstimado))}` + cores.reset);
  console.log('');
  console.log(cores.amarelo + '💡 Pressione Ctrl+C para pausar (o progresso será salvo)' + cores.reset);
  console.log('');
  
  // Aguardar 3 segundos antes de começar
  console.log('Iniciando em 3 segundos...');
  await aguardar(3000);
  
  const inicioGeral = Date.now();
  let contador = 0;
  
  // Importar cada data
  for (const data of datasRestantes) {
    contador++;
    const porcentagem = ((progresso.datasImportadas.length + contador) / todasDatas.length * 100).toFixed(1);
    
    process.stdout.write(
      `\r${cores.azul}[${contador}/${datasRestantes.length}]${cores.reset} ` +
      `${cores.cyan}${data}${cores.reset} ` +
      `(${porcentagem}%) ... `
    );
    
    const resultado = await importarData(data);
    
    if (resultado.sucesso) {
      progresso.datasImportadas.push(data);
      progresso.ultimaData = data;
      console.log(cores.verde + '✅ OK' + cores.reset);
    } else {
      progresso.datasComErro.push({ data, erro: resultado.erro });
      console.log(cores.vermelho + `❌ ERRO: ${resultado.erro}` + cores.reset);
    }
    
    // Salvar progresso a cada 10 datas
    if (contador % 10 === 0) {
      salvarProgresso(progresso);
    }
    
    // Aguardar antes da próxima
    if (contador < datasRestantes.length) {
      await aguardar(DELAY_ENTRE_REQUESTS);
    }
  }
  
  // Salvar progresso final
  salvarProgresso(progresso);
  
  const tempoTotal = Math.ceil((Date.now() - inicioGeral) / 1000);
  
  console.log('');
  console.log(cores.cyan + '╔═══════════════════════════════════════════════════════════╗' + cores.reset);
  console.log(cores.cyan + '║  ✅ IMPORTAÇÃO CONCLUÍDA!                                  ║' + cores.reset);
  console.log(cores.cyan + '╚═══════════════════════════════════════════════════════════╝' + cores.reset);
  console.log('');
  console.log(cores.verde + `✅ Importadas com sucesso: ${progresso.datasImportadas.length}` + cores.reset);
  console.log(cores.vermelho + `❌ Com erro: ${progresso.datasComErro.length}` + cores.reset);
  console.log(cores.cyan + `⏱️  Tempo total: ${formatarTempo(tempoTotal)}` + cores.reset);
  console.log('');
  
  if (progresso.datasComErro.length > 0) {
    console.log(cores.amarelo + '⚠️  Datas com erro:' + cores.reset);
    progresso.datasComErro.forEach(({ data, erro }) => {
      console.log(cores.vermelho + `   - ${data}: ${erro}` + cores.reset);
    });
    console.log('');
  }
  
  console.log(cores.cyan + `📁 Progresso salvo em: ${ARQUIVO_PROGRESSO}` + cores.reset);
  console.log('');
}

// Capturar Ctrl+C para salvar progresso antes de sair
process.on('SIGINT', () => {
  console.log('');
  console.log('');
  console.log(cores.amarelo + '⏸️  Importação pausada!' + cores.reset);
  console.log(cores.cyan + '💾 Progresso salvo. Execute o script novamente para continuar.' + cores.reset);
  console.log('');
  process.exit(0);
});

// Executar
executarImportacao().catch(error => {
  console.error('');
  console.error(cores.vermelho + '❌ Erro fatal:' + cores.reset, error);
  process.exit(1);
});

