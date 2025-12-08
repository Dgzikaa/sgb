# Script de Sincronização Retroativa - Deboche Bar (bar_id=4)
# Período: 03/10/2024 até 08/12/2025

$BaseUrl = "https://zykor.com.br"
$BarId = 4
$StartDate = "2024-10-03"
$EndDate = "2025-12-08"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SINCRONIZAÇÃO RETROATIVA - DEBOCHE BAR" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bar ID: $BarId (Deboche)" -ForegroundColor Yellow
Write-Host "Período: $StartDate até $EndDate" -ForegroundColor Yellow
Write-Host ""

# Dividir em períodos de 1 mês para evitar timeout
$CurrentStart = [DateTime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
$FinalEnd = [DateTime]::ParseExact($EndDate, "yyyy-MM-dd", $null)

$TotalSuccess = 0
$TotalErrors = 0
$TotalRecords = 0

while ($CurrentStart -le $FinalEnd) {
    # Calcular fim do período (1 mês ou até o fim)
    $CurrentEnd = $CurrentStart.AddMonths(1).AddDays(-1)
    if ($CurrentEnd -gt $FinalEnd) {
        $CurrentEnd = $FinalEnd
    }
    
    $StartStr = $CurrentStart.ToString("yyyy-MM-dd")
    $EndStr = $CurrentEnd.ToString("yyyy-MM-dd")
    
    Write-Host ""
    Write-Host ">> Sincronizando período: $StartStr até $EndStr" -ForegroundColor Green
    
    $Body = @{
        start_date = $StartStr
        end_date = $EndStr
        bar_id = $BarId
    } | ConvertTo-Json
    
    try {
        $Response = Invoke-RestMethod -Uri "$BaseUrl/api/contahub/sync-retroativo-real" `
            -Method POST `
            -ContentType "application/json" `
            -Body $Body `
            -TimeoutSec 600
        
        if ($Response.success) {
            $TotalSuccess += $Response.summary.success_count
            $TotalErrors += $Response.summary.error_count
            $TotalRecords += $Response.summary.total_records_collected
            
            Write-Host "   ✅ Sucesso: $($Response.summary.success_count) dias" -ForegroundColor Green
            Write-Host "   📊 Registros: $($Response.summary.total_records_collected)" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ Erro: $($Response.error)" -ForegroundColor Red
            $TotalErrors += 1
        }
    }
    catch {
        Write-Host "   ❌ Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
        $TotalErrors += 1
    }
    
    # Próximo período
    $CurrentStart = $CurrentEnd.AddDays(1)
    
    # Pequena pausa entre períodos
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " RESUMO FINAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Total de dias sincronizados: $TotalSuccess" -ForegroundColor Green
Write-Host "❌ Total de erros: $TotalErrors" -ForegroundColor Red
Write-Host "📊 Total de registros coletados: $TotalRecords" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sincronização concluída!" -ForegroundColor Yellow
