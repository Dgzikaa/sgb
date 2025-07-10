# 📱 **Guia Completo de Configuração WhatsApp**

## 🎯 **Visão Geral**

Este guia te ensina como configurar a integração WhatsApp completa no SGB_V2 com **4 provedores diferentes**, **lembretes automáticos** e **compartilhamento de checklists**.

### **✨ Funcionalidades Implementadas:**
- 📱 **4 Provedores** (Evolution API, Twilio, WhatsApp Business, Baileys)
- 🔔 **Lembretes Automáticos** baseados em agendamentos
- 🚨 **Alertas de Atraso** em tempo real
- ✅ **Confirmações de Conclusão** automáticas
- 📤 **Compartilhamento de Checklists** via WhatsApp
- 🧪 **Sistema de Testes** completo

---

## 🚀 **Opção 1: Evolution API (RECOMENDADO)**

### **✅ Vantagens:**
- ✅ **Gratuito** para uso básico
- ✅ **Setup rápido** (~10 minutos)
- ✅ **QR Code automático** para conexão
- ✅ **Webhook incluído** para confirmações
- ✅ **Multi-instância** gratuito

### **📋 Passo a Passo:**

#### **1. Criar Conta na Evolution API**
1. Acesse: https://evolution-api.com
2. Faça cadastro gratuito
3. Confirme email

#### **2. Configurar Instância**
1. Acesse o painel da Evolution
2. Clique em "Criar Instância"
3. Nomeie sua instância (ex: `sgb-checklists`)
4. Aguarde criação (~2 minutos)

#### **3. Obter Credenciais**
```
URL da API: https://evolution-api.com/instance/sgb-checklists
API Key: sua-api-key-gerada-automaticamente
Instance ID: sgb-checklists
```

#### **4. Conectar WhatsApp**
1. Na Evolution, vá em "Conectar WhatsApp"
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde confirmação de conexão

#### **5. Configurar no SGB**
1. Acesse `/configuracoes/whatsapp`
2. Selecione "Evolution API"
3. Preencha os dados:
   - **URL da API**: `https://evolution-api.com`
   - **API Key**: Sua chave da Evolution
   - **Instance ID**: `sgb-checklists`
4. Clique em "Salvar"

#### **6. Testar Conexão**
1. Na aba "Testes", digite seu número
2. Clique em "Teste de Conexão"
3. Deve receber uma mensagem no WhatsApp

---

## 📞 **Opção 2: Twilio (PAGO MAS CONFIÁVEL)**

### **✅ Vantagens:**
- ✅ **Altamente confiável** (99.9% uptime)
- ✅ **Suporte 24/7** oficial
- ✅ **Analytics avançado** incluído
- ✅ **Templates aprovados** pela Meta

### **💰 Custos:**
- **Setup**: Gratuito
- **Mensagens**: ~$0.005 por mensagem
- **Número WhatsApp**: ~$15/mês

### **📋 Passo a Passo:**

#### **1. Criar Conta Twilio**
1. Acesse: https://www.twilio.com
2. Crie conta gratuita
3. Confirme telefone/email

#### **2. Configurar WhatsApp**
1. No painel Twilio, vá em "Messaging"
2. Clique em "Try it out" > "Send a WhatsApp message"
3. Siga o processo de aprovação (pode levar 1-2 dias)

#### **3. Obter Credenciais**
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
WhatsApp Number: whatsapp:+14155238886
```

#### **4. Configurar no SGB**
1. Acesse `/configuracoes/whatsapp`
2. Selecione "Twilio"
3. Preencha os dados da Twilio
4. Teste a conexão

---

## ✅ **Opção 3: WhatsApp Business API (OFICIAL)**

### **✅ Vantagens:**
- ✅ **API oficial** da Meta
- ✅ **Templates aprovados** oficialmente
- ✅ **Recursos business** completos
- ✅ **Integração Meta** total

### **⚠️ Considerações:**
- ⚠️ **Aprovação necessária** (2-7 dias)
- ⚠️ **Processo complexo** de setup
- ⚠️ **Custos elevados** para volume alto

### **📋 Passo a Passo:**

#### **1. Criar Business Account**
1. Acesse: https://business.facebook.com
2. Crie/configure Business Account
3. Adicione WhatsApp Business

#### **2. Solicitar Aprovação**
1. Preencha formulário Meta
2. Aguarde aprovação (2-7 dias)
3. Receba credenciais

#### **3. Configurar no SGB**
1. Use as credenciais Meta
2. Configure templates aprovados
3. Teste com cuidado (limitações)

---

## 🔧 **Opção 4: Baileys (SELF-HOSTED)**

### **✅ Vantagens:**
- ✅ **Completamente gratuito**
- ✅ **Código aberto** (customizável)
- ✅ **Sem limites** de mensagens
- ✅ **Controle total** dos dados

### **⚠️ Considerações:**
- ⚠️ **Requer servidor próprio**
- ⚠️ **Setup técnico** complexo
- ⚠️ **Menos estável** que soluções pagas

### **📋 Passo a Passo:**

#### **1. Instalar Baileys**
```bash
# Clone o repositório
git clone https://github.com/WhiskeySockets/Baileys.git
cd Baileys

# Instalar dependências
npm install

# Iniciar servidor
npm start
```

#### **2. Configurar no SGB**
1. Use URL do seu servidor
2. Configure autenticação se necessário
3. Teste conexão

---

## 🔧 **Configuração no Banco de Dados**

### **1. Executar Script SQL**
1. Abra o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o script `docs/whatsapp-database-schema.sql`
4. Execute

### **2. Verificar Tabelas Criadas**
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'whatsapp%';

-- Deve retornar:
-- whatsapp_configs
-- whatsapp_messages
-- whatsapp_reminders
-- whatsapp_alerts
```

---

## 📱 **Testando a Integração**

### **1. Acesse a Página de Testes**
```
https://seudominio.com/configuracoes/whatsapp
```

### **2. Configure um Provedor**
1. Aba "Configuração" > Selecione provedor
2. Preencha credenciais
3. Ative integração
4. Salve configurações

### **3. Execute Testes**
1. Aba "Testes" > Digite seu número
2. Teste todos os tipos de mensagem:
   - ✅ Mensagem simples
   - 🔔 Lembrete de checklist
   - 🚨 Alerta de atraso
   - ✅ Confirmação de conclusão
   - 📤 Compartilhamento

### **4. Verifique Resultados**
- Todas as mensagens devem chegar no WhatsApp
- Formatos devem estar corretos
- Emojis devem aparecer normalmente

---

## 🔄 **Configuração de Lembretes Automáticos**

### **1. Configurar Horários**
```javascript
// Exemplo: Lembrete 2 horas antes
const reminderTime = new Date(checklistScheduledTime)
reminderTime.setHours(reminderTime.getHours() - 2)

// Criar lembrete
await createWhatsAppReminder(
  userId,
  checklistId,
  phoneNumber,
  reminderTime,
  checklistData
)
```

### **2. Configurar Alertas de Atraso**
```javascript
// Exemplo: Alerta após 30 minutos de atraso
const alertTime = new Date(checklistScheduledTime)
alertTime.setMinutes(alertTime.getMinutes() + 30)

// Criar alerta
await createWhatsAppAlert(
  userId,
  checklistId,
  checklistScheduledTime,
  30, // 30 minutos de atraso
  [phoneNumber],
  'medium'
)
```

---

## 🎯 **Casos de Uso Práticos**

### **1. Lembrete de Abertura**
```
🔔 Lembrete SGB

Olá João! Você tem um checklist pendente:

📋 Checklist de Abertura - Manhã
⏰ Horário: 08:00
📍 Setor: Cozinha
⚡ Prioridade: 🔴 Crítica

Por favor, execute o checklist no horário programado.

Sistema de Gestão de Bares
```

### **2. Alerta de Atraso**
```
🚨 ALERTA - Checklist Atrasado

⚠️ O checklist está atrasado!

📋 Checklist de Abertura - Manhã
👤 Responsável: João Silva
⏰ Era para: 08:00
⏱️ Atraso: 2 horas
🎯 Nível: 🔴 CRÍTICO

Por favor, execute URGENTEMENTE!

Sistema de Gestão de Bares
```

### **3. Compartilhamento de Resultado**
```
📋 Relatório de Checklist

✅ Checklist de Abertura - Manhã
📅 Data: 15/01/2025
👤 Responsável: João Silva
📍 Setor: Cozinha

📊 Resultados:
• ✅ Itens OK: 8
• ❌ Problemas: 2
• 📊 Total: 10
• ⏱️ Tempo: 25min

💬 Observações:
Problema na temperatura do freezer, mas foi corrigido.

Sistema de Gestão de Bares
```

---

## 🔧 **Personalização Avançada**

### **1. Templates Personalizados**
```javascript
import { WhatsAppService } from '@/lib/whatsapp-service'

// Personalizar templates
WhatsAppService.setCustomTemplates({
  reminder: `🏪 SEU RESTAURANTE
  
Olá {FUNCIONARIO}! 
Checklist {CHECKLIST_NOME} agendado para {HORARIO}.

Execute no prazo! 💪`,
  
  alert: `🚨 URGENTE - SEU RESTAURANTE

Checklist {CHECKLIST_NOME} está {TEMPO_ATRASO} atrasado!

Ação imediata necessária! 🔥`
})
```

### **2. Configuração por Usuário**
```javascript
// Configurar lembretes por usuário
const userConfig = {
  send_reminders: true,
  send_alerts: true,
  send_completions: false,
  reminder_hours_before: 4, // 4 horas antes
  alert_repeat_minutes: 15 // Repetir a cada 15 min
}
```

---

## 📊 **Monitoramento e Estatísticas**

### **1. Visualizar Estatísticas**
```sql
-- Estatísticas de mensagens
SELECT * FROM whatsapp_message_stats 
WHERE user_id = 'seu-user-id';

-- Lembretes pendentes
SELECT * FROM whatsapp_pending_reminders 
WHERE user_id = 'seu-user-id';

-- Alertas ativos
SELECT * FROM whatsapp_active_alerts 
WHERE user_id = 'seu-user-id';
```

### **2. Logs de Mensagens**
```sql
-- Ver todas as mensagens enviadas
SELECT 
  to_number,
  message,
  type,
  status,
  sent_at
FROM whatsapp_messages 
WHERE user_id = 'seu-user-id'
ORDER BY sent_at DESC
LIMIT 50;
```

---

## 🛠️ **Troubleshooting**

### **❌ Problemas Comuns**

#### **1. Mensagens não chegam**
```
✅ Verificar:
- Número no formato correto (+5511999999999)
- WhatsApp conectado (Evolution API)
- Credenciais corretas
- Saldo suficiente (Twilio)
```

#### **2. Erro de conexão**
```
✅ Verificar:
- URL da API correta
- API Key válida
- Firewall não bloqueando
- Instância ativa
```

#### **3. Formato de mensagem incorreto**
```
✅ Verificar:
- Templates configurados
- Variáveis substituídas
- Caracteres especiais
- Limite de caracteres
```

### **🔧 Comandos de Debug**

#### **1. Testar Conexão**
```bash
# Teste direto via cURL (Evolution API)
curl -X POST "https://evolution-api.com/message/sendText/sua-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de conexão"
  }'
```

#### **2. Verificar Logs**
```javascript
// No console do navegador
const logs = await fetch('/api/whatsapp/logs').then(r => r.json())
console.log(logs)
```

---

## 🎉 **Próximos Passos**

### **1. Após Configuração**
- ✅ Teste todas as funcionalidades
- ✅ Configure lembretes automáticos
- ✅ Treine a equipe
- ✅ Monitore estatísticas

### **2. Melhorias Futuras**
- 📱 Chatbot para respostas automáticas
- 📊 Dashboard de métricas WhatsApp
- 🔄 Integração com outros sistemas
- 🎯 Segmentação de mensagens

---

## 📞 **Suporte**

### **Dúvidas sobre:**
- **Evolution API**: https://evolution-api.com/support
- **Twilio**: https://support.twilio.com
- **WhatsApp Business**: https://business.whatsapp.com/support
- **Baileys**: https://github.com/WhiskeySockets/Baileys/issues

### **Configuração SGB:**
- Acesse `/configuracoes/whatsapp` para configurações e testes
- Verifique logs em `whatsapp_messages`
- Use a API `/api/whatsapp/send` para envios diretos

---

## ✅ **Checklist de Configuração**

- [ ] Banco de dados configurado (schema aplicado)
- [ ] Provedor WhatsApp escolhido e configurado
- [ ] Número de telefone adicionado
- [ ] Teste de conexão realizado com sucesso
- [ ] Teste de mensagem simples funcionando
- [ ] Teste de lembrete funcionando
- [ ] Teste de alerta funcionando
- [ ] Teste de compartilhamento funcionando
- [ ] Lembretes automáticos configurados
- [ ] Alertas de atraso configurados
- [ ] Equipe treinada para usar

---

**🎯 Pronto! Sua integração WhatsApp está completa e funcional!**

O sistema agora enviará automaticamente:
- 🔔 **Lembretes** antes dos horários dos checklists
- 🚨 **Alertas** quando checklists estiverem atrasados
- ✅ **Confirmações** quando checklists forem concluídos
- 📤 **Compartilhamentos** de resultados via WhatsApp

Tudo **100% automático** e **mobile-friendly**! 📱✨ 