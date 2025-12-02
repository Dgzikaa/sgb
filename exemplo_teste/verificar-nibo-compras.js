const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarCompras() {
  console.log('🔍 Verificando dados de compras no NIBO...\n');

  // Buscar Nov/24
  const { data, error } = await supabase
    .from('nibo_agendamentos')
    .select('data_competencia, categoria_nome, valor, descricao')
    .eq('bar_id', 1)
    .gte('data_competencia', '2024-11-01')
    .lte('data_competencia', '2024-11-30');

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log(`📊 Total registros Nov/24: ${data.length}`);

  const compras = data.filter(d => 
    d.categoria_nome?.toLowerCase().includes('compr') ||
    d.categoria_nome?.toLowerCase().includes('aliment') ||
    d.categoria_nome?.toLowerCase().includes('bebid')
  );

  console.log(`🛒 Compras encontradas: ${compras.length}`);
  
  const total = compras.reduce((s, c) => s + parseFloat(c.valor || 0), 0);
  console.log(`💰 Total: R$ ${total.toFixed(2)}\n`);

  console.log('📋 Primeiras 10 compras:');
  compras.slice(0, 10).forEach(c => {
    console.log(`  - ${c.data_competencia} | ${c.categoria_nome} | R$ ${parseFloat(c.valor).toFixed(2)} | ${c.descricao?.substring(0, 40) || ''}`);
  });

  console.log('\n📅 Compras por semana:');
  const porSemana = {};
  compras.forEach(c => {
    const data = new Date(c.data_competencia + 'T00:00:00');
    const semana = getWeekNumber(data);
    if (!porSemana[semana]) porSemana[semana] = 0;
    porSemana[semana] += parseFloat(c.valor || 0);
  });

  Object.keys(porSemana).sort().forEach(semana => {
    console.log(`  S${semana}: R$ ${porSemana[semana].toFixed(2)}`);
  });
}

function getWeekNumber(date) {
  const target = new Date(date);
  const dayOfWeek = target.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(target);
  monday.setDate(target.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  
  const janFirst = new Date(monday.getFullYear(), 0, 1);
  const diffInMs = monday.getTime() - janFirst.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffInDays / 7) + 1;
  
  return weekNumber;
}

verificarCompras();

