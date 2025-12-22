const fs = require('fs');
const path = require('path');

// Carregar .env.local do frontend
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1);
      process.env[key] = value;
    }
  }
});

const { createClient } = require('@supabase/supabase-js');

async function listarEventosSympla() {
  console.log('🔍 Buscando todos eventos da API Sympla...');
  
  // Buscar token do banco
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: creds, error } = await supabase
    .from('api_credentials')
    .select('api_token')
    .eq('bar_id', 3)
    .eq('sistema', 'sympla')
    .eq('ativo', true)
    .single();
  
  if (error || !creds?.api_token) {
    console.log('❌ Token Sympla não encontrado:', error?.message);
    return;
  }
  
  console.log('✅ Token Sympla obtido do banco');
  
  // Buscar eventos da API Sympla (todas as páginas)
  let todosEventos = [];
  let pagina = 1;
  let temMais = true;
  
  while (temMais) {
    console.log(`📄 Buscando página ${pagina}...`);
    const response = await fetch(`https://api.sympla.com.br/public/v1.5.1/events?page=${pagina}`, {
      headers: {
        's_token': creds.api_token,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      todosEventos = todosEventos.concat(data.data);
      pagina++;
      if (data.data.length < 100) temMais = false;
    } else {
      temMais = false;
    }
  }
  
  console.log('\n📊 Total eventos na API:', todosEventos.length);
  
  // Filtrar eventos de dezembro 2025
  const eventosDezembro = todosEventos.filter(e => {
    if (!e.start_date) return false;
    const data = new Date(e.start_date);
    return data.getMonth() === 11 && data.getFullYear() === 2025;
  });
  
  console.log('\n🎄 EVENTOS DE DEZEMBRO 2025:');
  if (eventosDezembro.length === 0) {
    console.log('   Nenhum evento encontrado em dezembro 2025');
  } else {
    eventosDezembro.forEach((evento, i) => {
      const dataEvento = evento.start_date ? evento.start_date.split('T')[0] : 'sem data';
      console.log(`   ${i+1}. ${evento.name}`);
      console.log(`      Data: ${dataEvento} | ID: ${evento.id}`);
    });
  }
  
  // Listar todos os eventos recentes
  console.log('\n📋 TODOS OS EVENTOS (mais recentes primeiro):');
  todosEventos
    .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0))
    .slice(0, 20)
    .forEach((evento, i) => {
      const dataEvento = evento.start_date ? evento.start_date.split('T')[0] : 'sem data';
      console.log(`   ${i+1}. ${evento.name} - ${dataEvento}`);
    });
}

listarEventosSympla();

