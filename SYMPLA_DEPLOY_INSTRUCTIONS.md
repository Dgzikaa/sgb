# 🎪 Instruções de Deploy - Sympla Sync

## ✅ O que foi feito:

1. ✅ **Edge Function criada**: `backend/supabase/functions/sympla-sync/index.ts`
2. ✅ **Cron job configurado**: `backend/supabase/config.toml` (toda segunda às 09:00)
3. ✅ **Script retroativo criado**: `exemplo_teste/sympla/sync-retroativo-setembro-novembro.js`
4. ✅ **API route atualizada**: `frontend/src/app/api/integracoes/sympla/route.ts`
5. ✅ **Documentação completa**: `docs/SYMPLA_SYNC_SETUP.md`

---

## 🚀 Passos para Ativar o Sistema:

### 1. Deploy da Edge Function (OBRIGATÓRIO)

```powershell
# Na pasta raiz do projeto
cd backend
npx supabase login
npx supabase functions deploy sympla-sync --project-ref uqtgsvujwcbymjmvkjhy
```

**Importante**: Certifique-se de que o secret `SYMPLA_API_TOKEN` está configurado no Supabase Dashboard:
- Acesse: https://supabase.com/dashboard/project/uqtgsvujwcbymjmvkjhy/settings/functions
- Vá em "Edge Functions" > "Secrets"
- Adicione: `SYMPLA_API_TOKEN = 97d7b77e99d40dc8fb5583f590f9b7db3072afe7969c167c493077d9c5a862a6`

### 2. Buscar Dados Retroativos (29/09 até 10/11)

```powershell
# Instalar dependências (se ainda não tiver)
npm install @supabase/supabase-js dotenv

# Rodar script retroativo
node exemplo_teste/sympla/sync-retroativo-setembro-novembro.js
```

Este script vai:
- Buscar todos os eventos do Ordi de 29/09/2025 até 10/11/2025
- Coletar participantes e pedidos de cada evento
- Inserir tudo no banco de dados
- Mostrar estatísticas completas

**Tempo estimado**: 2-5 minutos dependendo do número de eventos

### 3. Validar Funcionamento

Após rodar o script, verificar no banco:

```sql
-- Total de eventos (deve ter mais que 14)
SELECT COUNT(*) FROM sympla_eventos;

-- Última data (deve ser 10/11/2025 ou próximo)
SELECT MAX(data_inicio::date) as ultima_data FROM sympla_eventos;

-- Ver eventos recentes
SELECT 
  data_inicio::date as data,
  nome_evento,
  (SELECT COUNT(*) FROM sympla_participantes WHERE evento_sympla_id = sympla_eventos.evento_sympla_id) as participantes,
  (SELECT COUNT(*) FROM sympla_pedidos WHERE evento_sympla_id = sympla_eventos.evento_sympla_id) as pedidos
FROM sympla_eventos
WHERE data_inicio >= '2025-09-29'
ORDER BY data_inicio DESC;
```

---

## 📅 Cronograma Automático

A partir de agora, **toda segunda-feira às 09:00**:
- Sistema busca automaticamente dados da semana anterior (seg-dom)
- Exemplo: Na segunda dia 17/11/2025, busca dados de 10/11 a 16/11

**Você não precisa fazer nada!** É automático. 🎉

---

## 🧪 Testar Manualmente (Opcional)

Para testar se a Edge Function está funcionando:

```bash
# Via curl (substitua o token)
curl -X POST \
  'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sympla-sync' \
  -H 'Authorization: Bearer SEU_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "filtro_eventos": "ordi",
    "data_inicio": "2025-11-03",
    "data_fim": "2025-11-09"
  }'
```

Ou via API do frontend (precisa estar logado como admin):

```typescript
const response = await fetch('/api/integracoes/sympla', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventoId: 'test',
    tipo: 'completo'
  })
});
```

---

## 📊 Monitoramento

### Ver logs da Edge Function:
```bash
npx supabase functions logs sympla-sync --project-ref uqtgsvujwcbymjmvkjhy
```

### Verificar próxima execução do cron:
- O cron job só funciona em produção (Supabase Cloud)
- Próxima execução: Segunda-feira 17/11/2025 às 09:00

---

## ⚠️ Checklist Final

- [ ] Deploy da Edge Function feito
- [ ] Secret `SYMPLA_API_TOKEN` configurado no Supabase
- [ ] Script retroativo executado com sucesso
- [ ] Dados verificados no banco (> 14 eventos, última data atual)
- [ ] Documentação lida (`docs/SYMPLA_SYNC_SETUP.md`)

---

## 🎯 Resultado Esperado

Após executar todos os passos:

- ✅ Dados de 29/09/2025 até 10/11/2025 no banco
- ✅ Edge Function ativa e funcional
- ✅ Cron job configurado para rodar toda segunda
- ✅ Sistema 100% automático a partir de agora

---

**Qualquer dúvida, consulte**: `docs/SYMPLA_SYNC_SETUP.md`

**Boa sorte! 🚀**

