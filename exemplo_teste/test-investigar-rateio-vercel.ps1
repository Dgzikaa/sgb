#!/usr/bin/env pwsh

Write-Host "INVESTIGANDO CAMPOS NAO DOCUMENTADOS - VERCEL" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Configuracoes do Vercel (substitua pela sua URL)
$vercelUrl = Read-Host "Digite a URL do seu Vercel (ex: https://sua-app.vercel.app)"

if ([string]::IsNullOrEmpty($vercelUrl)) {
    Write-Host "URL do Vercel e obrigatoria!" -ForegroundColor Red
    exit 1
}

$endpoints = @(
    "/api/contaazul/verificar-token",
    "/api/contaazul/investigar-rateio-nao-documentado",
    "/api/contaazul/investigar-rateio-dados-locais"
)

foreach ($endpoint in $endpoints) {
    $fullUrl = $vercelUrl + $endpoint
    
    Write-Host ""
    Write-Host "Testando: $endpoint" -ForegroundColor Yellow
    Write-Host "URL: $fullUrl" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    
    try {
        $response = Invoke-RestMethod -Uri $fullUrl -Method GET -ContentType "application/json" -ErrorAction Stop
        
        Write-Host "SUCESSO!" -ForegroundColor Green
        
        # Mostrar resposta formatada
        if ($endpoint -eq "/api/contaazul/verificar-token") {
            Write-Host "Configuracao ativa: $($response.tem_configuracao_ativa)" -ForegroundColor Cyan
            if ($response.configuracao_ativa) {
                $config = $response.configuracao_ativa
                Write-Host "  Bar ID: $($config.bar_id)" -ForegroundColor White
                Write-Host "  Sistema: $($config.sistema)" -ForegroundColor White
                Write-Host "  Ambiente: $($config.ambiente)" -ForegroundColor White
                Write-Host "  Access Token: $($config.access_token)" -ForegroundColor White
                Write-Host "  Token expirado: $($config.token_expirado)" -ForegroundColor $(if ($config.token_expirado -eq $true) { "Red" } else { "Green" })
                Write-Host "  Empresa: $($config.empresa_nome)" -ForegroundColor White
            }
        }
        elseif ($endpoint -eq "/api/contaazul/investigar-rateio-nao-documentado") {
            Write-Host "INVESTIGACAO PRINCIPAL:" -ForegroundColor Cyan
            Write-Host "  Total testado: $($response.total_testado)" -ForegroundColor White
            
            foreach ($resultado in $response.resultados) {
                Write-Host "  Parcela: $($resultado.id_parcela)" -ForegroundColor White
                
                if ($resultado.erro) {
                    Write-Host "    Erro: $($resultado.erro)" -ForegroundColor Red
                } else {
                    Write-Host "    Tem rateio: $($resultado.tem_rateio)" -ForegroundColor $(if ($resultado.tem_rateio) { "Green" } else { "Red" })
                    Write-Host "    Tem evento.rateio: $($resultado.tem_evento_rateio)" -ForegroundColor $(if ($resultado.tem_evento_rateio) { "Green" } else { "Red" })
                    Write-Host "    Tem categorias: $($resultado.tem_categorias)" -ForegroundColor $(if ($resultado.tem_categorias) { "Green" } else { "Red" })
                    Write-Host "    Tem centros_custo: $($resultado.tem_centros_custo)" -ForegroundColor $(if ($resultado.tem_centros_custo) { "Green" } else { "Red" })
                }
            }
            
            # Mostrar conclusao
            $temRateio = $response.resultados | Where-Object { $_.tem_rateio -eq $true }
            $temEventoRateio = $response.resultados | Where-Object { $_.tem_evento_rateio -eq $true }
            $temCategorias = $response.resultados | Where-Object { $_.tem_categorias -eq $true }
            $temCentros = $response.resultados | Where-Object { $_.tem_centros_custo -eq $true }
            
            Write-Host ""
            if ($temRateio.Count -gt 0) {
                Write-Host "RESULTADO: CAMPO RATEIO ENCONTRADO! Documentacao incompleta." -ForegroundColor Green
            } elseif ($temEventoRateio.Count -gt 0) {
                Write-Host "RESULTADO: CAMPO EVENTO.RATEIO ENCONTRADO! Documentacao incompleta." -ForegroundColor Green
            } elseif ($temCategorias.Count -gt 0 -or $temCentros.Count -gt 0) {
                Write-Host "RESULTADO: CAMPOS RELACIONADOS ENCONTRADOS!" -ForegroundColor Green
            } else {
                Write-Host "RESULTADO: Nenhum campo de rateio encontrado na API." -ForegroundColor Red
            }
        }
        elseif ($endpoint -eq "/api/contaazul/investigar-rateio-dados-locais") {
            Write-Host "DADOS LOCAIS:" -ForegroundColor Cyan
            $dados = $response.dados_locais_disponiveis
            Write-Host "  Categorias: $($dados.categorias.total) registros" -ForegroundColor White
            Write-Host "  Centros custo: $($dados.centros_custo.total) registros" -ForegroundColor White
            Write-Host "  Contas financeiras: $($dados.contas_financeiras.total) registros" -ForegroundColor White
            Write-Host "  Competencia: $($dados.competencia.total) registros" -ForegroundColor White
        }
        
    } catch {
        Write-Host "ERRO na requisicao!" -ForegroundColor Red
        Write-Host "  Mensagem: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = [System.IO.StreamReader]::new($stream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "  Detalhes: $errorBody" -ForegroundColor Red
            } catch {
                Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Green
Write-Host "1. Se verificar-token mostrou 'token expirado': va em /configuracoes > Integracoes > ContaAzul e renove" -ForegroundColor Yellow
Write-Host "2. Se nao tem configuracao ativa: va em /configuracoes > Integracoes > ContaAzul e configure" -ForegroundColor Yellow
Write-Host "3. Se investigacao principal funcionou: analise se encontrou campos rateio!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Investigacao no Vercel concluida!" -ForegroundColor Green 