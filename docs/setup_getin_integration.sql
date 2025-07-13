-- =====================================================
-- SETUP COMPLETO DA INTEGRAÇÃO GETIN
-- =====================================================

-- 1. CRIAR TABELA DE LOGS DE EXECUÇÃO
CREATE TABLE IF NOT EXISTS getin_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    status TEXT NOT NULL,
    reservas_extraidas INTEGER DEFAULT 0,
    reservas_novas INTEGER DEFAULT 0,
    reservas_atualizadas INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADICIONAR COLUNAS DE INTEGRAÇÃO NA TABELA getin_reservas (se não existirem)
ALTER TABLE getin_reservas ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';
ALTER TABLE getin_reservas ADD COLUMN IF NOT EXISTS dados_brutos JSONB;
ALTER TABLE getin_reservas ADD COLUMN IF NOT EXISTS sync_timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE getin_reservas ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_getin_reservas_origem ON getin_reservas(origem);
CREATE INDEX IF NOT EXISTS idx_getin_reservas_sync_timestamp ON getin_reservas(sync_timestamp);
CREATE INDEX IF NOT EXISTS idx_getin_reservas_external_id ON getin_reservas(external_id);
CREATE INDEX IF NOT EXISTS idx_getin_sync_logs_timestamp ON getin_sync_logs(timestamp);

-- 4. FUNÇÃO UPSERT MELHORADA PARA GETIN
CREATE OR REPLACE FUNCTION upsert_getin_reserva(
    p_nome_cliente TEXT,
    p_data_reserva DATE,
    p_horario TEXT,
    p_pessoas INTEGER,
    p_status TEXT,
    p_observacoes TEXT DEFAULT '',
    p_telefone TEXT DEFAULT '',
    p_email TEXT DEFAULT '',
    p_mesa TEXT DEFAULT '',
    p_origem TEXT DEFAULT 'getin_auto',
    p_dados_brutos JSONB DEFAULT '{}'::jsonb,
    p_external_id TEXT DEFAULT NULL
)
RETURNS TABLE(inserted BOOLEAN, reserva_id BIGINT) AS $$
DECLARE
    v_reserva_id BIGINT;
    v_inserted BOOLEAN := FALSE;
BEGIN
    -- Tentar encontrar reserva existente
    SELECT id INTO v_reserva_id
    FROM getin_reservas 
    WHERE nome_cliente = p_nome_cliente 
      AND data_reserva = p_data_reserva 
      AND horario = p_horario
      AND (external_id = p_external_id OR (external_id IS NULL AND p_external_id IS NULL))
    LIMIT 1;
    
    IF v_reserva_id IS NULL THEN
        -- Inserir nova reserva
        INSERT INTO getin_reservas (
            nome_cliente, data_reserva, horario, pessoas, status,
            observacoes, telefone, email, mesa, origem, dados_brutos,
            external_id, sync_timestamp
        ) VALUES (
            p_nome_cliente, p_data_reserva, p_horario, p_pessoas, p_status,
            p_observacoes, p_telefone, p_email, p_mesa, p_origem, p_dados_brutos,
            p_external_id, NOW()
        ) RETURNING id INTO v_reserva_id;
        
        v_inserted := TRUE;
    ELSE
        -- Atualizar reserva existente
        UPDATE getin_reservas SET
            pessoas = p_pessoas,
            status = p_status,
            observacoes = p_observacoes,
            telefone = p_telefone,
            email = p_email,
            mesa = p_mesa,
            dados_brutos = p_dados_brutos,
            sync_timestamp = NOW()
        WHERE id = v_reserva_id;
        
        v_inserted := FALSE;
    END IF;
    
    RETURN QUERY SELECT v_inserted, v_reserva_id;
END;
$$ LANGUAGE plpgsql;

-- 5. INSERIR CREDENCIAIS GETIN (se não existirem)
INSERT INTO api_credentials (service, username, password, additional_config)
SELECT 'getin', 'andressa.rocha0206@gmail.com', '86285744Ordinario!', '{
    "base_url": "https://auth.getinapp.com.br",
    "deployment_id": "dpl_DGocJm7adDuqY1AqyYnhVM6uyrSp",
    "webpack_id": "webpack-6f816390d4550b7e"
}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM api_credentials WHERE service = 'getin'
);

-- 6. CONFIGURAR WEBHOOK DISCORD PARA GETIN (atualizar se existir)
INSERT INTO webhook_configs (tipo, webhook_url, ativo, configuracoes)
VALUES ('discord', 'https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI', true, '{
    "for_services": ["getin"],
    "notification_types": ["sync_success", "sync_error"],
    "color_success": 65280,
    "color_error": 16711680
}'::jsonb)
ON CONFLICT (tipo) DO UPDATE SET
    configuracoes = EXCLUDED.configuracoes || webhook_configs.configuracoes,
    updated_at = NOW();

-- 7. HABILITAR EXTENSÃO PG_CRON (se não estiver habilitada)
-- Executar como superuser no seu projeto Supabase:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 8. CONFIGURAR CRON JOB PARA EXECUTAR A CADA 4 HORAS
-- Remover job existente se houver
SELECT cron.unschedule('getin-sync-job');

-- Criar novo job (executar a cada 4 horas)
SELECT cron.schedule(
    'getin-sync-job',
    '0 */4 * * *',  -- A cada 4 horas no minuto 0
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/getin-sync-automatico',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || 'YOUR_ANON_KEY'
        ),
        body := jsonb_build_object()
    );
    $$
);

-- 9. VERIFICAR JOBS AGENDADOS
SELECT * FROM cron.job WHERE jobname = 'getin-sync-job';

-- 10. FUNÇÃO PARA MONITORAR ÚLTIMA EXECUÇÃO
CREATE OR REPLACE FUNCTION get_getin_sync_status()
RETURNS TABLE(
    ultima_execucao TIMESTAMPTZ,
    status_ultima TEXT,
    total_reservas_hoje INTEGER,
    proxima_execucao TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gsl.timestamp as ultima_execucao,
        gsl.status as status_ultima,
        COALESCE(COUNT(gr.id)::INTEGER, 0) as total_reservas_hoje,
        (
            SELECT CASE 
                WHEN gsl.timestamp IS NULL THEN NOW()
                ELSE gsl.timestamp + INTERVAL '4 hours'
            END
        ) as proxima_execucao
    FROM getin_sync_logs gsl
    LEFT JOIN getin_reservas gr ON DATE(gr.data_reserva) = CURRENT_DATE
    WHERE gsl.id = (SELECT MAX(id) FROM getin_sync_logs)
    GROUP BY gsl.timestamp, gsl.status;
END;
$$ LANGUAGE plpgsql;

-- 11. VIEW PARA DASHBOARD DE RESERVAS GETIN
CREATE OR REPLACE VIEW v_getin_dashboard AS
SELECT 
    DATE(data_reserva) as data,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE status = 'confirmada') as confirmadas,
    COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
    COUNT(*) FILTER (WHERE status = 'cancelada') as canceladas,
    SUM(pessoas) as total_pessoas,
    SUM(pessoas) FILTER (WHERE status = 'confirmada') as pessoas_confirmadas,
    STRING_AGG(DISTINCT origem, ', ') as origens,
    MAX(sync_timestamp) as ultima_atualizacao
FROM getin_reservas 
WHERE data_reserva >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(data_reserva)
ORDER BY data DESC;

-- 12. POLÍTICA DE SEGURANÇA (RLS)
ALTER TABLE getin_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE getin_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política para leitura (usuários autenticados)
CREATE POLICY IF NOT EXISTS "Permitir leitura para usuários autenticados"
ON getin_reservas FOR SELECT
TO authenticated
USING (true);

-- Política para escrita (apenas service role)
CREATE POLICY IF NOT EXISTS "Permitir escrita para service role"
ON getin_reservas FOR ALL
TO service_role
USING (true);

-- Política para logs (apenas service role)
CREATE POLICY IF NOT EXISTS "Permitir tudo para service role nos logs"
ON getin_sync_logs FOR ALL
TO service_role
USING (true);

-- 13. GRANT PERMISSIONS
GRANT ALL ON getin_reservas TO service_role;
GRANT ALL ON getin_sync_logs TO service_role;
GRANT EXECUTE ON FUNCTION upsert_getin_reserva TO service_role;
GRANT EXECUTE ON FUNCTION get_getin_sync_status TO authenticated;
GRANT SELECT ON v_getin_dashboard TO authenticated;

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================

/*
PARA FINALIZAR A CONFIGURAÇÃO:

1. ATUALIZAR WEBHOOK DISCORD:
   - Substitua 'https://discord.com/api/webhooks/SEU_WEBHOOK_AQUI' 
     pelo seu webhook real do Discord

2. ATUALIZAR CRON JOB:
   - Substitua 'YOUR_PROJECT_ID' pelo ID do seu projeto Supabase
   - Substitua 'YOUR_ANON_KEY' pela sua chave anônima do Supabase

3. EXECUTAR MANUALMENTE PARA TESTAR:
   ```sql
   SELECT net.http_post(
       url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/getin-sync-automatico',
       headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || 'SUA_ANON_KEY'
       )
   );
   ```

4. MONITORAR EXECUÇÕES:
   ```sql
   SELECT * FROM get_getin_sync_status();
   SELECT * FROM getin_sync_logs ORDER BY timestamp DESC LIMIT 10;
   SELECT * FROM v_getin_dashboard LIMIT 7;
   ```

5. PARAR/INICIAR CRON JOB:
   ```sql
   -- Parar
   SELECT cron.unschedule('getin-sync-job');
   
   -- Iniciar novamente
   SELECT cron.schedule('getin-sync-job', '0 */4 * * *', '...');
   ```
*/ 