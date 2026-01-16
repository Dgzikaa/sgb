const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

async function extractPdf(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`ARQUIVO: ${filename}`);
    console.log('='.repeat(80));
    
    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;
    
    console.log(`\nPáginas: ${pdfDocument.numPages}`);
    console.log(`\n--- CONTEÚDO ---\n`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n=== PÁGINA ${i} ===\n${pageText}\n`;
    }
    
    console.log(fullText);
    console.log(`\n--- FIM ---\n`);
    
    // Salvar em arquivo txt
    const txtFilename = filename.replace('.pdf', '.txt');
    fs.writeFileSync(path.join(__dirname, txtFilename), fullText, 'utf-8');
    console.log(`✅ Salvo em: ${txtFilename}`);
    
    return fullText;
  } catch (error) {
    console.error(`Erro ao processar ${filename}:`, error.message);
    return null;
  }
}

async function main() {
  const files = [
    'Fechamento Trimestral Ordinário 4º Tri - 2025.pdf',
    'Pauta Reunião Conselho de Cotistas Ordinario 4º Tri 2025.docx.pdf'
  ];
  
  for (const file of files) {
    await extractPdf(file);
  }
}

main();
