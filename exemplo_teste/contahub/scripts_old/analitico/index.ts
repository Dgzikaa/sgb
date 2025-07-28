import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnaliticoRequest {
  bar_id?: number;
  data_inicio?: string;
  data_fim?: string;
  produto?: string;
  grupo?: string;
  local?: string;
  turno?: string;
  mesa?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      bar_id = 1, 
      data_inicio, 
      data_fim,
      produto = '',
      grupo = '',
      local = '',
      turno = '',
      mesa = ''
    } = await req.json();

    console.log('🚀 ANALÍTICO DINÂMICO: Dados reais do ContaHub → Formato compatível');
    console.log('======================================================================');
    console.log(`📅 Período: ${data_inicio} → ${data_fim}`);
    console.log(`🏪 Bar ID: ${bar_id}`);
    console.log(`🔍 Filtros: produto=${produto}, grupo=${grupo}, local=${local}, turno=${turno}, mesa=${mesa}`);

    // 1. Login direto (mesmo padrão da período que funciona)
    console.log('🔐 Fazendo login direto no ContaHub...');
    
    // Credenciais do Bar Ordinário (mesmo padrão que funciona)
    const contahub_email = "digao@3768";
    const contahub_senha = "Geladeira@001";
    
    // Converter senha para SHA1
    const passwordSha1 = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(contahub_senha));
    const passwordSha1Hex = Array.from(new Uint8Array(passwordSha1))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const loginData = new URLSearchParams({
      "usr_email": contahub_email,
      "usr_password_sha1": passwordSha1Hex
    });

    // URL CORRETA do testefinal.py (comprovada funcionando)
    const loginResponse = await fetch("https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: loginData.toString()
    });

    if (!loginResponse.ok) {
      throw new Error(`Erro no login ContaHub: ${loginResponse.status}`);
    }

    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (!setCookieHeaders) {
      throw new Error('Não foi possível obter cookies de autenticação');
    }

    console.log(`✅ Login realizado com sucesso!`);

    // 2. Configurar URL real do ContaHub para ANALÍTICO (baseado no testefinal.py)
    const emp_id = bar_id === 1 ? "3768" : "3691"; // Ordinário ou Deboche
    const analitico_url = bar_id === 1 
      ? "https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1742237860621" // Ordinário
      : "https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1742237860621"; // Mesmo para Deboche

    // 3. Converter datas DD.MM.YYYY para YYYY-MM-DD (formato ContaHub)
    const start_date = data_inicio ? data_inicio.split('.').reverse().join('-') : '';
    const end_date = data_fim ? data_fim.split('.').reverse().join('-') : '';
    
    // 4. Construir URL completa com filtros (exatamente como testefinal.py)
    const params = `&produto=${produto}&grupo=${grupo}&local=${local}&turno=${turno}&mesa=${mesa}`;
    const query_url = `${analitico_url}?qry=77&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1${params}`;
    
    console.log(`🔗 URL ContaHub: ${query_url}`);

    // 5. Fazer requisição ao ContaHub (mesmo padrão da período)
    const response = await fetch(query_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": setCookieHeaders,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados analítico: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`✅ Resposta obtida: ${responseText.length} caracteres`);

    // 6. Parsear resposta JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Dados JSON parseados com sucesso');
    } catch (parseError) {
      throw new Error(`Erro ao parsear JSON: ${parseError.message}`);
    }

    // 7. Verificar estrutura de dados (mesmo padrão da período)
    let records = [];
    if (data && data.list && Array.isArray(data.list)) {
      records = data.list;
      console.log(`📊 ${records.length} registros de analítico encontrados`);
    } else {
      console.log('⚠️ Estrutura de dados inesperada');
      console.log(`📋 Estrutura disponível: ${Object.keys(data || {})}`);
    }

    // Log do primeiro registro para debug
    if (records.length > 0) {
      console.log(`📄 Primeiro registro:`, JSON.stringify(records[0], null, 2));
    }

    // 8. Retornar no formato compatível (mesmo padrão da período)
    return Response.json({
      success: true,
      data: {
        raw_response: data,
        list: records,
        contahub: {
          usuario: 'Digao',
          empresa: 'Ordinário', 
          emp_id: emp_id,
          records_found: records.length
        }
      },
      meta: {
        bar_id,
        data_inicio,
        data_fim,
        start_date,
        end_date,
        emp_id,
        filters: {
          produto,
          grupo,
          local,
          turno,
          mesa
        },
        url: query_url,
        timestamp: new Date().toISOString()
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Erro na Edge Function analítico:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}); 