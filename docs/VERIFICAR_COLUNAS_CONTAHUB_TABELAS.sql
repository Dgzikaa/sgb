-- VERIFICAR COLUNAS DAS TABELAS CONTAHUB
-- Execute este SQL no Supabase SQL Editor:

-- 1. Verificar colunas da contahub_pagamentos
SELECT 'contahub_pagamentos' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contahub_pagamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar colunas da contahub_periodo  
SELECT 'contahub_periodo' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contahub_periodo' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver alguns dados para entender a estrutura
SELECT 'SAMPLE contahub_pagamentos' as info, * FROM contahub_pagamentos 
WHERE bar_id = 3 
ORDER BY created_at DESC 
LIMIT 2;

SELECT 'SAMPLE contahub_periodo' as info, * FROM contahub_periodo 
WHERE bar_id = 3 
ORDER BY created_at DESC 
LIMIT 2;
