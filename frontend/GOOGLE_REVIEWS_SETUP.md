# 🌟 Google Reviews Integration - Guia de Configuração

Este guia explica como configurar e usar a integração com Google Places API para obter avaliações e dados do Google para o seu bar.

## 📋 Pré-requisitos

### 1. Google Cloud Console
- Conta Google ativa
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)
- Projeto no Google Cloud ou criar um novo

### 2. Habilitar APIs Necessárias
No Google Cloud Console, habilite as seguintes APIs:
- **Google Places API (New)**
- **Places API (Legacy)** (para compatibilidade)
- **Maps JavaScript API** (opcional, para mapas)

## 🔑 Configuração da API Key

### Passo 1: Criar API Key
1. No Google Cloud Console, vá para **APIs & Services > Credentials**
2. Clique em **Create Credentials > API Key**
3. Copie a chave gerada

### Passo 2: Configurar Restrições (Recomendado)
1. Clique na API key criada
2. Em **Application restrictions**:
   - Selecione **HTTP referrers (web sites)**
   - Adicione seus domínios: `localhost:3000`, `seu-dominio.com`
3. Em **API restrictions**:
   - Selecione **Restrict key**
   - Marque: **Places API (New)** e **Places API**

### Passo 3: Adicionar ao Projeto
Crie um arquivo `.env.local` na raiz do projeto frontend:

```bash
# Google Places API Configuration
GOOGLE_PLACES_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=sua_api_key_aqui
```

## 🏪 Configuração dos Estabelecimentos

### Encontrar Place ID
Para obter melhores resultados, você pode encontrar o Place ID do seu bar:

1. **Use a ferramenta oficial**:
   - Acesse: [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   
2. **Ou busque manualmente**:
   - Acesse o [Google Maps](https://maps.google.com)
   - Procure pelo seu bar
   - Na URL aparecerá algo como: `...place/Nome+do+Bar/data=...!1s0x...!8m2!3d...!4d...`
   - O Place ID estará nos parâmetros da URL

### Configurar no Dashboard
Após obter o Place ID, você pode configurá-lo de duas formas:

#### Opção 1: Via Código (Temporário)
Edite o arquivo `frontend/src/app/dashboard/page.tsx`:
```typescript
const result = await googleReviewsClient.getBusinessReviews({
  businessName: selectedBar.nome,
  placeId: 'ChIJ...' // Seu Place ID aqui
})
```

#### Opção 2: Via Banco de Dados (Recomendado)
Adicione uma coluna `google_place_id` na tabela `bares`:
```sql
ALTER TABLE bares ADD COLUMN google_place_id TEXT;
UPDATE bares SET google_place_id = 'ChIJ...' WHERE id = 1;
```

## 🎯 Como Funciona

### Busca Automática
Se não fornecer Place ID, a API tentará encontrar automaticamente baseado em:
- Nome do estabelecimento
- Endereço (se fornecido)

### Dados Obtidos
A integração retorna:
- **Rating médio** (1-5 estrelas)
- **Número total de avaliações**
- **Reviews recentes** (até 5)
- **Fotos do estabelecimento**
- **Informações básicas** (nome, endereço, telefone)

### Limitações
- **Quota diária**: Varie de acordo com o plano (gratuito = ~100 requests/dia)
- **Rate limiting**: Máximo 10 requests por segundo
- **Cache**: Reviews são mantidos em cache para evitar muitas chamadas

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. "API key not valid"
- Verifique se a API key está correta no `.env.local`
- Confirme se as APIs estão habilitadas no Google Cloud
- Verifique as restrições da API key

#### 2. "This API project is not authorized"
- Habilite a Places API (New) no Google Cloud Console
- Aguarde alguns minutos para propagação

#### 3. "ZERO_RESULTS"
- Tente nomes mais específicos ou simplificados
- Use o Place ID diretamente se disponível
- Verifique se o estabelecimento existe no Google Maps

#### 4. "OVER_QUERY_LIMIT"
- Você excedeu a quota diária gratuita
- Considere upgrade para plano pago
- Implemente cache mais agressivo

### Verificar Configuração
Execute no console do navegador:
```javascript
console.log('Google API Key:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)
```

## 💰 Custos

### Plano Gratuito
- **$200 em créditos** mensais gratuitos
- **Places API**: $17/1000 requests
- **Estimativa**: ~11.000 requests gratuitos/mês

### Otimização de Custos
- Use cache para evitar requests repetidos
- Implemente rate limiting
- Busque por Place ID em vez de texto (mais barato)

## 🚀 Próximos Passos

### Melhorias Possíveis
1. **Histórico de ratings** - Acompanhar mudanças ao longo do tempo
2. **Alertas** - Notificações para novas avaliações
3. **Análise de sentimento** - Classificar reviews positivos/negativos
4. **Resposta automática** - Templates para responder reviews
5. **Comparação com concorrentes** - Benchmarking de ratings

### Integrações Futuras
- **Google My Business API** - Para gerenciar respostas
- **Google Analytics** - Para correlacionar reviews com vendas
- **WhatsApp Business** - Para solicitar reviews após atendimento

## 📞 Suporte

Se encontrar problemas:
1. Verifique este guia primeiro
2. Consulte a [documentação oficial](https://developers.google.com/maps/documentation/places/web-service/overview)
3. Entre em contato com o desenvolvedor

---

✅ **Status**: Implementação concluída  
🔄 **Última atualização**: $(date)  
📋 **Próximo**: Configurar Place IDs para cada bar 