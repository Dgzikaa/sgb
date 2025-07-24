import https from 'https'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

let cachedToken: string | null = null
let tokenExpiresAt: number | null = null

export async function getInterAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 30_000) return cachedToken

  const p12Path = path.join(process.cwd(), 'public', 'inter', 'client.p12')
  const p12Buffer = fs.readFileSync(p12Path)

  const agent = new https.Agent({
    pfx: p12Buffer,
    passphrase: ''
  })

  const res = await axios.post(
    'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.INTER_CLIENT_ID!,
      client_secret: process.env.INTER_CLIENT_SECRET!,
      scope: 'extrato.read pagamento-pix.write webhook.read webhook.write'
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      httpsAgent: agent
    }
  )

  cachedToken = res.data.access_token
  tokenExpiresAt = now + res.data.expires_in * 1000
  return cachedToken
} 