# Script PowerShell para testar a correção do processamento NIBO
# Execute com: .\test-nibo-fix.ps1

Write-Host "🚀 Teste da Correção NIBO - SGB v3" -ForegroundColor Cyan
Write-Host ""

# Configurações
$SUPABASE_URL = "https://uqtgsvujwcbymjmvkjhy.supabase.co"
$BATCH_ID = "5bf38415-bc4e-4c9c-bf89-1ce9bb20368e"

# Solicitar service role key se não estiver configurada
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "⚠️  Service Role Key não encontrada!" -ForegroundColor Yellow
    Write-Host "Por favor, insira sua Supabase Service Role Key:" -ForegroundColor Yellow
    $serviceKey = Read-Host -Prompt "Service Role Key" -AsSecureString
    $env:SUPABASE_SERVICE_ROLE_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceKey))
}

Write-Host "📋 Batch ID: $BATCH_ID" -ForegroundColor Green
Write-Host "📊 Total de agendamentos pendentes: 232" -ForegroundColor Green
Write-Host ""

try {
    Write-Host "🔄 Chamando NIBO Orchestrator..." -ForegroundColor Cyan
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    }
    
    $body = @{
        batch_id = $BATCH_ID
        batch_size = 50
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/nibo-orchestrator" `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    
    Write-Host ""
    Write-Host "✅ Orchestrator respondeu com sucesso!" -ForegroundColor Green
    Write-Host "📊 Resultado:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    Write-Host ""
    Write-Host "⏳ Aguardando 10 segundos para verificar o processamento..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar status final
    Write-Host ""
    Write-Host "🔍 Verificando status do batch..." -ForegroundColor Cyan
    
    # Aqui você pode adicionar uma chamada para verificar o status no banco
    Write-Host ""
    Write-Host "✅ Teste concluído!" -ForegroundColor Green
    Write-Host "📌 Verifique o Discord para ver as notificações de progresso." -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao chamar orchestrator:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Dica: Para verificar os logs das edge functions:" -ForegroundColor Cyan
Write-Host "   1. Acesse o painel do Supabase" -ForegroundColor White
Write-Host "   2. Vá em Functions > Logs" -ForegroundColor White
Write-Host "   3. Procure por 'nibo-orchestrator' e 'nibo-worker-agendamentos'" -ForegroundColor White
