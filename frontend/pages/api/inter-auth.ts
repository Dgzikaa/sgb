import type { NextApiRequest, NextApiResponse } from 'next'
import https from 'https'
import fs from 'fs'
import os from 'os'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
        INTER_CERT,
        INTER_KEY,
        INTER_CA_CERT,
        INTER_CLIENT_ID,
        INTER_CLIENT_SECRET,
      } = process.env
      
      if (!INTER_CERT || !INTER_KEY || !INTER_CA_CERT || !INTER_CLIENT_ID || !INTER_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Variáveis de ambiente ausentes' })
      }

    // Criar arquivos temporários com os certificados decodificados
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inter-'))
    const certPath = path.join(tempDir, 'cert.pem')
    const keyPath = path.join(tempDir, 'key.pem')
    const caPath = path.join(tempDir, 'ca.pem')

    fs.writeFileSync(certPath, Buffer.from(INTER_CERT, 'base64'))
    fs.writeFileSync(keyPath, Buffer.from(INTER_KEY, 'base64'))
    fs.writeFileSync(caPath, Buffer.from(INTER_CA_CERT, 'base64'))

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
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      ca: fs.readFileSync(caPath),
    }

    const request = https.request(options, (response) => {
      let body = ''
      response.on('data', (chunk) => (body += chunk))
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          res.status(response.statusCode || 200).json(parsed)
        } catch {
          res.status(200).json({ raw: body })
        }
      })
    })

    request.on('error', (e) => {
      console.error('Erro na requisição:', e)
      res.status(500).json({ error: e.message })
    })

    request.write(data)
    request.end()
  } catch (err: any) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: err.message || 'Erro desconhecido' })
  }
}
