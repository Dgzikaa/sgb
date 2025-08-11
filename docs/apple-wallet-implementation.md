# Apple Wallet - Implementação Correta

## Fluxo Correto (Web)

1. **Backend** gera um `.pkpass` assinado (Pass Type ID cert + cadeia da Apple)
2. **Endpoint** responde com `Content-Type: application/vnd.apple.pkpass`
3. **Front** mostra o badge oficial da Apple
4. **iPhone** ao tocar, abre o Wallet automaticamente com o passe

## Pontos Importantes

- Apple exige usar o badge oficial, não botão customizado
- Para atualização automática (saldo/status), incluir `webServiceURL` no `pass.json` e implementar PassKit Web Service
- MIME type correto: `application/vnd.apple.pkpass`
- Content-Disposition: `inline` (não `attachment`)

## Exemplo de Implementação (Referência)

### Backend - Endpoint que entrega .pkpass

```typescript
// app/api/passes/[id]/route.ts
import { NextRequest } from "next/server";

async function getPkpassBuffer(passId: string): Promise<Buffer> {
  // Gerar/buscar o .pkpass
  // return await fs.readFile(`/passes/${passId}.pkpass`);
  throw new Error("implemente a geração/lookup do .pkpass");
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const buf = await getPkpassBuffer(params.id);
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `inline; filename="${params.id}.pkpass"`,
      "Cache-Control": "no-store",
    },
  });
}
```

### Frontend - Badge oficial

```jsx
export default function AddToWallet({ passId = "123" }) {
  const href = `/api/passes/${passId}`; // retorna o .pkpass

  return (
    <a href={href} aria-label="Adicionar à Apple Wallet">
      <img
        src="/apple-wallet/add-to-apple-wallet.svg"
        alt="Add to Apple Wallet"
        height={44}
      />
    </a>
  );
}
```

## Issues Atuais

1. **Backend vs Frontend**: Verificar onde está sendo tratada a geração do .pkpass
2. **Domínio**: Atualizar URLs no `pass.json` de `sgbv2.vercel.app` para `zykor.com.br`
3. **Badge Oficial**: Implementar o badge correto da Apple em vez de botão customizado

## TODO

- [ ] Verificar implementação atual (backend vs frontend)
- [ ] Corrigir URLs no pass.json
- [ ] Implementar badge oficial da Apple
- [ ] Testar fluxo completo no iPhone
