$substituicoes = @{
    "Ã¡" = "á"; "Ã©" = "é"; "Ã­" = "í"; "Ã³" = "ó"; "Ãº" = "ú"
    "Ã£" = "ã"; "Ãµ" = "õ"; "Ã¢" = "â"; "Ãª" = "ê"; "Ã´" = "ô"
    "Ã€" = "À"; "Ã‰" = "É"; "Ã“" = "Ó"; "Ãš" = "Ú"
    "Ã§" = "ç"; "Ã‡" = "Ç"
    "â€œ" = "“"; "â€" = "”"; "â€˜" = "‘"; "â€™" = "’"
    "â€“" = "–"; "â€”" = "—"; "â€¢" = "•"; "â€¦" = "…"
    "Â" = ""; "â‚¬" = "€"; "â„¢" = "™"; "âˆ’" = "−"
    "ðŸ§ª" = "🧪"; "œ…" = "✔"; "ðŸš€" = "🚀"
}

Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js -File | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\'
} | ForEach-Object {
    try {
        $conteudo = Get-Content $_.FullName -Encoding Default | Out-String
        foreach ($k in $substituicoes.Keys) {
            $conteudo = $conteudo -replace [regex]::Escape($k), $substituicoes[$k]
        }
        [System.IO.File]::WriteAllText($_.FullName, $conteudo, [System.Text.Encoding]::UTF8)
        Write-Host "Corrigido: $($_.FullName)"
    } catch {
        Write-Warning "Erro ao processar: $($_.FullName)"
    }
}
