-- Configuração do pgcron para sincronização contínua do GetIn
-- Executa a cada 4 horas para pegar reservas recentes

-- Habilitar extensão pgcron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job existente se houver
SELECT cron.unschedule('getin-continuous-sync');

-- Criar função para sincronização contínua do GetIn
CREATE OR REPLACE FUNCTION sync_getin_continuous()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    resultado JSONB;
BEGIN
    -- Log do início
    RAISE NOTICE 'Iniciando sincronização contínua GetIn';
    
    -- Chamar a Edge Function getin-sync-continuous
    SELECT content::jsonb INTO resultado
    FROM http((
        'POST',
        current_setting('app.supabase_url') || '/functions/v1/getin-sync-continuous',
        ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'::text
    ));
    
    -- Verificar resultado
    IF resultado->>'success' = 'true' THEN
        RAISE NOTICE 'Sincronização GetIn concluída com sucesso: % reservas processadas', 
            COALESCE(resultado->>'total_processed', '0');
    ELSE
        RAISE WARNING 'Erro na sincronização GetIn: %', resultado;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro na sincronização GetIn: %', SQLERRM;
END;
$$;

-- Agendar execução a cada 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
SELECT cron.schedule(
    'getin-continuous-sync',
    '0 */4 * * *',  -- A cada 4 horas
    'SELECT sync_getin_continuous();'
);

-- Verificar se o job foi criado
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname = 'getin-continuous-sync';

COMMENT ON FUNCTION sync_getin_continuous() IS 'Função para sincronização contínua automática do GetIn via pgcron';
