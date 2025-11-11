const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/app/api/gestao/eventos';

function replaceInFile(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const newContent = content.replace(/\.from\('eventos'\)/g, ".from('eventos_base')");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log('✅ Atualizado:', file);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(dir);
console.log('✅ Substituição concluída!');

