$url = "http://localhost:3001/api/contaazul/coletar-com-detalhes-completo"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    bar_id = "3"
    data_inicio = "2025-01-01"
    data_fim = "2025-01-31"
} | ConvertTo-Json

Write-Host "🚀 Testando COLETA COMPLETA COM DETALHES - Janeiro 2025..."
Write-Host "URL: $url"
Write-Host "Body: $body"
Write-Host "Objetivo: Coletar listas + detalhes individuais com rateio"
Write-Host ""
Write-Host "⚠️  ATENCAO: Este processo pode demorar varios minutos!"
Write-Host "   - 20 receitas = 20 requisicoes individuais"
Write-Host "   - 216 despesas = 216 requisicoes individuais"
Write-Host "   - Total: ~236 requisicoes com rate limiting"
Write-Host ""

try {
    Write-Host "Iniciando... (aguarde)"
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "Resposta recebida:"
    $response | ConvertTo-Json -Depth 5
    
    Write-Host "`n🎯 RESUMO FINAL:"
    Write-Host "Success: $($response.success)"
    if ($response.success) {
        Write-Host "Periodo: $($response.periodo.inicio) a $($response.periodo.fim)"
        
        Write-Host "`n💰 RECEITAS:"
        Write-Host "- Parcelas basicas: $($response.resultado.receitas.parcelas_basicas)"
        Write-Host "- Detalhes coletados: $($response.resultado.receitas.detalhes_coletados)"
        Write-Host "- Com rateio: $($response.resultado.receitas.com_rateio)"
        Write-Host "- Arquivo: $($response.resultado.receitas.arquivo_salvo)"
        
        Write-Host "`n💸 DESPESAS:"
        Write-Host "- Parcelas basicas: $($response.resultado.despesas.parcelas_basicas)"
        Write-Host "- Detalhes coletados: $($response.resultado.despesas.detalhes_coletados)"
        Write-Host "- Com rateio: $($response.resultado.despesas.com_rateio)"
        Write-Host "- Arquivo: $($response.resultado.despesas.arquivo_salvo)"
        
        Write-Host "`n⚡ PERFORMANCE:"
        Write-Host "- Tempo total: $($response.tempo_execucao_ms) ms"
        Write-Host "- Tempo listas: $($response.resumo_performance.tempo_listas)"
        Write-Host "- Tempo detalhes: $($response.resumo_performance.tempo_detalhes)"
        Write-Host "- Total requisicoes: $($response.resumo_performance.total_requisicoes)"
        Write-Host "- Eficiencia: $($response.resumo_performance.eficiencia)"
        
        $totalComRateio = $response.resultado.receitas.com_rateio + $response.resultado.despesas.com_rateio
        $totalGeral = $response.resultado.receitas.detalhes_coletados + $response.resultado.despesas.detalhes_coletados
        
        if ($totalComRateio -gt 0) {
            Write-Host "`n🎉 SUCESSO: $totalComRateio de $totalGeral transacoes COM RATEIO!"
            Write-Host "✅ Dados completos com categorias e centros de custo!"
            Write-Host "✅ Prontos para processamento final!"
        } else {
            Write-Host "`n⚠️  AVISO: Nenhuma transacao com rateio encontrada"
            Write-Host "Isso pode indicar que este cliente nao usa categorias/centros"
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