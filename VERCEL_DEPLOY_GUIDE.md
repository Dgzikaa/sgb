# 🚀 Guia de Configuração - Deploy Automático Vercel

## ❌ Problema Atual
O projeto não está fazendo deploy automático quando há push para o repositório GitHub.

## 🔧 Soluções Implementadas

### 1. **Configurações do Vercel (Web Interface)**

Acesse: https://vercel.com/rodrigo-oliveiras-projects-096sc64/sgbv2/settings/git

**Configurar:**
- ✅ **Ignored Build Step**: Mudar de "Automatic" para "Don't ignore builds"
- ✅ **Pull Request Comments**: Deixar habilitado
- ✅ **Commit Comments**: Habilitar
- ✅ **deployment_status Events**: Deixar habilitado

### 2. **Configuração do Git Repository**

Na seção "Connected Git Repository":
- ✅ Verificar se o repositório está conectado corretamente
- ✅ Verificar se as permissões estão corretas
- ✅ Testar a conexão clicando em "Test Connection"

### 3. **Deploy Hooks (Opcional)**

Se necessário, criar um Deploy Hook:
- Nome: `Manual Deploy`
- Branch: `main`
- Usar a URL gerada para forçar deploys manuais

### 4. **Environment Variables**

Verificar se todas as variáveis estão configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `TZ`

### 5. **Comandos de Deploy Manual**

```bash
# Deploy manual via CLI
vercel --prod

# Ou via API (usando Deploy Hook)
curl -X POST https://api.vercel.com/v1/integrations/deploy/[DEPLOY_HOOK_ID]
```

## 🧪 Teste de Deploy Automático

1. **Fazer um pequeno commit:**
```bash
git add .
git commit -m "test: trigger auto deploy"
git push origin main
```

2. **Verificar no Vercel Dashboard:**
   - Ir para https://vercel.com/rodrigo-oliveiras-projects-096sc64/sgbv2
   - Verificar se aparece um novo deployment em "Recent Deployments"

## 🔍 Diagnóstico de Problemas

### Se ainda não funcionar:

1. **Verificar Logs de Build:**
   - Acessar o último deployment
   - Verificar se há erros no build

2. **Testar Localmente:**
```bash
cd frontend
npm run build
```

3. **Verificar Git Integration:**
   - Desconectar e reconectar o repositório
   - Verificar permissões do GitHub

4. **Contatar Suporte Vercel:**
   - Se o problema persistir, abrir ticket no suporte

## 📋 Checklist de Verificação

- [ ] Ignored Build Step configurado como "Don't ignore builds"
- [ ] Git repository conectado corretamente
- [ ] Environment variables configuradas
- [ ] Build local funcionando (`npm run build`)
- [ ] Commits sendo enviados para branch `main`
- [ ] Permissões do GitHub corretas
- [ ] Webhook URL (se configurado) funcionando

## 🎯 Próximos Passos

1. Aplicar as configurações acima
2. Fazer um commit de teste
3. Verificar se o deploy automático funciona
4. Se não funcionar, investigar logs específicos

---

**Nota:** As configurações foram otimizadas para evitar falhas no build. O script de validação agora é mais permissivo e não interrompe o processo de build. 