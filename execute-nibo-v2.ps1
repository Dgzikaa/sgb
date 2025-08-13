$url = "https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/nibo-orchestrator-v2"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    batch_id = "5bf38415-bc4e-4c9c-bf89-1ce9bb20368e"
    batch_size = 20
} | ConvertTo-Json

Write-Host "`n🚀 Executando processamento NIBO V2 (Otimizado)..." -ForegroundColor Cyan
Write-Host "📋 Batch ID: 5bf38415-bc4e-4c9c-bf89-1ce9bb20368e" -ForegroundColor Yellow
Write-Host "📊 Total de agendamentos: 232" -ForegroundColor Yellow
Write-Host "🔧 Batch size: 20 (processamento em partes)" -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Processamento iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resultado:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "📊 Processados: $($response.processed_count) agendamentos" -ForegroundColor Yellow
        Write-Host "💾 Inseridos: $($response.inserted_count) registros" -ForegroundColor Yellow
        Write-Host "❌ Erros: $($response.error_count)" -ForegroundColor $(if ($response.error_count -gt 0) { "Red" } else { "Green" })
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📌 Verifique o Discord para notificações!" -ForegroundColor Cyan
