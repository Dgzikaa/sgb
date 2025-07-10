$url = "http://localhost:3001/api/contaazul/testar-endpoints-alternativos"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    bar_id = "3"
} | ConvertTo-Json

Write-Host "Testando endpoints alternativos do ContaAzul..."
Write-Host "URL: $url"
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "Resposta recebida:"
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`nRESUMO:"
    Write-Host "Endpoints funcionando: $($response.resultados.endpoints_funcionando.Count)"
    Write-Host "Endpoints com erro: $($response.resultados.endpoints_com_erro.Count)"
    Write-Host "Total testados: $($response.resultados.endpoints_testados.Count)"
    
    if ($response.resultados.endpoints_funcionando.Count -gt 0) {
        Write-Host "`nENDPOINTS FUNCIONANDO:"
        foreach ($endpoint in $response.resultados.endpoints_funcionando) {
            Write-Host "- $($endpoint.endpoint): $($endpoint.url)"
            Write-Host "  Status: $($endpoint.status_code)"
            Write-Host "  Response size: $($endpoint.response_size) chars"
        }
    }
}
catch {
    Write-Host "Erro na requisicao:"
    Write-Host $_.Exception.Message
} 