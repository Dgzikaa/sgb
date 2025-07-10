#!/usr/bin/env pwsh

Write-Host "🔍 INVESTIGAÇÃO COMPLETA CONTAAZUL - VERCEL PRODUCTION!" -ForegroundColor Green

$baseUrl = "https://sgb-contaazul.vercel.app"

# Teste 1: Investigação completa por eventos
Write-Host "`n🚀 TESTE 1: Investigação completa por eventos..." -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/contaazul/investigar-tudo-possivel" -ForegroundColor Gray

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/contaazul/investigar-tudo-possivel" -Method GET
    Write-Host "✅ Investigação por eventos concluída!" -ForegroundColor Green
    Write-Host "   • Eventos testados: $($response1.analise.total_eventos_testados)" -ForegroundColor Cyan
    Write-Host "   • Descobertas: $($response1.analise.descobertas.count)" -ForegroundColor Cyan
    
    if ($response1.analise.descobertas.count -gt 0) {
        Write-Host "   🎉 DESCOBERTAS IMPORTANTES:" -ForegroundColor Magenta
        foreach ($descoberta in $response1.analise.descobertas) {
            Write-Host "      • $descoberta" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   📊 Endpoints com sucesso:" -ForegroundColor Cyan
    foreach ($endpoint in $response1.analise.endpoints_com_sucesso.PSObject.Properties) {
        Write-Host "      • $($endpoint.Name): $($endpoint.Value)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro na investigação por eventos: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Investigação por categorias específicas
Write-Host "`n🎯 TESTE 2: Investigação por categorias específicas..." -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/contaazul/investigar-categorias-especificas" -ForegroundColor Gray

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/contaazul/investigar-categorias-especificas" -Method GET
    Write-Host "✅ Investigação por categorias concluída!" -ForegroundColor Green
    Write-Host "   • Categorias testadas: $($response2.analise.total_categorias_testadas)" -ForegroundColor Cyan
    Write-Host "   • Categorias com dados: $($response2.analise.categorias_com_dados)" -ForegroundColor Cyan
    Write-Host "   • Total de registros: $($response2.analise.total_registros_encontrados)" -ForegroundColor Cyan
    Write-Host "   • Descobertas: $($response2.analise.descobertas.count)" -ForegroundColor Cyan
    
    if ($response2.analise.descobertas.count -gt 0) {
        Write-Host "   🎉 DESCOBERTAS IMPORTANTES:" -ForegroundColor Magenta
        foreach ($descoberta in $response2.analise.descobertas) {
            Write-Host "      • $descoberta" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   📊 Endpoints com sucesso:" -ForegroundColor Cyan
    foreach ($endpoint in $response2.analise.endpoints_com_sucesso.PSObject.Properties) {
        Write-Host "      • $($endpoint.Name): $($endpoint.Value)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro na investigação por categorias: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumo final
Write-Host "`n📋 RESUMO FINAL DA INVESTIGAÇÃO:" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

$totalTestes = 0
$totalDescobertas = 0

if ($response1) {
    $totalTestes += $response1.analise.total_eventos_testados
    $totalDescobertas += $response1.analise.descobertas.count
}

if ($response2) {
    $totalTestes += $response2.analise.total_categorias_testadas
    $totalDescobertas += $response2.analise.descobertas.count
}

Write-Host "🔢 Total de testes realizados: $totalTestes" -ForegroundColor Cyan
Write-Host "🎯 Total de descobertas: $totalDescobertas" -ForegroundColor Cyan

if ($totalDescobertas -gt 0) {
    Write-Host "🎉 SUCESSO! Encontramos dados de categorização!" -ForegroundColor Green
    Write-Host "   👉 Próximos passos:" -ForegroundColor Yellow
    Write-Host "      1. Analisar os endpoints que retornaram dados" -ForegroundColor White
    Write-Host "      2. Implementar coleta usando os endpoints descobertos" -ForegroundColor White
    Write-Host "      3. Testar com dados reais de produção" -ForegroundColor White
} else {
    Write-Host "⚠️  Nenhum dado de categorização encontrado." -ForegroundColor Yellow
    Write-Host "   👉 Próximos passos:" -ForegroundColor Yellow
    Write-Host "      1. Verificar configuração no ContaAzul" -ForegroundColor White
    Write-Host "      2. Testar com outros períodos/dados" -ForegroundColor White
    Write-Host "      3. Consultar documentação oficial" -ForegroundColor White
    Write-Host "      4. Contatar suporte do ContaAzul" -ForegroundColor White
}

Write-Host "`n🌐 Acesse a interface visual em:" -ForegroundColor Green
Write-Host "   $baseUrl/relatorios/contaazul-investigacao-completa" -ForegroundColor Cyan

Write-Host "`n✨ Investigação completa finalizada!" -ForegroundColor Green 