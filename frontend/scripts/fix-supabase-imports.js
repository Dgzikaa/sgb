const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/agente/alertas/route.ts',
  'src/app/api/agente/analise-periodos/route.ts',
  'src/app/api/agente/auditoria/route.ts',
  'src/app/api/agente/chat/route.ts',
  'src/app/api/agente/configuracoes/route.ts',
  'src/app/api/agente/evolucao/route.ts',
  'src/app/api/agente/feedback/route.ts',
  'src/app/api/agente/insights/route.ts',
  'src/app/api/agente/mapear-tabelas/route.ts',
  'src/app/api/agente/metricas/route.ts',
  'src/app/api/agente/scan/route.ts',
  'src/app/api/agente/supervisor/route.ts',
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir import
    content = content.replace(
      /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs'/g,
      "import { createClient } from '@/lib/supabase-server'"
    );
    
    // Remover import de cookies se existir
    content = content.replace(
      /import { cookies } from 'next\/headers'\n/g,
      ''
    );
    
    // Substituir createRouteHandlerClient({ cookies })
    content = content.replace(
      /createRouteHandlerClient\(\{ cookies \}\)/g,
      'createClient()'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n🎉 All files fixed!');
