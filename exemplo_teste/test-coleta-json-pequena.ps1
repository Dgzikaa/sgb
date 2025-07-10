$url = "http://localhost:3001/api/contaazul/coletar-json-completo"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    bar_id = "3"
    data_inicio = "2024-01-01"
    data_fim = "2024-02-01"
} | ConvertTo-Json

Write-Host "Testando coleta JSON com periodo pequeno (1 mes)..."
Write-Host "URL: $url"
Write-Host "Body: $body"
Write-Host "Objetivo: Testar se o bucket e criado corretamente"

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
    } else {
        Write-Host "ERRO: $($response.message)"
        Write-Host "Detalhes: $($response.error)"
    }
}
catch {
    Write-Host "Erro na requisicao:"
    Write-Host $_.Exception.Message
} 