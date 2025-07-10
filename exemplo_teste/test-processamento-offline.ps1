$url = "http://localhost:3001/api/contaazul/processar-json-offline"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    bar_id = "3"
    storage_path = "contaazul-dados/3/2025-07-10T16-58-17-357Z/"
} | ConvertTo-Json

Write-Host "Testando PROCESSAMENTO OFFLINE dos dados coletados..."
Write-Host "URL: $url"
Write-Host "Body: $body"
Write-Host "Objetivo: Processar JSONs e inserir na tabela final"

try {
    Write-Host "`nIniciando processamento... (pode demorar alguns minutos)"
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "Resposta recebida:"
    $response | ConvertTo-Json -Depth 5
    
    Write-Host "`nRESUMO:"
    Write-Host "Success: $($response.success)"
    if ($response.success) {
        Write-Host "Arquivos processados: $($response.resultado.arquivos_processados.Count)"
        Write-Host "Registros inseridos: $($response.resultado.total_registros_inseridos)"
        Write-Host "Tempo execucao: $($response.resultado.performance.tempo_total_ms) ms"
        Write-Host "Performance:"
        Write-Host "- Tempo leitura: $($response.resultado.performance.tempo_leitura) ms"
        Write-Host "- Tempo processamento: $($response.resultado.performance.tempo_processamento) ms"
        Write-Host "- Tempo insercao: $($response.resultado.performance.tempo_insercao) ms"
        
        if ($response.resultado.total_registros_inseridos -gt 0) {
            Write-Host "`nSUCESSO TOTAL: $($response.resultado.total_registros_inseridos) registros processados!"
            Write-Host "Dados prontos na tabela contaazul_visao_competencia"
            Write-Host "Com categorias e centros de custo associados!"
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