#!/usr/bin/env pwsh

Write-Host "INVESTIGANDO CAMPOS NAO DOCUMENTADOS - RATEIO" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Configuracoes
$baseUrl = "http://localhost:3001"
$endpoint = "/api/contaazul/investigar-rateio-nao-documentado"
$fullUrl = $baseUrl + $endpoint

Write-Host "Testando API: $fullUrl" -ForegroundColor Yellow

try {
    # Fazer requisicao GET
    $response = Invoke-RestMethod -Uri $fullUrl -Method GET -ContentType "application/json"
    
    Write-Host "API Response Status: OK" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar informacoes da investigacao
    Write-Host "INVESTIGACAO: $($response.investigacao)" -ForegroundColor Cyan
    Write-Host ""
    
    # Mostrar problema identificado
    Write-Host "PROBLEMA IDENTIFICADO:" -ForegroundColor Red
    Write-Host "   - $($response.documentacao_inconsistencia.problema)" -ForegroundColor Red
    Write-Host "   - Criacao: $($response.documentacao_inconsistencia.eventofin_request)" -ForegroundColor Yellow
    Write-Host "   - Recuperacao: $($response.documentacao_inconsistencia.parcela_response)" -ForegroundColor Yellow
    Write-Host ""
    
    # Mostrar resultados
    Write-Host "RESULTADOS DA INVESTIGACAO:" -ForegroundColor Cyan
    Write-Host "   Total de parcelas testadas: $($response.total_testado)" -ForegroundColor White
    Write-Host ""
    
    foreach ($resultado in $response.resultados) {
        Write-Host "   Parcela ID: $($resultado.id_parcela)" -ForegroundColor White
        
        if ($resultado.erro) {
            Write-Host "      Erro: $($resultado.erro)" -ForegroundColor Red
        } else {
            Write-Host "      Status: $($resultado.status)" -ForegroundColor Green
            Write-Host "      Tem rateio: $($resultado.tem_rateio)" -ForegroundColor $(if ($resultado.tem_rateio) { "Green" } else { "Red" })
            Write-Host "      Tem evento.rateio: $($resultado.tem_evento_rateio)" -ForegroundColor $(if ($resultado.tem_evento_rateio) { "Green" } else { "Red" })
            Write-Host "      Tem categorias: $($resultado.tem_categorias)" -ForegroundColor $(if ($resultado.tem_categorias) { "Green" } else { "Red" })
            Write-Host "      Tem centros_custo: $($resultado.tem_centros_custo)" -ForegroundColor $(if ($resultado.tem_centros_custo) { "Green" } else { "Red" })
            Write-Host "      Campos primeiro nivel: $($resultado.campos_primeiro_nivel -join ', ')" -ForegroundColor Cyan
            Write-Host "      Campos evento: $($resultado.campos_evento -join ', ')" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "      ESTRUTURA COMPLETA:" -ForegroundColor Yellow
            Write-Host "$($resultado.estrutura_completa)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "CONCLUSAO:" -ForegroundColor Green
    
    # Verificar se alguma parcela tem rateio
    $temRateio = $response.resultados | Where-Object { $_.tem_rateio -eq $true }
    $temEventoRateio = $response.resultados | Where-Object { $_.tem_evento_rateio -eq $true }
    $temCategorias = $response.resultados | Where-Object { $_.tem_categorias -eq $true }
    $temCentros = $response.resultados | Where-Object { $_.tem_centros_custo -eq $true }
    
    if ($temRateio.Count -gt 0) {
        Write-Host "   CAMPO RATEIO ENCONTRADO! A documentacao esta incompleta." -ForegroundColor Green
    } elseif ($temEventoRateio.Count -gt 0) {
        Write-Host "   CAMPO EVENTO.RATEIO ENCONTRADO! A documentacao esta incompleta." -ForegroundColor Green
    } elseif ($temCategorias.Count -gt 0 -or $temCentros.Count -gt 0) {
        Write-Host "   CAMPOS RELACIONADOS ENCONTRADOS! Verificar estrutura." -ForegroundColor Green
    } else {
        Write-Host "   NENHUM CAMPO DE RATEIO ENCONTRADO na resposta da API." -ForegroundColor Red
        Write-Host "   Isso indica que:" -ForegroundColor Yellow
        Write-Host "      - A API realmente nao retorna dados de rateio" -ForegroundColor Yellow
        Write-Host "      - Pode haver endpoint especifico para rateio" -ForegroundColor Yellow
        Write-Host "      - Ou as transacoes testadas nao tem rateio" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Erro na requisicao: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Razao: $($_.Exception.Response.ReasonPhrase)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Investigacao concluida!" -ForegroundColor Green 