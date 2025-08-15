// Script para processar backlog diretamente do ContaHub para Supabase
// Sem passar pela raw_data, direto para as tabelas finais

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

// Credenciais ContaHub - conforme Edge Function
const CONTAHUB_EMAIL = 'digao@3768';
const CONTAHUB_PASSWORD = 'Geladeira@001';
const contahubBaseUrl = 'https://sp.contahub.com';

// Função para inserir dados no Supabase via API REST
async function inserirDadosSupabase(tabela, dados) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Se for erro de duplicata (409), retornar como sucesso parcial
      if (response.status === 409) {
        console.log(`⚠️ Algumas duplicatas encontradas em ${tabela} - dados podem já existir`);
        return { data: dados, error: null, status: 'duplicates_found' };
      }
      
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return { data: null, error: { message: `HTTP ${response.status}: ${errorText}` } };
    }
    
    return { data: dados, error: null, status: 'inserted' };
    
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error);
    return { data: null, error: { message: error.message } };
  }
}

// Função para gerar timestamp dinâmico - conforme Edge Function
function generateDynamicTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para fazer login no ContaHub - conforme Edge Function
async function loginContaHub() {
  console.log('🔐 Fazendo login no ContaHub...');
  
  // Hash SHA-1 da senha (como na Edge Function)
  const encoder = new TextEncoder();
  const data = encoder.encode(CONTAHUB_PASSWORD);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const loginData = new URLSearchParams({
    "usr_email": CONTAHUB_EMAIL,
    "usr_password_sha1": passwordSha1
  });
  
  const loginTimestamp = generateDynamicTimestamp();
  const loginResponse = await fetch(`${contahubBaseUrl}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

// Função para buscar dados do ContaHub
async function buscarDadosContaHub(dataType, dataDate, sessionToken) {
  console.log(`📊 Coletando ${dataType}...`);
  
  // Gerar timestamp dinâmico para cada query
  const queryTimestamp = generateDynamicTimestamp();
  
  // emp_id fixo para Ordinário (bar_id = 3)
  const emp_id = "3768";
  
  let url;
  
  // Construir URL específica para cada tipo de dados
  switch (dataType) {
    case 'analitico':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${dataDate}&d1=${dataDate}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=1`;
      break;
      
    case 'tempo':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${dataDate}&d1=${dataDate}&prod=&grupo=&local=&emp=${emp_id}&nfe=1`;
      break;
      
    case 'pagamentos':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${dataDate}&d1=${dataDate}&meio=&emp=${emp_id}&nfe=1`;
      break;
      
    case 'fatporhora':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${dataDate}&d1=${dataDate}&emp=${emp_id}&nfe=1`;
      break;
      
    case 'periodo':
      url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${dataDate}&d1=${dataDate}&emp=${emp_id}&nfe=1`;
      break;
      
    default:
      throw new Error(`Tipo de dados não suportado: ${dataType}`);
  }
  
  console.log(`🔗 URL: ${url}`);
  
  // Buscar dados do ContaHub
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  });
  
  if (!response.ok) {
    console.error(`❌ Erro HTTP ${response.status} para ${dataType}`);
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  const responseText = await response.text();
  const data = JSON.parse(responseText);
  
  const recordCount = Array.isArray(data?.list) ? data.list.length : 
                     Array.isArray(data) ? data.length : 1;
  
  console.log(`✅ ${dataType}: ${recordCount} registros coletados`);
  
  return data;
}

// Função para processar dados analíticos
function processarAnalitico(rawData, dataDate) {
  if (!rawData?.list || !Array.isArray(rawData.list)) return [];
  
  return rawData.list.map((item, index) => {
    let mes = 0;
    if (item.mes) {
      if (typeof item.mes === 'string' && item.mes.includes('-')) {
        mes = parseInt(item.mes.split('-')[1]);
      } else {
        mes = parseInt(item.mes);
      }
    }
    
    return {
      bar_id: 3,
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      itm: item.itm?.toString() || '',
      trn: item.trn?.toString() || '',
      trn_desc: item.trn_desc || '',
      prefixo: item.prefixo || '',
      tipo: item.tipo || '',
      tipovenda: item.tipovenda || '',
      ano: parseInt(item.ano) || new Date().getFullYear(),
      mes: mes || new Date().getMonth() + 1,
      trn_dtgerencial: item.trn_dtgerencial ? item.trn_dtgerencial.split('T')[0] : dataDate,
      usr_lancou: item.usr_lancou || '',
      prd: item.prd?.toString() || '',
      prd_desc: item.prd_desc || '',
      grp_desc: item.grp_desc || '',
      loc_desc: item.loc_desc || '',
      qtd: parseFloat(item.qtd) || 0,
      desconto: parseFloat(item.desconto) || 0,
      valorfinal: parseFloat(item.valorfinal) || 0,
      custo: parseFloat(item.custo) || 0,
      itm_obs: item.itm_obs || '',
      comandaorigem: item.comandaorigem || '',
      itemorigem: item.itemorigem || ''
    };
  });
}

// Função para processar dados de período
function processarPeriodo(rawData, dataDate) {
  if (!rawData?.list || !Array.isArray(rawData.list)) return [];
  
  return rawData.list.map(item => {
    const dataGerencial = item.dt_gerencial ? new Date(item.dt_gerencial) : new Date(dataDate);
    const inicioAno = new Date(dataGerencial.getFullYear(), 0, 1);
    const diasDesdeInicio = Math.floor((dataGerencial.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
    const semana = Math.ceil((diasDesdeInicio + inicioAno.getDay() + 1) / 7);
    
    let cli_dtnasc = null;
    if (item.cli_dtnasc) {
      const dtNascStr = item.cli_dtnasc.split('T')[0];
      if (dtNascStr && dtNascStr !== '0001-01-01') {
        cli_dtnasc = dtNascStr;
      }
    }
    
    return {
      bar_id: 3,
      dt_gerencial: item.dt_gerencial ? item.dt_gerencial.split('T')[0] : dataDate,
      tipovenda: item.tipovenda || '',
      vd_mesadesc: item.vd_mesadesc || '',
      vd_localizacao: item.vd_localizacao || '',
      cht_nome: item.cht_nome || '',
      cli_nome: item.cli_nome || '',
      cli_dtnasc: cli_dtnasc,
      cli_email: item.cli_email || '',
      cli_fone: item.cli_fone || '',
      usr_abriu: item.usr_abriu || '',
      pessoas: parseInt(item.pessoas) || 0,
      qtd_itens: parseInt(item.qtd_itens) || 0,
      vr_pagamentos: parseFloat(item['$vr_pagamentos']) || 0,
      vr_produtos: parseFloat(item['$vr_produtos']) || 0,
      vr_repique: parseFloat(item['$vr_repique']) || 0,
      vr_couvert: parseFloat(item['$vr_couvert']) || 0,
      vr_desconto: parseFloat(item['$vr_desconto']) || 0,
      motivo: item.motivo || '',
      dt_contabil: item.dt_contabil ? item.dt_contabil.split('T')[0] : null,
      ultimo_pedido: item.ultimo_pedido || '',
      vd_dtcontabil: item.vd_dtcontabil ? item.vd_dtcontabil.split('T')[0] : null,
      semana: semana
    };
  });
}

// Função para processar dados de pagamentos
function processarPagamentos(rawData, dataDate) {
  if (!rawData?.list || !Array.isArray(rawData.list)) return [];
  
  return rawData.list.map(item => ({
    bar_id: 3,
    vd: item.vd || '',
    trn: item.trn || '',
    dt_gerencial: item.dt_gerencial || dataDate,
    hr_lancamento: item.hr_lancamento || '',
    hr_transacao: item.hr_transacao || '',
    dt_transacao: item.dt_transacao ? item.dt_transacao.split('T')[0] : null,
    mesa: item.mesa || '',
    cli: parseInt(item.cli) || 0,
    cliente: item.cliente || '',
    vr_pagamentos: parseFloat(item['$vr_pagamentos']) || 0,
    pag: item.pag || '',
    valor: parseFloat(item['$valor']) || 0,
    taxa: parseFloat(item['$taxa']) || 0,
    perc: parseFloat(item['$perc']) || 0,
    liquido: parseFloat(item['$liquido']) || 0,
    tipo: item.tipo || '',
    meio: item.meio || '',
    cartao: item.cartao || '',
    autorizacao: item.autorizacao || '',
    dt_credito: item.dt_credito ? item.dt_credito.split('T')[0] : null,
    usr_abriu: item.usr_abriu || '',
    usr_lancou: item.usr_lancou || '',
    usr_aceitou: item.usr_aceitou || '',
    motivodesconto: item.motivodesconto || ''
  }));
}

// Função para processar dados de tempo
function processarTempo(rawData, dataDate) {
  if (!rawData?.list || !Array.isArray(rawData.list)) return [];

  const toIso = (dateOnly, timeVal) => {
    if (!dateOnly || !timeVal) return null;
    const v = String(timeVal).trim();
    if (v.includes('T')) {
      // Remover timezone se existir, manter YYYY-MM-DDTHH:mm:ss
      const base = v.split('T')[0];
      const time = v.split('T')[1].replace('Z', '').replace(/[-+].*$/, '');
      const hhmmss = time.length >= 8 ? time.slice(0,8) : `${time}:00`.slice(0,8);
      return `${base}T${hhmmss}`;
    }
    if (v.includes(' ')) {
      const hhmmss = v.split(' ')[1].slice(0,8);
      return `${dateOnly}T${hhmmss}`;
    }
    const hhmmss = v.length === 8 ? v : `${v}:00`.slice(0,8);
    return `${dateOnly}T${hhmmss}`;
  };

  const pick = (obj, keys) => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
    }
    return null;
  };

  const pickNumber = (obj, keys) => {
    const raw = pick(obj, keys);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return rawData.list.map(item => {
    const dataISO = (item.vd_dtgerencial ? String(item.vd_dtgerencial).split('T')[0] : (item.dia ? String(item.dia).split('T')[0] : dataDate));
    const loc = item.loc_desc || item.local || item.vd_localizacao || '';
    const prdId = Number.isFinite(Number(item.prd)) ? Number(item.prd) : null;
    const ano = Number.isFinite(Number(item.ano)) ? Number(item.ano) : new Date(dataISO).getFullYear();
    let mesNum;
    if (item.mes && typeof item.mes === 'string' && item.mes.includes('-')) mesNum = parseInt(item.mes.split('-')[1]);
    else mesNum = Number.isFinite(Number(item.mes)) ? Number(item.mes) : (new Date(dataISO).getMonth() + 1);

    const t0 = pick(item, ['t0_lancamento','t0-lancamento','ht_comanda']);
    const t1 = pick(item, ['t1_prodini','t1-prodini','ht_pedido']);
    const t2 = pick(item, ['t2_prodfim','t2-prodfim','ht_liberacao']);
    const t3 = pick(item, ['t3_entrega','t3-entrega','ht_venda']);

    return {
      bar_id: 3,
      grp_desc: item.grp_desc || item.grupo || '',
      prd_desc: item.prd_desc || '',
      vd_mesadesc: item.vd_mesadesc || '',
      itm: (item.itm ?? '').toString(),
      t0_lancamento: toIso(dataISO, t0),
      t1_prodini: toIso(dataISO, t1),
      t2_prodfim: toIso(dataISO, t2),
      t3_entrega: toIso(dataISO, t3),
      t0_t1: pickNumber(item, ['t0_t1','t0-t1']),
      t0_t2: pickNumber(item, ['t0_t2','t0-t2']),
      t0_t3: pickNumber(item, ['t0_t3','t0-t3']),
      t1_t2: pickNumber(item, ['t1_t2','t1-t2']),
      t1_t3: pickNumber(item, ['t1_t3','t1-t3']),
      t2_t3: pickNumber(item, ['t2_t3','t2-t3']),
      prd: prdId,
      prd_idexterno: item.prd_idexterno || (item.prd?.toString() || ''),
      loc_desc: loc,
      usr_abriu: item.usr_abriu || '',
      usr_lancou: item.usr_lancou || '',
      usr_produziu: item.usr_produziu || '',
      usr_entregou: item.usr_entregou || '',
      usr_transfcancelou: item.usr_transfcancelou || '',
      prefixo: item.prefixo || '',
      tipovenda: item.tipovenda || '',
      ano: ano,
      mes: mesNum,
      dia: dataISO,
      dds: Number.isFinite(Number(item.dds)) ? Number(item.dds) : new Date(dataISO).getDay(),
      diadasemana: item.diadasemana || '',
      hora: item.hora || '',
      itm_qtd: Number.isFinite(Number(item.itm_qtd)) ? Number(item.itm_qtd) : (Number.isFinite(Number(item.qtd)) ? Number(item.qtd) : 0),
      data: dataISO
    };
  });
}

// Função para processar dados de faturamento por hora
function processarFatPorHora(rawData, dataDate) {
  if (!rawData?.list || !Array.isArray(rawData.list)) return [];
  
  return rawData.list.map(item => ({
    bar_id: 3,
    vd_dtgerencial: item.vd_dtgerencial ? item.vd_dtgerencial.split('T')[0] : dataDate,
    hora: parseInt(item.hora) || 0,
    valor: parseFloat(item.valor) || 0,
    dds: parseInt(item.dds) || 0,
    dia: item.vd_dtgerencial ? item.vd_dtgerencial.split('T')[0] : dataDate,
    qtd: parseInt(item.qtd) || 0
  }));
}

// Função para inserir dados no Supabase
async function inserirDados(tabela, dados) {
  if (dados.length === 0) return { inseridos: 0, erros: 0 };
  
  console.log(`💾 Inserindo ${dados.length} registros em ${tabela}...`);
  
  let totalInseridos = 0;
  let totalErros = 0;
  
  // Processar em batches de 1000 (limite do Supabase)
  for (let i = 0; i < dados.length; i += 1000) {
    const batch = dados.slice(i, i + 1000);
    
    try {
      const { data, error, status } = await inserirDadosSupabase(tabela, batch);
      
      if (error) {
        console.error(`❌ Erro no batch ${Math.floor(i/1000) + 1}:`, error);
        totalErros += batch.length;
      } else {
        totalInseridos += batch.length;
        if (status === 'duplicates_found') {
          console.log(`⚠️ Batch ${Math.floor(i/1000) + 1}: ${batch.length} registros processados (algumas duplicatas encontradas)`);
        } else {
          console.log(`✅ Batch ${Math.floor(i/1000) + 1}: ${batch.length} registros inseridos`);
        }
      }
      
    } catch (err) {
      console.error(`❌ Erro crítico no batch:`, err);
      totalErros += batch.length;
    }
    
    // Pausa entre batches
    if (i + 1000 < dados.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return { inseridos: totalInseridos, erros: totalErros };
}

// Função principal
async function processarBacklogCompleto() {
  console.log('🚀 INICIANDO PROCESSAMENTO DE BACKLOG COMPLETO');
  console.log('📅 Período: 31/01/2025 até 31/07/2025');
  
  // Gerar lista de datas
  const dataInicio = new Date('2025-01-31');
  const dataFim = new Date('2025-07-31');
  const datas = [];
  
  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    datas.push(d.toISOString().split('T')[0]);
  }
  
  console.log(`📊 Total de dias para processar: ${datas.length}`);
  
  // Fazer login
  const sessionToken = await loginContaHub();
  
  const relatorios = ['periodo', 'analitico', 'pagamentos', 'tempo', 'fatporhora'];
  const resultados = [];
  
  for (const data of datas) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📅 PROCESSANDO ${data}`);
    console.log(`${'='.repeat(50)}`);
    
    const inicioData = Date.now();
    const resultadoData = { data, relatorios: {} };
    
    for (const relatorio of relatorios) {
      console.log(`🔄 Processando ${relatorio}...`);
      
      try {
        // Buscar dados do ContaHub
        const rawData = await buscarDadosContaHub(relatorio, data, sessionToken);
        
        if (!rawData?.list || rawData.list.length === 0) {
          console.log(`⚠️ Sem dados para ${relatorio} em ${data}`);
          resultadoData.relatorios[relatorio] = { inseridos: 0, erros: 0 };
          continue;
        }
        
        // Processar dados
        let dadosProcessados = [];
        switch (relatorio) {
          case 'analitico':
            dadosProcessados = processarAnalitico(rawData, data);
            break;
          case 'periodo':
            dadosProcessados = processarPeriodo(rawData, data);
            break;
          case 'pagamentos':
            dadosProcessados = processarPagamentos(rawData, data);
            break;
          case 'tempo':
            dadosProcessados = processarTempo(rawData, data);
            break;
          case 'fatporhora':
            dadosProcessados = processarFatPorHora(rawData, data);
            break;
        }
        
        // Inserir no Supabase
        const resultado = await inserirDados(`contahub_${relatorio}`, dadosProcessados);
        resultadoData.relatorios[relatorio] = resultado;
        
        console.log(`✅ ${relatorio}: ${resultado.inseridos}/${dadosProcessados.length} inseridos`);
        
      } catch (error) {
        console.error(`❌ Erro em ${relatorio}:`, error.message);
        resultadoData.relatorios[relatorio] = { inseridos: 0, erros: 1 };
      }
      
      // Pausa entre relatórios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const tempoData = Math.round((Date.now() - inicioData) / 1000);
    console.log(`⏱️ ${data} processado em ${tempoData}s`);
    
    resultados.push(resultadoData);
    
    // Pausa entre dias
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMO FINAL');
  console.log(`${'='.repeat(60)}`);
  
  const totais = {};
  relatorios.forEach(rel => totais[rel] = { inseridos: 0, erros: 0 });
  
  resultados.forEach(r => {
    relatorios.forEach(rel => {
      totais[rel].inseridos += r.relatorios[rel]?.inseridos || 0;
      totais[rel].erros += r.relatorios[rel]?.erros || 0;
    });
  });
  
  console.log('\n📋 Totais por relatório:');
  relatorios.forEach(rel => {
    console.log(`${rel}: ${totais[rel].inseridos} inseridos, ${totais[rel].erros} erros`);
  });
  
  console.log('\n🎉 PROCESSAMENTO DE BACKLOG COMPLETO!');
}

// Utilitário: gerar lista de datas (YYYY-MM-DD) para um mês/ano
function listarDatasDoMes(ano, mes /* 1-12 */) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0); // último dia do mês
  const datas = [];
  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    datas.push(d.toISOString().split('T')[0]);
  }
  return datas;
}

// Nova função: processar apenas TEMPO de um mês específico
async function processarTempoMes(ano, mes /* 1-12 */) {
  console.log(`🚀 Processando apenas TEMPO para ${String(mes).padStart(2, '0')}/${ano}`);
  const datas = listarDatasDoMes(ano, mes);
  console.log(`📊 Total de dias: ${datas.length}`);

  // Login uma vez
  const sessionToken = await loginContaHub();

  for (const data of datas) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`⏱️ TEMPO | ${data}`);
    console.log(`${'='.repeat(50)}`);
    try {
      const rawData = await buscarDadosContaHub('tempo', data, sessionToken);
      console.log('🔍 tempo/raw keys:', rawData && Object.keys(rawData));
      console.log('🔍 tempo/list length:', Array.isArray(rawData?.list) ? rawData.list.length : 'sem list');
      if (Array.isArray(rawData?.list) && rawData.list.length > 0) {
        console.log('🔍 tempo/sample[0]:', JSON.stringify(rawData.list[0], null, 2).slice(0, 2000));
      }
      if (!rawData?.list || rawData.list.length === 0) {
        console.log(`⚠️ Sem dados de tempo em ${data}`);
        await new Promise(r => setTimeout(r, 250));
        continue;
      }

      const dadosProcessados = processarTempo(rawData, data);
      console.log('🔍 tempo/processed count:', dadosProcessados.length);
      if (dadosProcessados.length > 0) {
        console.log('🔍 tempo/processed sample:', JSON.stringify(dadosProcessados[0], null, 2).slice(0, 2000));
      }
      const resultado = await inserirDados('contahub_tempo', dadosProcessados);
      console.log(`✅ tempo: ${resultado.inseridos}/${dadosProcessados.length} inseridos`);
    } catch (err) {
      console.error(`❌ Erro ao processar TEMPO em ${data}:`, err.message || err);
    }

    // Pausa curta entre dias
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('🎉 Finalizado processamento de TEMPO do mês');
}

// Atalho solicitado: apenas TEMPO de Agosto
async function processarTempoAgosto(ano = 2025) {
  return processarTempoMes(ano, 8);
}

// Nova função: processar MÊS COMPLETO (todos os relatórios)
async function processarMesCompleto(ano, mes) {
  console.log(`🚀 PROCESSANDO MÊS COMPLETO: ${String(mes).padStart(2, '0')}/${ano}`);
  const datas = listarDatasDoMes(ano, mes);
  console.log(`📊 Total de dias: ${datas.length}`);
  
  // Fazer login
  const sessionToken = await loginContaHub();
  
  const relatorios = ['periodo', 'analitico', 'pagamentos', 'tempo', 'fatporhora'];
  const resultados = [];
  
  for (const data of datas) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📅 PROCESSANDO ${data}`);
    console.log(`${'='.repeat(50)}`);
    
    const inicioData = Date.now();
    const resultadoData = { data, relatorios: {} };
    
    for (const relatorio of relatorios) {
      console.log(`🔄 Processando ${relatorio}...`);
      
      try {
        // Buscar dados do ContaHub
        const rawData = await buscarDadosContaHub(relatorio, data, sessionToken);
        
        if (!rawData?.list || rawData.list.length === 0) {
          console.log(`⚠️ Sem dados para ${relatorio} em ${data}`);
          resultadoData.relatorios[relatorio] = { inseridos: 0, erros: 0 };
          continue;
        }
        
        // Processar dados
        let dadosProcessados = [];
        switch (relatorio) {
          case 'analitico':
            dadosProcessados = processarAnalitico(rawData, data);
            break;
          case 'periodo':
            dadosProcessados = processarPeriodo(rawData, data);
            break;
          case 'pagamentos':
            dadosProcessados = processarPagamentos(rawData, data);
            break;
          case 'tempo':
            dadosProcessados = processarTempo(rawData, data);
            break;
          case 'fatporhora':
            dadosProcessados = processarFatPorHora(rawData, data);
            break;
        }
        
        // Inserir no Supabase
        const resultado = await inserirDados(`contahub_${relatorio}`, dadosProcessados);
        resultadoData.relatorios[relatorio] = resultado;
        
        console.log(`✅ ${relatorio}: ${resultado.inseridos}/${dadosProcessados.length} inseridos`);
        
      } catch (error) {
        console.error(`❌ Erro em ${relatorio}:`, error.message);
        resultadoData.relatorios[relatorio] = { inseridos: 0, erros: 1 };
      }
      
      // Pausa entre relatórios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const tempoData = Math.round((Date.now() - inicioData) / 1000);
    console.log(`⏱️ ${data} processado em ${tempoData}s`);
    
    resultados.push(resultadoData);
    
    // Pausa entre dias
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMO MÊS ${mes}/${ano}`);
  console.log(`${'='.repeat(60)}`);
  
  const totais = {};
  relatorios.forEach(rel => totais[rel] = { inseridos: 0, erros: 0 });
  
  resultados.forEach(r => {
    relatorios.forEach(rel => {
      totais[rel].inseridos += r.relatorios[rel]?.inseridos || 0;
      totais[rel].erros += r.relatorios[rel]?.erros || 0;
    });
  });
  
  console.log('\n📋 Totais por relatório:');
  relatorios.forEach(rel => {
    console.log(`${rel}: ${totais[rel].inseridos} inseridos, ${totais[rel].erros} erros`);
  });
  
  console.log(`\n🎉 MÊS ${mes}/${ano} PROCESSADO!`);
}

// Atalho para julho
async function processarJulhoCompleto(ano = 2025) {
  return processarMesCompleto(ano, 7);
}

// Execução por linha de comando
// Exemplos:
//  node exemplo_teste/contahub/processar-backlog-direto.js julho 2025
//  node exemplo_teste/contahub/processar-backlog-direto.js mes 2025 7
//  node exemplo_teste/contahub/processar-backlog-direto.js tempo:agosto 2025
//  node exemplo_teste/contahub/processar-backlog-direto.js tempo:mes 2025 8
const mode = process.argv[2];
if (mode === 'julho') {
  const ano = parseInt(process.argv[3] || '2025', 10);
  processarJulhoCompleto(ano).catch(console.error);
} else if (mode === 'mes') {
  const ano = parseInt(process.argv[3] || '2025', 10);
  const mes = parseInt(process.argv[4] || '7', 10);
  processarMesCompleto(ano, mes).catch(console.error);
} else if (mode === 'tempo:agosto') {
  const ano = parseInt(process.argv[3] || '2025', 10);
  processarTempoAgosto(ano).catch(console.error);
} else if (mode === 'tempo:mes') {
  const ano = parseInt(process.argv[3] || '2025', 10);
  const mes = parseInt(process.argv[4] || '8', 10);
  processarTempoMes(ano, mes).catch(console.error);
} else {
  // Executar backlog completo (padrão atual)
  processarBacklogCompleto().catch(console.error);
}
