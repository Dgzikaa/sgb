$url = "http://localhost:3001/api/contaazul/debug-primeira-parcela"
$headers = @{
    "Content-Type" = "application/json"
}

# Usar o storage_path da ultima coleta completa
$body = @{
    bar_id = "3"
    storage_path = "contaazul-dados-completos/3/2025-07-10T17-02-00-740Z/"
} | ConvertTo-Json

Write-Host "DEBUG AUTOMATICO - Analisando estrutura REAL da API ContaAzul"
Write-Host "Storage path: contaazul-dados-completos/3/2025-07-10T17-02-00-740Z/"
Write-Host ""

try {
    Write-Host "Buscando primeira parcela dos dados salvos..."
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    
    if ($response.success) {
        Write-Host "`nPARCELA ANALISADA:"
        Write-Host "ID: $($response.parcela_analisada.id)"
        Write-Host "Descricao: $($response.parcela_analisada.descricao)"
        Write-Host "Valor: $($response.parcela_analisada.valor)"
        
        Write-Host "`nANALISE DOS DADOS SALVOS:"
        Write-Host "Campos encontrados: $($response.analise.dados_salvos.campos.Count)"
        Write-Host "Tem detalhes_completos? $($response.analise.dados_salvos.tem_detalhes_completos)"
        Write-Host "Tem rateio? $($response.analise.dados_salvos.tem_rateio)"
        
        if ($response.analise.dados_salvos.rateio_info) {
            Write-Host "Quantidade de rateios: $($response.analise.dados_salvos.rateio_info.quantidade)"
        }
        
        Write-Host "`nANALISE DA API:"
        Write-Host "Campos nivel 1: $($response.analise.dados_api.campos_nivel_1 -join ', ')"
        
        if ($response.analise.dados_api.evento) {
            Write-Host "`nEVENTO:"
            Write-Host "Campos do evento: $($response.analise.dados_api.evento.campos -join ', ')"
            Write-Host "Tem rateio no evento? $($response.analise.dados_api.evento.tem_rateio)"
            
            if ($response.analise.dados_api.evento.rateio_detalhes) {
                Write-Host "`nDETALHES DO RATEIO:"
                Write-Host "Quantidade: $($response.analise.dados_api.evento.rateio_detalhes.quantidade)"
                if ($response.analise.dados_api.evento.rateio_detalhes.estrutura_primeiro) {
                    Write-Host "Estrutura do primeiro item:"
                    $response.analise.dados_api.evento.rateio_detalhes.estrutura_primeiro | ConvertTo-Json -Depth 3
                }
            }
        }
        
        if ($response.analise.dados_api.campos_suspeitos.Count -gt 0) {
            Write-Host "`nCAMPOS SUSPEITOS ENCONTRADOS:"
            $response.analise.dados_api.campos_suspeitos | ConvertTo-Json -Depth 2
        }
        
        Write-Host "`nDIAGNOSTICO FINAL:"
        Write-Host $response.comparacao.diagnostico
        Write-Host "`nRECOMENDACAO:"
        Write-Host $response.recomendacao
        
        if (-not $response.comparacao.rateio_na_api) {
            Write-Host "`nIMPORTANTE: Se o rateio nao esta em evento.rateio, examine a estrutura completa!"
            Write-Host "A estrutura completa esta em: response.estrutura_api_completa"
        }
    } else {
        Write-Host "ERRO: $($response.message)"
    }
}
catch {
    Write-Host "Erro na requisicao"
    Write-Host $_.Exception.Message
} 