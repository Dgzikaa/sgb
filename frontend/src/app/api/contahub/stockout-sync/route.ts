import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// IDs dos bares que devem ser sincronizados
const BARES_ATIVOS = [3, 4]; // 3 = Ordinário Bar, 4 = Deboche Bar

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Executando sincronização diária automática de stockout para TODOS os bares...');
    
    // Usar data de ontem (dados do dia anterior às 20h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const targetDate = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Data alvo para stockout: ${targetDate}`);
    
    const resultados = [];
    
    for (const barId of BARES_ATIVOS) {
      console.log(`\n🍺 Sincronizando stockout bar_id=${barId}...`);
      
      try {
        const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-stockout-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            data_date: targetDate,
            bar_id: barId
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro bar_id=${barId}: ${errorText}`);
          resultados.push({ bar_id: barId, success: false, error: errorText });
          continue;
        }
        
        const result = await response.json();
        console.log(`✅ bar_id=${barId}: ${result.summary?.total_produtos || 0} produtos`);
        resultados.push({ bar_id: barId, success: true, result });
      } catch (err) {
        console.error(`❌ Erro bar_id=${barId}:`, err);
        resultados.push({ bar_id: barId, success: false, error: err instanceof Error ? err.message : 'Erro' });
      }
    }
    
    const totalSucesso = resultados.filter(r => r.success).length;
    console.log(`\n📦 Sincronização de stockout concluída: ${totalSucesso}/${BARES_ATIVOS.length} bares`);
    
    return NextResponse.json({
      success: totalSucesso > 0,
      message: `Sincronização de stockout executada para ${totalSucesso}/${BARES_ATIVOS.length} bares`,
      resultados,
      timestamp: new Date().toISOString(),
      cron_job: true
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      cron_job: true
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📦 Executando sincronização manual de stockout via POST...');
    
    const body = await request.json();
    const { data_date, bar_id } = body;
    
    // Se não especificado, usar data de ontem
    const targetDate = data_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Se especificar bar_id, usar apenas esse; senão sincronizar todos
    const baresParaSincronizar = bar_id ? [bar_id] : BARES_ATIVOS;
    
    console.log(`📅 Data alvo para stockout: ${targetDate}`);
    console.log(`🍺 Bares: ${baresParaSincronizar.join(', ')}`);
    
    const resultados = [];
    
    for (const barIdItem of baresParaSincronizar) {
      try {
        const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-stockout-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            data_date: targetDate,
            bar_id: barIdItem
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          resultados.push({ bar_id: barIdItem, success: false, error: errorText });
          continue;
        }
        
        const result = await response.json();
        console.log(`✅ bar_id=${barIdItem}: ${result.summary?.total_produtos || 0} produtos`);
        resultados.push({ bar_id: barIdItem, success: true, result });
      } catch (err) {
        resultados.push({ bar_id: barIdItem, success: false, error: err instanceof Error ? err.message : 'Erro' });
      }
    }
    
    return NextResponse.json({
      success: resultados.some(r => r.success),
      message: `Sincronização de stockout executada para data: ${targetDate}`,
      resultados,
      timestamp: new Date().toISOString(),
      cron_job: false
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização manual de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      cron_job: false
    }, { status: 500 });
  }
}
