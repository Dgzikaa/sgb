# Deploy Rápido no Netlify

## Por que Netlify?
- Domínios `.netlify.app` são mais aceitos por serviços OAuth
- Deploy instantâneo
- URL fixa garantida

## Passos:

### 1. Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Build do projeto
```bash
cd frontend
npm run build
```

### 3. Deploy
```bash
netlify deploy --prod --dir=.next
```

### 4. Primeira vez:
- Vai abrir o navegador para login
- Escolha "Create & configure a new site"
- Nome do site: `sgb-sistema` (ou outro disponível)

### 5. URL Final
Sua URL será: `https://sgb-sistema.netlify.app`

### 6. Configurar no Conta Azul
Use como Redirect URI:
```
https://sgb-sistema.netlify.app/contaazul-callback
```

## Alternativa: Deploy via GitHub
1. Conecte seu GitHub no Netlify
2. Escolha o repositório
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Deploy automático a cada push! 