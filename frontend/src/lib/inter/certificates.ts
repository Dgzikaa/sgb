import fs from 'fs';
import path from 'path';

// Cache dos certificados para evitar recarregar
let cachedCert: Buffer | null = null;
let cachedKey: Buffer | null = null;

export function getInterCertificates(): { cert: Buffer; key: Buffer } {
  if (cachedCert && cachedKey) {
    return { cert: cachedCert, key: cachedKey };
  }

  // 1. PRIORIDADE: Variáveis de ambiente (Vercel)
  if (process.env.INTER_CERT_BASE64 && process.env.INTER_KEY_BASE64) {
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64');

    console.log('📄 Certificado Base64 (env) carregado:', cert.length, 'bytes');
    console.log(
      '🔑 Chave privada Base64 (env) carregada:',
      key.length,
      'bytes'
    );

    cachedCert = cert;
    cachedKey = key;
    return { cert, key };
  }

  // 2. Tentar carregar certificados PEM de src/lib/inter (desenvolvimento local)
  const certPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'inter',
    'fullchain.pem'
  );
  const keyPath = path.join(process.cwd(), 'src', 'lib', 'inter', 'key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);

    console.log('📄 Certificado PEM carregado:', cert.length, 'bytes');
    console.log('🔑 Chave privada PEM carregada:', key.length, 'bytes');

    cachedCert = cert;
    cachedKey = key;
    return { cert, key };
  }

  // 3. Tentar base64 de public/inter (fallback)
  const certBase64Path = path.join(
    process.cwd(),
    'public',
    'inter',
    'cert_base64.txt'
  );
  const keyBase64Path = path.join(
    process.cwd(),
    'public',
    'inter',
    'key_base64.txt'
  );

  if (fs.existsSync(certBase64Path) && fs.existsSync(keyBase64Path)) {
    const certBase64 = fs.readFileSync(certBase64Path, 'utf8').trim();
    const keyBase64 = fs.readFileSync(keyBase64Path, 'utf8').trim();

    const cert = Buffer.from(certBase64, 'base64');
    const key = Buffer.from(keyBase64, 'base64');

    console.log('📄 Certificado base64 carregado:', cert.length, 'bytes');
    console.log('🔑 Chave privada base64 carregada:', key.length, 'bytes');

    cachedCert = cert;
    cachedKey = key;
    return { cert, key };
  }

  throw new Error(
    'Certificados mTLS não encontrados. Configure INTER_CERT_BASE64 e INTER_KEY_BASE64 no Vercel.'
  );
}
