import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ========================================
// SGB ORCHESTRATOR - EXECUÇÃO DIÁRIA AUTOMÁTICA
// Sistema: Orquestra todas as Edge Functions para dados do dia anterior
// Uso: Cron job diário às 08:00
// ========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleResult {
  module: string;
  status: 'success' | 'error';
  message: string;
  inserted?: number;
  skipped?: number;
  total_processed?: number;
  execution_time?: number;
  error?: string;
}

interface OrchestrationResult {
  execution_date: string;
  data_date: string;
  total_modules: number;
  successful_modules: number;
  failed_modules: number;
  total_records_inserted: number;
  total_records_skipped: number;
  total_execution_time: number;
  modules: ModuleResult[];
  summary: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Calcular data de ontem no formato DD.MM.YYYY
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const dataOntem = `${day}.${month}.${year}`;
    const executionDate = new Date().toISOString();

    console.log('🎯 SGB ORCHESTRATOR - EXECUÇÃO DIÁRIA');
    console.log('================================================');
    console.log(`📅 Data de execução: ${executionDate}`);
    console.log(`📊 Processando dados de: ${dataOntem}`);
    console.log('================================================');

    // URLs das Edge Functions (baseadas no config.py)
    const BASE_URL = 'https://iddtrhexgjbfhxebpklf.supabase.co/functions/v1';
    
    const modules = [
      {
        name: 'fatporhora',
        url: `${BASE_URL}/contahub-fatporhora-v2`,
        priority: 1
      },
      {
        name: 'tempo', 
        url: `${BASE_URL}/contahub-tempo-dinamico`,
        priority: 2
      },
      {
        name: 'pagamentos',
        url: `${BASE_URL}/contahub-pagamentos-final`,
        priority: 3
      },
      {
        name: 'analitico',
        url: `${BASE_URL}/contahub-analitico-dinamico`,
        priority: 4
      },
      {
        name: 'periodo',
        url: `${BASE_URL}/contahub-periodo-dinamico`,
        priority: 5
      },
      {
        name: 'nfs',
        url: `${BASE_URL}/contahub-nfs-dinamico`,
        priority: 6
      }
    ];

    const results: ModuleResult[] = [];
    let totalInserted = 0;
    let totalSkipped = 0;
    let successfulModules = 0;

    // Executar cada módulo sequencialmente
    for (const module of modules) {
      const moduleStartTime = Date.now();
      
      console.log(`\n🔄 [${module.priority}/${modules.length}] Executando: ${module.name.toUpperCase()}`);
      console.log(`🔗 URL: ${module.url}`);

      try {
        // Payload para cada função
        const payload = {
          bar_id: 1,
          data_inicio: dataOntem,
          data_fim: dataOntem
        };

        // Adicionar parâmetros específicos por módulo
        if (module.name === 'pagamentos') {
          (payload as any).meio = '';
        }
        if (module.name === 'analitico') {
          (payload as any).produto = '';
          (payload as any).grupo = '';
          (payload as any).local = '';
          (payload as any).turno = '';
          (payload as any).mesa = '';
        }
        if (module.name === 'tempo') {
          (payload as any).prod = '';
          (payload as any).grupo = '';
          (payload as any).local = '';
        }

        console.log(`📦 Payload: ${JSON.stringify(payload)}`);

        const response = await fetch(module.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify(payload)
        });

        const moduleEndTime = Date.now();
        const executionTime = moduleEndTime - moduleStartTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        const moduleResult: ModuleResult = {
          module: module.name,
          status: 'success',
          message: result.message || 'Executado com sucesso',
          inserted: result.result?.inserted || 0,
          skipped: result.result?.skipped || 0,
          total_processed: result.result?.total_processed || 0,
          execution_time: executionTime
        };

        totalInserted += moduleResult.inserted || 0;
        totalSkipped += moduleResult.skipped || 0;
        successfulModules++;

        console.log(`✅ ${module.name.toUpperCase()} - SUCESSO`);
        console.log(`   📊 Inseridos: ${moduleResult.inserted}`);
        console.log(`   ⏭️ Ignorados: ${moduleResult.skipped}`);
        console.log(`   ⏱️ Tempo: ${Math.round(executionTime/1000)}s`);

        results.push(moduleResult);

      } catch (error) {
        const moduleEndTime = Date.now();
        const executionTime = moduleEndTime - moduleStartTime;

        const moduleResult: ModuleResult = {
          module: module.name,
          status: 'error',
          message: 'Falha na execução',
          error: error.message,
          execution_time: executionTime
        };

        console.log(`❌ ${module.name.toUpperCase()} - ERRO`);
        console.log(`   💥 Erro: ${error.message}`);
        console.log(`   ⏱️ Tempo: ${Math.round(executionTime/1000)}s`);

        results.push(moduleResult);
      }

      // Pausa entre módulos (2 segundos)
      if (module.priority < modules.length) {
        console.log('⏸️ Pausando 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    const failedModules = modules.length - successfulModules;

    // Montar resultado final
    const orchestrationResult: OrchestrationResult = {
      execution_date: executionDate,
      data_date: dataOntem,
      total_modules: modules.length,
      successful_modules: successfulModules,
      failed_modules: failedModules,
      total_records_inserted: totalInserted,
      total_records_skipped: totalSkipped,
      total_execution_time: totalExecutionTime,
      modules: results,
      summary: `Execução ${successfulModules === modules.length ? 'COMPLETA' : 'PARCIAL'}: ${successfulModules}/${modules.length} módulos, ${totalInserted} registros inseridos`
    };

    console.log('\n================================================');
    console.log('📊 RESULTADO FINAL DA ORQUESTRAÇÃO');
    console.log('================================================');
    console.log(`📅 Data processada: ${dataOntem}`);
    console.log(`✅ Módulos com sucesso: ${successfulModules}/${modules.length}`);
    console.log(`❌ Módulos com erro: ${failedModules}`);
    console.log(`💾 Total de registros inseridos: ${totalInserted}`);
    console.log(`⏭️ Total de registros ignorados: ${totalSkipped}`);
    console.log(`⏱️ Tempo total de execução: ${Math.round(totalExecutionTime/1000)}s`);
    console.log(`🎯 Status: ${successfulModules === modules.length ? '✅ SUCESSO TOTAL' : '⚠️ SUCESSO PARCIAL'}`);

    return Response.json({
      success: true,
      message: orchestrationResult.summary,
      result: orchestrationResult
    }, { headers: corsHeaders });

  } catch (error) {
    const totalExecutionTime = Date.now() - startTime;
    
    console.error('💥 ERRO CRÍTICO NA ORQUESTRAÇÃO:', error);

    return Response.json({
      success: false,
      error: error.message || 'Erro interno na orquestração',
      execution_time: totalExecutionTime,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}); 