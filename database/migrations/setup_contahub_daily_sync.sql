-- Configuração do pgcron para sincronização diária do ContaHub
-- Executa todos os dias às 07:00 para pegar dados do dia anterior

-- Habilitar extensão pgcron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job existente se houver
SELECT cron.unschedule('contahub-daily-sync');

-- Criar função para sincronização diária
CREATE OR REPLACE FUNCTION sync_contahub_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    data_ontem DATE;
    resultado JSONB;
BEGIN
    -- Calcular data de ontem
    data_ontem := CURRENT_DATE - INTERVAL '1 day';
    
    -- Log do início
    RAISE NOTICE 'Iniciando sincronização ContaHub para %', data_ontem;
    
    -- Chamar a Edge Function do orquestrador
    SELECT content::jsonb INTO resultado
    FROM http((
        'POST',
        current_setting('app.supabase_url') || '/functions/v1/contahub_orchestrator',
        ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
            'data_date', data_ontem::text,
            'bar_id', 3
        )::text
    ));
    
    -- Verificar resultado
    IF resultado->>'success' = 'true' THEN
        RAISE NOTICE 'Sincronização concluída com sucesso para %: % coletados, % processados', 
            data_ontem,
            resultado->'summary'->>'total_records_collected',
            resultado->'summary'->>'total_records_processed';
    ELSE
        RAISE WARNING 'Erro na sincronização para %: %', data_ontem, resultado;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro na sincronização ContaHub para %: %', data_ontem, SQLERRM;
END;
$$;

-- Agendar execução diária às 07:00
SELECT cron.schedule(
    'contahub-daily-sync',
    '0 7 * * *',  -- Todo dia às 07:00
    'SELECT sync_contahub_daily();'
);

-- Verificar se o job foi criado
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname = 'contahub-daily-sync';

-- Configurações necessárias (executar como superuser)
-- ALTER SYSTEM SET cron.database_name = 'postgres';
-- SELECT pg_reload_conf();

COMMENT ON FUNCTION sync_contahub_daily() IS 'Função para sincronização diária automática do ContaHub via pgcron';
