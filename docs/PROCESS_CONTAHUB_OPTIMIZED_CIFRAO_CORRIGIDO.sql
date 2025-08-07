-- FUNÇÃO process_contahub_optimized() CORRIGIDA COM CHAVES DE CIFRÃO
-- Execute este SQL no Supabase SQL Editor:

CREATE OR REPLACE FUNCTION process_contahub_optimized()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    r RECORD;
    v_result text := '';
    v_count integer;
    v_processed_dates date[];
    v_processed_bars integer[];
    v_date date;
    v_bar_id integer;
    v_evento_update text;
BEGIN
    -- Processar 1 registro por vez para evitar timeout
    FOR r IN SELECT * FROM contahub_raw_data WHERE processed = FALSE ORDER BY created_at ASC LIMIT 1
    LOOP
        CASE r.data_type
            WHEN 'fatporhora' THEN
                -- Deletar registros existentes para essa data/bar
                DELETE FROM contahub_fatporhora
                WHERE bar_id = r.bar_id
                AND DATE(data_evento) = r.data_date;

                -- Processar fatporhora com chaves corretas ($valor)
                INSERT INTO contahub_fatporhora (
                    bar_id, hora, vr_liquido, qtd_vendas, data_evento, dds, dia, semana,
                    created_at, updated_at, hora_num
                )
                SELECT
                    r.bar_id,
                    item->>'hora',
                    COALESCE(NULLIF(item->>'$valor', '')::numeric, 0), -- ✅ CORRIGIDO: $valor
                    COALESCE(NULLIF(item->>'qtd', '')::numeric, 0)::integer,
                    COALESCE((item->>'vd_dtgerencial')::timestamp, r.data_date::timestamp),
                    COALESCE((item->>'dds')::integer, 0),
                    item->>'dia',
                    EXTRACT(WEEK FROM r.data_date)::integer,
                    NOW(),
                    NOW(),
                    EXTRACT(HOUR FROM (item->>'hora')::time)::integer
                FROM jsonb_array_elements(COALESCE(r.raw_json->'list', r.raw_json)) as item;

            WHEN 'pagamentos' THEN
                -- Deletar registros existentes para essa data/bar
                DELETE FROM contahub_pagamentos
                WHERE bar_id = r.bar_id
                AND dt_gerencial = r.data_date;

                -- Processar pagamentos com chaves corretas ($valor, $liquido)
                INSERT INTO contahub_pagamentos (
                    bar_id, vd, trn, dt_gerencial, hr_lancamento, hr_transacao, dt_transacao,
                    mesa, cli, cliente, vr_pagamentos, pag, valor, taxa, perc, liquido,
                    tipo, meio, cartao, autorizacao, dt_credito, usr_abriu, usr_lancou,
                    usr_aceitou, motivodesconto, created_at, updated_at, semana
                )
                SELECT
                    r.bar_id,
                    item->>'vd',
                    item->>'trn',
                    r.data_date,
                    item->>'hr_lancamento',
                    item->>'hr_transacao',
                    COALESCE((item->>'dt_transacao')::date, r.data_date),
                    item->>'mesa',
                    item->>'cli',
                    item->>'cliente',
                    COALESCE(NULLIF(item->>'vr_pagamentos', '')::numeric, 0),
                    item->>'pag',
                    COALESCE(NULLIF(item->>'$valor', '')::numeric, 0), -- ✅ CORRIGIDO: $valor
                    COALESCE(NULLIF(item->>'taxa', '')::numeric, 0),
                    COALESCE(NULLIF(item->>'perc', '')::numeric, 0),
                    COALESCE(NULLIF(item->>'$liquido', '')::numeric, 0), -- ✅ CORRIGIDO: $liquido
                    item->>'tipo',
                    item->>'meio',
                    item->>'cartao',
                    item->>'autorizacao',
                    COALESCE((item->>'dt_credito')::date, r.data_date),
                    item->>'usr_abriu',
                    item->>'usr_lancou',
                    item->>'usr_aceitou',
                    item->>'motivodesconto',
                    NOW(),
                    NOW(),
                    EXTRACT(WEEK FROM r.data_date)::integer
                FROM jsonb_array_elements(COALESCE(r.raw_json->'list', r.raw_json)) as item;

            WHEN 'periodo' THEN
                -- Deletar registros existentes para essa data/bar
                DELETE FROM contahub_periodo
                WHERE bar_id = r.bar_id
                AND dt_gerencial = r.data_date;

                -- Processar periodo com chaves corretas ($vr_couvert, $vr_produtos, etc.)
                INSERT INTO contahub_periodo (
                    bar_id, dt_gerencial, tipovenda, vd_mesadesc, vd_localizacao, cht_nome,
                    cli_nome, cli_dtnasc, cli_email, cli_fone, usr_abriu, pessoas, qtd_itens,
                    vr_pagamentos, vr_produtos, vr_repique, vr_couvert, vr_desconto, motivo,
                    dt_contabil, ultimo_pedido, vd_dtcontabil, created_at, updated_at, semana
                )
                SELECT
                    r.bar_id,
                    r.data_date,
                    item->>'tipovenda',
                    item->>'vd_mesadesc',
                    item->>'vd_localizacao',
                    item->>'cht_nome',
                    item->>'cli_nome',
                    CASE WHEN item->>'cli_dtnasc' != '' THEN (item->>'cli_dtnasc')::date ELSE NULL END,
                    item->>'cli_email',
                    item->>'cli_fone',
                    item->>'usr_abriu',
                    COALESCE((item->>'pessoas')::integer, 1),
                    COALESCE((item->>'qtd_itens')::integer, 0),
                    COALESCE(NULLIF(item->>'$vr_pagamentos', '')::numeric, 0), -- ✅ CORRIGIDO: $vr_pagamentos
                    COALESCE(NULLIF(item->>'$vr_produtos', '')::numeric, 0), -- ✅ CORRIGIDO: $vr_produtos
                    COALESCE(NULLIF(item->>'$vr_repique', '')::numeric, 0), -- ✅ CORRIGIDO: $vr_repique
                    COALESCE(NULLIF(item->>'$vr_couvert', '')::numeric, 0), -- ✅ CORRIGIDO: $vr_couvert
                    COALESCE(NULLIF(item->>'$vr_desconto', '')::numeric, 0), -- ✅ CORRIGIDO: $vr_desconto
                    item->>'motivo',
                    COALESCE((item->>'dt_contabil')::date, r.data_date),
                    item->>'ultimo_pedido',
                    COALESCE((item->>'vd_dtcontabil')::date, r.data_date),
                    NOW(),
                    NOW(),
                    EXTRACT(WEEK FROM r.data_date)::integer
                FROM jsonb_array_elements(COALESCE(r.raw_json->'list', r.raw_json)) as item;

            WHEN 'tempo' THEN
                -- Deletar registros existentes para essa data/bar
                DELETE FROM contahub_tempo
                WHERE bar_id = r.bar_id
                AND DATE(t0_lancamento) = r.data_date;

                -- Processar tempo (não precisa de cifrão, mantém como estava)
                INSERT INTO contahub_tempo (
                    bar_id, grp_desc, prd_desc, vd_mesadesc, vd_localizacao, itm,
                    t0_lancamento, t1_prodini, t2_prodfim, t3_entrega,
                    t0_t1, t0_t2, t0_t3, t1_t2, t1_t3, t2_t3,
                    prd, prd_idexterno, loc_desc, usr_abriu, usr_lancou,
                    usr_produziu, usr_entregou, usr_transfcancelou, prefixo,
                    tipovenda, ano, mes, dia, dds, diadasemana, hora, itm_qtd,
                    created_at, updated_at
                )
                SELECT
                    r.bar_id,
                    item->>'grp_desc',
                    item->>'prd_desc',
                    item->>'vd_mesadesc',
                    item->>'vd_localizacao',
                    item->>'itm',
                    COALESCE((item->>'t0_lancamento')::timestamp, NOW()),
                    CASE WHEN item->>'t1_prodini' != '' THEN (item->>'t1_prodini')::timestamp ELSE NULL END,
                    CASE WHEN item->>'t2_prodfim' != '' THEN (item->>'t2_prodfim')::timestamp ELSE NULL END,
                    CASE WHEN item->>'t3_entrega' != '' THEN (item->>'t3_entrega')::timestamp ELSE NULL END,
                    COALESCE((item->>'t0-t1')::numeric, 0),
                    COALESCE((item->>'t0-t2')::numeric, 0),
                    COALESCE((item->>'t0-t3')::numeric, 0),
                    COALESCE((item->>'t1-t2')::numeric, 0),
                    COALESCE((item->>'t1-t3')::numeric, 0),
                    COALESCE((item->>'t2-t3')::numeric, 0),
                    item->>'prd',
                    item->>'prd_idexterno',
                    item->>'loc_desc',
                    item->>'usr_abriu',
                    item->>'usr_lancou',
                    item->>'usr_produziu',
                    item->>'usr_entregou',
                    item->>'usr_transfcancelou',
                    item->>'prefixo',
                    item->>'tipovenda',
                    COALESCE((item->>'ano')::integer, EXTRACT(YEAR FROM r.data_date)::integer),
                    EXTRACT(MONTH FROM r.data_date)::integer,
                    COALESCE((item->>'dia')::date, r.data_date),
                    COALESCE((item->>'dds')::integer, 0),
                    item->>'diadasemana',
                    item->>'hora',
                    COALESCE((item->>'itm_qtd')::integer, 1),
                    NOW(),
                    NOW()
                FROM jsonb_array_elements(COALESCE(r.raw_json->'list', r.raw_json)) as item;

            ELSE -- For 'analitico'
                BEGIN
                    -- Deletar registros existentes para essa data/bar
                    DELETE FROM contahub_analitico
                    WHERE bar_id = r.bar_id
                    AND DATE(trn_dtgerencial) = r.data_date;

                    -- Processar analitico com chaves corretas ($valorfinal)
                    INSERT INTO contahub_analitico (
                        bar_id, vd_mesadesc, vd_localizacao, itm, trn, trn_desc, prefixo, tipo, tipovenda,
                        ano, mes, trn_dtgerencial, usr_lancou, prd, prd_desc, grp_desc, loc_desc,
                        qtd, desconto, valorfinal, custo, itm_obs, comandaorigem, itemorigem,
                        created_at, updated_at, semana
                    )
                    SELECT
                        r.bar_id,
                        item->>'vd_mesadesc',
                        item->>'vd_localizacao',
                        item->>'itm',
                        item->>'trn',
                        item->>'trn_desc',
                        item->>'prefixo',
                        item->>'tipo',
                        item->>'tipovenda',
                        COALESCE((item->>'ano')::integer, EXTRACT(YEAR FROM r.data_date)::integer),
                        COALESCE((item->>'mes')::integer, EXTRACT(MONTH FROM r.data_date)::integer),
                        COALESCE((item->>'trn_dtgerencial')::date, r.data_date),
                        item->>'usr_lancou',
                        item->>'prd',
                        item->>'prd_desc',
                        item->>'grp_desc',
                        item->>'loc_desc',
                        COALESCE(NULLIF(item->>'qtd', '')::numeric, 0)::integer,
                        COALESCE(NULLIF(item->>'desconto', '')::numeric, 0),
                        COALESCE(NULLIF(item->>'$valorfinal', '')::numeric, 0), -- ✅ CORRIGIDO: $valorfinal
                        COALESCE(NULLIF(item->>'custo', '')::numeric, 0),
                        item->>'itm_obs',
                        item->>'comandaorigem',
                        item->>'itemorigem',
                        NOW(),
                        NOW(),
                        EXTRACT(WEEK FROM COALESCE((item->>'trn_dtgerencial')::date, r.data_date))::integer
                    FROM jsonb_array_elements(COALESCE(r.raw_json->'list', r.raw_json)) as item;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Erro ao processar analitico (ID: %): %', r.id, SQLERRM;
                END;
        END CASE;

        -- Marcar como processado
        UPDATE contahub_raw_data SET processed = TRUE, processed_at = NOW() WHERE id = r.id;

        -- Adicionar à lista de processados
        v_date := r.data_date;
        v_bar_id := r.bar_id;
        
        IF NOT (v_date = ANY(v_processed_dates)) THEN
            v_processed_dates := array_append(v_processed_dates, v_date);
        END IF;
        
        IF NOT (v_bar_id = ANY(v_processed_bars)) THEN
            v_processed_bars := array_append(v_processed_bars, v_bar_id);
        END IF;

        v_result := v_result || 'Processado: ' || r.data_type || ' para ' || r.data_date || ' (Bar: ' || r.bar_id || ')\n';
    END LOOP;

    -- Atualizar eventos para cada data/bar processado
    IF array_length(v_processed_dates, 1) > 0 THEN
        FOR i IN 1..array_length(v_processed_dates, 1) LOOP
            FOR j IN 1..array_length(v_processed_bars, 1) LOOP
                BEGIN
                    SELECT update_eventos_after_contahub_processing(v_processed_dates[i], v_processed_bars[j]) INTO v_evento_update;
                    v_result := v_result || 'Eventos atualizados: ' || v_evento_update || '\n';
                EXCEPTION
                    WHEN OTHERS THEN
                        v_result := v_result || 'Erro ao atualizar eventos para ' || v_processed_dates[i] || ': ' || SQLERRM || '\n';
                END;
            END LOOP;
        END LOOP;
    END IF;

    RETURN COALESCE(v_result, 'Nenhum registro pendente');
END;
$$;

-- Executar o processamento corrigido
SELECT process_contahub_optimized();
