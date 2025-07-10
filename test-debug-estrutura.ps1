# Primeiro vamos pegar um ID de parcela dos dados ja coletados
Write-Host "Debugando estrutura REAL da API ContaAzul..."
Write-Host "Usando uma parcela dos dados coletados anteriormente"
Write-Host ""

# Vamos usar um ID fixo de uma das parcelas coletadas
# (normalmente pegariamos isso dos dados salvos, mas vamos simular)
$url = "http://localhost:3001/api/contaazul/debug-estrutura-real"
$headers = @{
    "Content-Type" = "application/json"
}

# NOTA: Substitua este ID por um ID real de parcela dos seus dados
# Voce pode pegar isso dos JSONs salvos no Storage
$body = @{
    bar_id = "3"
    parcela_id = "COLOQUE_AQUI_UM_ID_REAL_DE_PARCELA"
} | ConvertTo-Json

Write-Host "IMPORTANTE: Primeiro precisamos de um ID real de parcela!"
Write-Host "1. Va ate o Supabase Storage"
Write-Host "2. Baixe um dos JSONs salvos (ex: receitas_completas_2025-01-01_2025-01-31.json)"
Write-Host "3. Abra o JSON e pegue o 'id' de qualquer parcela"
Write-Host "4. Substitua COLOQUE_AQUI_UM_ID_REAL_DE_PARCELA pelo ID real"
Write-Host ""
Write-Host "Exemplo de como encontrar:"
Write-Host '  parcelas: ['
Write-Host '    {'
Write-Host '      "id": "abc123-def456-...",  <-- COPIE ESTE ID'
Write-Host '      "descricao": "...",'
Write-Host '      ...'
Write-Host '    }'
Write-Host '  ]'
Write-Host ""

# Se quiser testar mesmo assim (vai dar erro sem ID real)
$continuar = Read-Host "Deseja continuar mesmo sem um ID real? (s/n)"

if ($continuar -eq "s") {
    try {
        Write-Host "Fazendo requisicao..."
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
        
        Write-Host "`nRESPOSTA:"
        $response | ConvertTo-Json -Depth 10
        
        if ($response.success) {
            Write-Host "`nCAMPOS ENCONTRADOS NO NIVEL 1:"
            $response.analise.campos_nivel_1 | ForEach-Object { Write-Host "- $_" }
            
            if ($response.analise.evento_analise) {
                Write-Host "`nANALISE DO EVENTO:"
                Write-Host "Tem rateio? $($response.analise.evento_analise.tem_rateio)"
                Write-Host "Tem categoria? $($response.analise.evento_analise.tem_categoria)"
                Write-Host "Tem centro_custo? $($response.analise.evento_analise.tem_centro_custo)"
                
                if ($response.analise.evento_analise.rateio_estrutura) {
                    Write-Host "`nESTRUTURA DO RATEIO:"
                    Write-Host "Quantidade de itens: $($response.analise.evento_analise.rateio_estrutura.quantidade)"
                }
            }
            
            if ($response.analise.campos_suspeitos.Count -gt 0) {
                Write-Host "`nCAMPOS SUSPEITOS ENCONTRADOS:"
                $response.analise.campos_suspeitos.PSObject.Properties | ForEach-Object {
                    Write-Host "- $($_.Name): $($_.Value.tipo)"
                }
            }
            
            Write-Host "`nCONCLUSOES:"
            Write-Host "Tem rateio documentado? $($response.conclusoes.tem_rateio_documentado)"
            Write-Host "Campos categoria encontrados: $($response.conclusoes.campos_categoria_encontrados)"
            
            if ($response.conclusoes.possivel_localizacao_rateio.Count -gt 0) {
                Write-Host "Possiveis localizacoes do rateio:"
                $response.conclusoes.possivel_localizacao_rateio | ForEach-Object {
                    Write-Host "- $_"
                }
            }
        }
    }
    catch {
        Write-Host "Erro na requisicao:"
        Write-Host $_.Exception.Message
    }
} else {
    Write-Host "Script cancelado. Pegue um ID real primeiro!"
} 