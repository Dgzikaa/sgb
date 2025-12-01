// Script para debugar estrutura da planilha de Reservas
const { google } = require('googleapis');
const fs = require('fs');

const FILE_ID = '1HXSsGWum84HrB3yRvuzv-TsPcd8wEywVrOztdFcHna0';

// Credenciais
const CREDENTIALS = {
  client_email: 'contaazul-sheets-service@canvas-landing-447918-h7.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFOiRlV86rqUPm
v/aadmu68+JgOQtvTxJ0dOT9BEOvd3nIJwbtda7NdBlcE7naIlrl7jkngLUUBu32
rBjzkFuGXRPzYqof4bBPCKVRiNOmN9hpmJHV7XrCXLEscBuyzM6Wp/owKbrAq93T
9oQixv9Xng4NjtYIQDwql4ngmEDxQdWCDtLersPpcOh2WDiuAqHCRraIjd7sHU9T
WDnn3wbKF7UhsDEmIQVZOsG/75kW9jycs8WGtXQUd7TSK700pw/7YfRqwJX17xpm
selgcYG5fKzcpFZz4fe06TeCjVtvt4ksb8LzoCPnaZLDn3EK3ywf9UxZQs7jta1g
6cCh1j1DAgMBAAECggEADUORQg2LNSk/i0u6sn2nVh3jyhPcDILVW2anJcr9IFZZ
JthVE3A4LtIRiIs9Ewn/cfo49sqlovCqXU4KqYq6VQl6d4JZraY4fMA4mgipL0MP
N17O5APCH0MrmTD68+XpOOGYJlgQGrgURZaNIWefsY1MJaZHB6wGP9kMKUIkD/V+
rOh1v1i4u3gbeRzvk3djHx8L8CJbsqRR7YGypZHEgPdt05EpjjMpNI3Doiz6OtPb
0Avxvhfg4xGqX7+mJfNXJoYkMpNq9+Jkfa7uTtnMpRq1RTJKykNaHpCVGnHf9wla
O9YpI6kv88bZvzqjm0XgQrPj9sR4cXsYLJJDxZiuxQKBgQDzBl8888jWDW2YtqZb
0NKea/DMqfdOvBtx4Rk7oYz36gLjGKo950fxGtiG3DyjbNr+ZEEcvR+F3Pwn+ahh
9IkD592yXwLPyLGPH15mgJofbccUrFmzz0n4s2bt2stO310QqTLZeiWYz4L2qDmx
YLw60SYIkP9G/AXor5yiyiFddQKBgQDPwdAhys8n9c+fBOBvJrj3mqGXjj4OBiDn
/5VTD2ERebbav3ZGdQbTJkCH+AWHo047SvYc6/4h2vuRaQWVh+EcyG16BmuGu5SW
oSB0+eoOzqpkTBSefJ/fh6O0YYITexsOwwxMUBNhtiE+Nia1l6NcnHyS/4Edjuei
jy5e7rXA1wKBgH8KHrELMzqKLHd/S3mFsQQ1otwqIWicNrCSHhGpArr6LmYul5fi
lh34jaX57Qz1M4l2OP9f8eGVQo9XF+mU3icXhzHeLucVn5QUrtFgerDhPweUjRPM
0XtbtPuzu0HQy6KRAE7lZk/6chikmfwaeGs6t+oUeg3OYvxfCL+kcEqdAoGATqzE
lqdov2c00rFUFIODdDCYlP4GveTQPUrqT2P5jFadSkVLEu9qQDeyJEtmPLE5BPck
MFumB0gYED7HIJMuSmoUGyunOIR8hnZKBkJFwom8uPKetE3ZdRq2ga6TRbFO085F
L/j6/fuspxR2oDnmYUHZYwli6cCeM08pbkXTik0CgYEAyaA1jU2/9IYIJzLyckmt
HiNA7UjlSnkgMr4cdQIDZfbrewPguLQaaKlDXte7Pt8r04lw/Hvg/ZMq8Sa+wArj
MgxgpEwLOOhgr6GkpkGHCJQvbVAU6VnWncovkOfNfVUU/S6VL7hXRbXrXntZ34ec
fict34UnfFfDpdLHjxA7AQc=
-----END PRIVATE KEY-----`
};

async function debugReservas() {
  try {
    console.log('🔍 Iniciando debug da planilha de Reservas...\n');

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Tentar baixar o arquivo
    console.log(`📥 Tentando acessar planilha: ${FILE_ID}\n`);
    
    try {
      const response = await drive.files.export({
        fileId: FILE_ID,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }, { responseType: 'arraybuffer' });

      console.log('✅ Planilha acessada com sucesso!\n');

      // Usar SheetJS para ler
      const XLSX = require('xlsx');
      const workbook = XLSX.read(Buffer.from(response.data), { type: 'buffer' });
      
      console.log('📊 Abas encontradas:', workbook.SheetNames, '\n');

      // Ler primeira aba
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });

      console.log(`📝 Total de linhas: ${data.length}\n`);

      // Mostrar header
      console.log('HEADER (linha 1):');
      console.log(data[0]);
      console.log('\n');

      // Mostrar primeiras 5 linhas de dados
      console.log('PRIMEIRAS 5 LINHAS DE DADOS:');
      for (let i = 1; i <= 5 && i < data.length; i++) {
        console.log(`\nLinha ${i}:`);
        console.log(`  [0] Carimbo: "${data[i][0]}"`);
        console.log(`  [1] Campo 1: "${data[i][1]}"`);
        console.log(`  [2] Campo 2: "${data[i][2]}"`);
        console.log(`  [3] Campo 3: "${data[i][3]}"`);
        console.log(`  [4] Campo 4: "${data[i][4]}"`);
        console.log(`  [5] Campo 5: "${data[i][5]}"`);
      }

    } catch (error) {
      console.error('❌ ERRO ao acessar planilha:', error.message);
      console.error('\n⚠️  POSSÍVEIS CAUSAS:');
      console.error('   1. Planilha NÃO foi compartilhada com a service account');
      console.error('   2. ID da planilha está incorreto');
      console.error('\n📧 Compartilhe com: contaazul-sheets-service@canvas-landing-447918-h7.iam.gserviceaccount.com');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugReservas();

