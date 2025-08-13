# Script para processar todos os batches NIBO pendentes
$url = "https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/nibo-orchestrator-v2"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Lista de batches pendentes
$batches = @(
    @{id="af70dbf7-ec19-4e3d-8695-8b3ab2f1c234"; records=201},
    @{id="adfb891f-3ce7-4642-bba7-03950f099ade"; records=201},
    @{id="cf64a8db-cea9-45d7-9cf4-4f82165a2964"; records=657},
    @{id="faed5693-03d8-45df-995b-12187fc74aa5"; records=656},
    @{id="0b9bd441-ac91-467a-ac59-28be8c71cae1"; records=646},
    @{id="4ebf9f15-59ac-4801-a9e2-cdc9bca1c22f"; records=646}
)

$totalBatches = $batches.Count
$currentBatch = 0
$totalProcessed = 0
$totalErrors = 0

Write-Host "`n🚀 PROCESSAMENTO EM MASSA - NIBO" -ForegroundColor Cyan
Write-Host "📊 Total de batches pendentes: $totalBatches" -ForegroundColor Yellow
Write-Host "📋 Total de agendamentos: $($batches | ForEach-Object { $_.records } | Measure-Object -Sum).Sum" -ForegroundColor Yellow
Write-Host ""

foreach ($batch in $batches) {
    $currentBatch++
    Write-Host "[$currentBatch/$totalBatches] Processando batch: $($batch.id)" -ForegroundColor Cyan
    Write-Host "   📊 Agendamentos no batch: $($batch.records)" -ForegroundColor Gray
    
    $body = @{
        batch_id = $batch.id
        batch_size = 20
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Host "   ✅ Sucesso! Processados: $($response.processed_count), Inseridos: $($response.inserted_count)" -ForegroundColor Green
            $totalProcessed += $response.processed_count
            $totalErrors += $response.error_count
        } else {
            Write-Host "   ❌ Erro: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Erro na requisição: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Pequena pausa entre batches
    if ($currentBatch -lt $totalBatches) {
        Start-Sleep -Seconds 2
    }
}

Write-Host "🎯 RESUMO FINAL" -ForegroundColor Cyan
Write-Host "✅ Total processado: $totalProcessed agendamentos" -ForegroundColor Green
Write-Host "❌ Total de erros: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "📌 Verifique o Discord para notificações detalhadas!" -ForegroundColor Yellow
