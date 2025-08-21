# Getin Sync Continuous - Edge Function

Esta Edge Function sincroniza automaticamente as reservas do Getin de forma contínua, rodando de 4 em 4 horas.

## 🎯 Funcionalidade

- **Período**: (hoje - 1 dia) até (hoje + 60 dias)
- **Frequência**: A cada 4 horas
- **Limpeza**: Remove reservas antigas (anteriores a anteontem)
- **Upsert**: Atualiza reservas existentes e insere novas

## 📅 Lógica de Datas

```
Hoje: 21/08/2025
├── Data Início: 20/08/2025 (hoje - 1)  ← Captura cancelamentos
├── Data Fim: 20/10/2025 (hoje + 60)    ← Reservas futuras
└── Limpeza: < 19/08/2025 (hoje - 2)    ← Remove antigas
```

## 🚀 Deploy

```bash
# Deploy da função
supabase functions deploy getin-sync-continuous

# Testar localmente
supabase functions serve getin-sync-continuous

# Testar via HTTP
curl -X POST https://your-project.supabase.co/functions/v1/getin-sync-continuous
```

## ⏰ Automação com Cron

Para rodar automaticamente de 4 em 4 horas, configure um cron job ou use um serviço como:

### 1. Cron Job (Linux/Mac)
```bash
# Editar crontab
crontab -e

# Adicionar linha (roda a cada 4 horas)
0 */4 * * * curl -X POST https://your-project.supabase.co/functions/v1/getin-sync-continuous
```

### 2. GitHub Actions
```yaml
name: Getin Sync
on:
  schedule:
    - cron: '0 */4 * * *'  # A cada 4 horas
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Getin Sync
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }}/getin-sync-continuous
```

### 3. Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/trigger-getin-sync",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## 📊 Logs e Monitoramento

A função registra logs detalhados:

```
🚀 Iniciando sincronização contínua GET IN
✅ Credenciais encontradas
📅 Período: 2025-08-20 a 2025-10-20
🧹 Limpeza concluída
📡 Buscando reservas (página 1)
✅ 50 reservas encontradas
📊 Processando reservas...
✅ ABC123 - João Silva (2025-08-21)
🎉 SINCRONIZAÇÃO CONCLUÍDA
```

## 🔧 Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 Tabelas Necessárias

- `credenciais_apis` - Credenciais do Getin
- `getin_reservations` - Reservas sincronizadas
- `sync_logs` - Logs de sincronização (opcional)

## 🎯 Benefícios

1. **Dados Atualizados**: Sempre sincronizado com cancelamentos
2. **Performance**: Processa apenas período relevante (61 dias)
3. **Limpeza Automática**: Remove dados antigos automaticamente
4. **Resiliente**: Trata erros e continua processamento
5. **Monitorável**: Logs detalhados para debugging
