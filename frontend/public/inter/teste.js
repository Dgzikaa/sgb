const https = require('https')
const fs = require('fs')
const path = require('path')

async function testInterAuth() {
  // Client ID e Secret fixos (troque se precisar)
  const INTER_CLIENT_ID = '1f1dd686-888c-4fb7-82b6-ef32c14e243c'
  const INTER_CLIENT_SECRET = 'e5ad8de8-eb3b-4feb-8890-79e52c2b97f9'

  const data = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: INTER_CLIENT_ID,
    client_secret: INTER_CLIENT_SECRET,
  }).toString()

  const options = {
    hostname: 'cdpj.partners.bancointer.com.br',
    port: 443,
    path: '/oauth/v2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    },
    cert: fs.readFileSync(path.join(__dirname, 'fullchain.pem')),
    key: fs.readFileSync(path.join(__dirname, 'key.key')),
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve({ statusCode: res.statusCode ?? 0, body: json })
        } catch {
          resolve({ statusCode: res.statusCode ?? 0, body })
        }
      })
    })

    req.on('error', (e) => reject(e))

    req.write(data)
    req.end()
  })
}

;(async () => {
  try {
    console.log('Iniciando teste da autenticação Inter...')
    const response = await testInterAuth()
    console.log('Resposta da API Banco Inter:', response)
  } catch (e) {
    console.error('Erro na requisição:', e)
  }
})()
