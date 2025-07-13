-- ============================================
-- 🔥 TRIGGER AUTOMÁTICO CONTAAZUL - SGB V2
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. CRIAR FUNÇÃO QUE PROCESSA DADOS BRUTOS
CREATE OR REPLACE FUNCTION processar_dados_brutos_contaazul()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    item JSONB;
    dados_evento JSONB;
    evento_id TEXT;
    valor_numerico DECIMAL;
    data_evento DATE;
BEGIN
    -- Verificar se já foi processado
    IF NEW.processado = true THEN
        RETURN NEW;
    END IF;

    -- Log de início
    RAISE NOTICE 'Processando dados brutos ID: %, Bar: %, Tipo: %', NEW.id, NEW.bar_id, NEW.tipo;

    -- Processar cada item do JSON
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.dados_json)
    LOOP
        BEGIN
            -- Extrair dados principais
            evento_id := COALESCE(item->>'id', item->>'codigo', 'temp_' || generate_random_uuid()::text);
            
            -- Processar valor
            valor_numerico := CASE 
                WHEN item->>'valor' IS NOT NULL THEN (item->>'valor')::decimal
                WHEN item->>'valor_total' IS NOT NULL THEN (item->>'valor_total')::decimal
                WHEN item->>'amount' IS NOT NULL THEN (item->>'amount')::decimal
                ELSE 0
            END;

            -- Processar data
            data_evento := CASE 
                WHEN item->>'data_vencimento' IS NOT NULL THEN (item->>'data_vencimento')::date
                WHEN item->>'data_emissao' IS NOT NULL THEN (item->>'data_emissao')::date
                WHEN item->>'created_at' IS NOT NULL THEN (item->>'created_at')::date
                ELSE CURRENT_DATE
            END;

            -- Montar dados do evento para inserção
            dados_evento := jsonb_build_object(
                'bar_id', NEW.bar_id,
                'evento_id', evento_id,
                'tipo', CASE 
                    WHEN NEW.tipo = 'receitas' THEN 'receita'
                    WHEN NEW.tipo = 'despesas' THEN 'despesa'
                    ELSE 'indefinido'
                END,
                'categoria_id', NEW.categoria_id,
                'descricao', COALESCE(item->>'descricao', item->>'nome', item->>'title', 'Sem descrição'),
                'valor', valor_numerico,
                'data_evento', data_evento,
                'dados_originais', item,
                'fonte', 'contaazul_api',
                'processado_em', NOW(),
                'sync_origem', 'dados_brutos_trigger'
            );

            -- Inserir evento financeiro
            INSERT INTO contaazul_eventos_financeiros (
                bar_id,
                evento_id,
                tipo,
                categoria_id,
                descricao,
                valor,
                data_evento,
                dados_originais,
                fonte,
                processado_em,
                sync_origem,
                criado_em,
                atualizado_em
            ) VALUES (
                (dados_evento->>'bar_id')::integer,
                dados_evento->>'evento_id',
                dados_evento->>'tipo',
                (dados_evento->>'categoria_id')::integer,
                dados_evento->>'descricao',
                (dados_evento->>'valor')::decimal,
                (dados_evento->>'data_evento')::date,
                dados_evento->'dados_originais',
                dados_evento->>'fonte',
                NOW(),
                dados_evento->>'sync_origem',
                NOW(),
                NOW()
            )
            ON CONFLICT (bar_id, evento_id) DO UPDATE SET
                descricao = EXCLUDED.descricao,
                valor = EXCLUDED.valor,
                data_evento = EXCLUDED.data_evento,
                dados_originais = EXCLUDED.dados_originais,
                atualizado_em = NOW();

        EXCEPTION WHEN OTHERS THEN
            -- Log do erro mas continua processando
            RAISE WARNING 'Erro ao processar item do dados brutos ID %: %', NEW.id, SQLERRM;
            CONTINUE;
        END;
    END LOOP;

    -- Marcar como processado
    UPDATE contaazul_dados_brutos 
    SET 
        processado = true,
        processado_em = NOW(),
        total_processados = jsonb_array_length(NEW.dados_json)
    WHERE id = NEW.id;

    RAISE NOTICE 'Dados brutos ID % processados com sucesso', NEW.id;
    
    RETURN NEW;
END;
$$;

-- 2. CRIAR TRIGGER QUE EXECUTA APÓS INSERT
DROP TRIGGER IF EXISTS trigger_processar_dados_brutos_contaazul ON contaazul_dados_brutos;

CREATE TRIGGER trigger_processar_dados_brutos_contaazul
    AFTER INSERT ON contaazul_dados_brutos
    FOR EACH ROW
    EXECUTE FUNCTION processar_dados_brutos_contaazul();

-- 3. VERIFICAR SE AS TABELAS EXISTEM E CRIAR SE NECESSÁRIO

-- Tabela de dados brutos (se não existir)
CREATE TABLE IF NOT EXISTS contaazul_dados_brutos (
    id BIGSERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- 'receitas' ou 'despesas'
    categoria_id INTEGER,
    pagina INTEGER DEFAULT 1,
    dados_json JSONB NOT NULL,
    total_registros INTEGER DEFAULT 0,
    processado BOOLEAN DEFAULT FALSE,
    processado_em TIMESTAMP WITH TIME ZONE,
    total_processados INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT uk_dados_brutos_bar_tipo_categoria_pagina 
        UNIQUE(bar_id, tipo, categoria_id, pagina)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_dados_brutos_processado ON contaazul_dados_brutos(processado);
CREATE INDEX IF NOT EXISTS idx_dados_brutos_bar_id ON contaazul_dados_brutos(bar_id);
CREATE INDEX IF NOT EXISTS idx_dados_brutos_tipo ON contaazul_dados_brutos(tipo);

-- Tabela de eventos financeiros (se não existir)
CREATE TABLE IF NOT EXISTS contaazul_eventos_financeiros (
    id BIGSERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    evento_id TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'receita' ou 'despesa'
    categoria_id INTEGER,
    descricao TEXT,
    valor DECIMAL(15,2) DEFAULT 0,
    data_evento DATE,
    dados_originais JSONB,
    fonte TEXT DEFAULT 'contaazul_api',
    processado_em TIMESTAMP WITH TIME ZONE,
    sync_origem TEXT DEFAULT 'manual',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicatas
    CONSTRAINT uk_eventos_bar_evento UNIQUE(bar_id, evento_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_eventos_bar_id ON contaazul_eventos_financeiros(bar_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON contaazul_eventos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON contaazul_eventos_financeiros(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_valor ON contaazul_eventos_financeiros(valor);

-- 4. TESTAR O TRIGGER
/*
-- Para testar, insira dados de exemplo:
INSERT INTO contaazul_dados_brutos (bar_id, tipo, categoria_id, pagina, dados_json) VALUES 
(1, 'receitas', 123, 1, '[
    {
        "id": "teste_001",
        "descricao": "Venda Teste",
        "valor": "150.50",
        "data_vencimento": "2024-01-15"
    },
    {
        "id": "teste_002", 
        "descricao": "Outra Venda",
        "valor_total": "200.00",
        "data_emissao": "2024-01-16"
    }
]');

-- Verificar se processou:
SELECT * FROM contaazul_dados_brutos WHERE bar_id = 1;
SELECT * FROM contaazul_eventos_financeiros WHERE bar_id = 1;
*/

-- ============================================
-- 📊 VERIFICAÇÕES E MONITORAMENTO
-- ============================================

-- Ver dados não processados
SELECT 
    id, bar_id, tipo, categoria_id, total_registros, 
    processado, criado_em
FROM contaazul_dados_brutos 
WHERE processado = false 
ORDER BY criado_em DESC;

-- Ver últimos eventos processados
SELECT 
    bar_id, evento_id, tipo, descricao, valor, 
    data_evento, sync_origem, processado_em
FROM contaazul_eventos_financeiros 
ORDER BY processado_em DESC 
LIMIT 10;

-- Estatísticas de processamento
SELECT 
    bar_id,
    tipo,
    COUNT(*) as total_lotes,
    SUM(total_registros) as total_registros,
    SUM(total_processados) as total_processados,
    COUNT(CASE WHEN processado THEN 1 END) as lotes_processados,
    COUNT(CASE WHEN NOT processado THEN 1 END) as lotes_pendentes
FROM contaazul_dados_brutos 
GROUP BY bar_id, tipo
ORDER BY bar_id, tipo;

-- ============================================
-- 🧪 COMANDOS DE TESTE E DEBUG
-- ============================================

/*
-- Forçar reprocessamento de um lote específico:
UPDATE contaazul_dados_brutos 
SET processado = false, processado_em = null, total_processados = 0 
WHERE id = 123;

-- Limpar dados de teste:
DELETE FROM contaazul_eventos_financeiros WHERE bar_id = 1 AND sync_origem = 'dados_brutos_trigger';
DELETE FROM contaazul_dados_brutos WHERE bar_id = 1;

-- Ver logs do trigger (se suportado):
-- Os logs aparecerão nos logs do PostgreSQL
*/

-- ============================================
-- ✅ RESULTADO ESPERADO
-- ============================================

/*
🎯 NOVA ARQUITETURA IMPLEMENTADA:

1. pgcron executa de 4 em 4 horas
2. Edge function chama API sync-dados-brutos  
3. API salva dados JSON na tabela contaazul_dados_brutos
4. TRIGGER processa automaticamente e insere em contaazul_eventos_financeiros
5. Notificações Discord sobre o progresso

📈 BENEFÍCIOS:
- Processamento em background automático
- Tolerante a falhas (continua mesmo com erros)
- Logs detalhados para debug
- Evita duplicatas
- Performance otimizada com índices

🔧 MONITORAMENTO:
- Execute as queries de verificação acima
- Monitore os logs do PostgreSQL
- Acompanhe via interface de pgcron
*/ 