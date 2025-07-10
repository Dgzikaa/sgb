$url = "http://localhost:3001/api/contaazul/coletar-json-completo"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    bar_id = "3"
    data_inicio = "2024-01-01"
    data_fim = "2024-12-31"
} | ConvertTo-Json

Write-Host "Testando coleta JSON com 2024 COMPLETO..."
Write-Host "URL: $url"
Write-Host "Body: $body"
Write-Host "Objetivo: Encontrar dados reais e testar chunking"

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "Resposta recebida:"
    $response | ConvertTo-Json -Depth 5
    
    Write-Host "`nRESUMO:"
    Write-Host "Success: $($response.success)"
    if ($response.success) {
        Write-Host "Periodo: $($response.periodo.inicio) a $($response.periodo.fim)"
        Write-Host "Receitas: $($response.resultado.receitas.total_parcelas) parcelas"
        Write-Host "Despesas: $($response.resultado.despesas.total_parcelas) parcelas"
        Write-Host "Arquivos gerados: $($response.resultado.arquivos_gerados.Count)"
        Write-Host "Storage path: $($response.resultado.storage_path)"
        Write-Host "Tempo execucao: $($response.tempo_execucao_ms) ms"
        
        if ($response.resultado.receitas.total_parcelas -gt 0) {
            Write-Host "`nSUCESSO: $($response.resultado.receitas.total_parcelas) receitas encontradas!"
            Write-Host "Arquivo receitas: $($response.resultado.receitas.arquivo_salvo)"
            Write-Host "Paginas processadas: $($response.resultado.receitas.total_paginas)"
        }
        if ($response.resultado.despesas.total_parcelas -gt 0) {
            Write-Host "SUCESSO: $($response.resultado.despesas.total_parcelas) despesas encontradas!"
            Write-Host "Arquivo despesas: $($response.resultado.despesas.arquivo_salvo)"
            Write-Host "Paginas processadas: $($response.resultado.despesas.total_paginas)"
        }
        
        if ($response.resultado.receitas.total_parcelas -eq 0 -and $response.resultado.despesas.total_parcelas -eq 0) {
            Write-Host "`nAVISO: Nenhum dado encontrado em 2024 completo!"
            Write-Host "Isso pode indicar:"
            Write-Host "- Dados em anos diferentes"
            Write-Host "- Filtros muito restritivos"
            Write-Host "- Configuracao de datas na API"
        }
    } else {
        Write-Host "ERRO: $($response.message)"
        Write-Host "Detalhes: $($response.error)"
    }
}
catch {
    Write-Host "Erro na requisicao:"
    Write-Host $_.Exception.Message
} 