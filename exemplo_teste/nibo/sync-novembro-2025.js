#!/usr/bin/env node

/**
 * SINCRONIZAÇÃO ESPECÍFICA - NOVEMBRO 2025
 * 
 * Este script força uma sincronização dos dados de novembro 2025
 * após a correção do filtro de datas.
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

console.log('🚀 SINCRONIZAÇÃO NOVEMBRO 2025');
console.log('=' .repeat(60));

async function syncNovembro() {
  try {
    console.log('\n📤 Chamando Edge Function com modo daily_complete...');
    console.log('📅 Período: Últimos 3 meses + 1 mês futuro (após correção)');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/nibo-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        barId: '3',
        cronSecret: 'manual_test',
        sync_mode: 'daily_complete'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('\n✅ Sincronização executada!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    // Aguardar processamento
    console.log('\n⏳ Aguardando 10 segundos para processamento...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar dados de novembro
    console.log('\n🔍 Verificando dados de novembro 2025...');
    
    const verificarResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&select=categoria_nome,count`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (verificarResponse.ok) {
      const dados = await verificarResponse.json();
      const countHeader = verificarResponse.headers.get('content-range');
      
      console.log('\n📊 RESULTADO - Novembro 2025:');
      console.log('Total de agendamentos:', countHeader);
      
      // Agrupar por categoria
      const categorias = {};
      dados.forEach(item => {
        if (item.categoria_nome) {
          categorias[item.categoria_nome] = (categorias[item.categoria_nome] || 0) + 1;
        }
      });
      
      console.log('\n📋 Por categoria:');
      Object.entries(categorias).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  • ${cat}: ${count} registros`);
      });
      
      // Verificar especificamente as categorias que precisamos
      const atracoesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&categoria_nome=eq.Atrações Programação&select=stakeholder_nome,valor,data_competencia`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      if (atracoesResponse.ok) {
        const atracoes = await atracoesResponse.json();
        console.log('\n🎭 Atrações Programação em Novembro:');
        if (atracoes.length > 0) {
          atracoes.forEach(a => {
            console.log(`  • ${a.data_competencia}: ${a.stakeholder_nome} - R$ ${a.valor}`);
          });
          const total = atracoes.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);
          console.log(`  📊 TOTAL: R$ ${total.toFixed(2)}`);
        } else {
          console.log('  ⚠️ Nenhuma atração encontrada');
        }
      }
      
      // Verificar produção
      const producaoResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/nibo_agendamentos?bar_id=eq.3&data_competencia=gte.2025-11-01&data_competencia=lt.2025-12-01&categoria_nome=eq.Produção Eventos&select=stakeholder_nome,valor,data_competencia`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      if (producaoResponse.ok) {
        const producao = await producaoResponse.json();
        console.log('\n🎬 Produção Eventos em Novembro:');
        if (producao.length > 0) {
          producao.forEach(p => {
            console.log(`  • ${p.data_competencia}: ${p.stakeholder_nome} - R$ ${p.valor}`);
          });
          const total = producao.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
          console.log(`  📊 TOTAL: R$ ${total.toFixed(2)}`);
        } else {
          console.log('  ⚠️ Nenhuma produção encontrada');
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Sincronização de novembro concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  syncNovembro().catch(console.error);
}

