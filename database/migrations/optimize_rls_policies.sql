-- ===============================================
-- OTIMIZAÇÃO DE POLÍTICAS RLS 
-- ===============================================
-- Este script otimiza as políticas RLS substituindo auth.uid() por (select auth.uid())
-- para evitar re-avaliação desnecessária por linha

-- ===============================================
-- EXEMPLOS DE OTIMIZAÇÃO RLS
-- ===============================================

-- ANTES (LENTO):
-- CREATE POLICY "policy_name" ON table_name FOR SELECT 
-- USING (bar_id IN (
--   SELECT bar_id FROM usuarios_bar WHERE user_id = auth.uid()
-- ));

-- DEPOIS (RÁPIDO):
-- CREATE POLICY "policy_name" ON table_name FOR SELECT 
-- USING (bar_id IN (
--   SELECT bar_id FROM usuarios_bar WHERE user_id = (select auth.uid())
-- ));

-- ===============================================
-- SCRIPT PARA OTIMIZAR TODAS AS POLÍTICAS
-- ===============================================

-- Este é um exemplo para uma tabela. Repetir para todas as 61 políticas identificadas.

-- 1. security_events
DROP POLICY IF EXISTS "Admins can manage events from their bar" ON public.security_events;
CREATE POLICY "Admins can manage events from their bar" ON public.security_events 
FOR ALL 
TO authenticated 
USING (
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid()) 
        AND ub.is_admin = true
    )
);

DROP POLICY IF EXISTS "Users can view events from their bar" ON public.security_events;
CREATE POLICY "Users can view events from their bar" ON public.security_events 
FOR SELECT 
TO authenticated 
USING (
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid())
    )
);

-- 2. audit_trail
DROP POLICY IF EXISTS "Admins can view detailed audit trail" ON public.audit_trail;
CREATE POLICY "Admins can view detailed audit trail" ON public.audit_trail 
FOR SELECT 
TO authenticated 
USING (
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid()) 
        AND ub.is_admin = true
    )
);

DROP POLICY IF EXISTS "Users can view audit trail from their bar" ON public.audit_trail;
CREATE POLICY "Users can view audit trail from their bar" ON public.audit_trail 
FOR SELECT 
TO authenticated 
USING (
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid())
    )
);

-- 3. usuarios_bar
DROP POLICY IF EXISTS "Users can see their own records" ON public.usuarios_bar;
CREATE POLICY "Users can see their own records" ON public.usuarios_bar 
FOR SELECT 
TO authenticated 
USING (user_id = (select auth.uid()));

-- 4. api_credentials
DROP POLICY IF EXISTS "Users can only see credentials for their bars" ON public.api_credentials;
CREATE POLICY "Users can only see credentials for their bars" ON public.api_credentials 
FOR ALL 
TO authenticated 
USING (
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid())
    )
);

-- 5. whatsapp_messages
DROP POLICY IF EXISTS "Users can insert their own WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can insert their own WhatsApp messages" ON public.whatsapp_messages 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can view their own WhatsApp messages" ON public.whatsapp_messages 
FOR SELECT 
TO authenticated 
USING (user_id = (select auth.uid()));

-- ===============================================
-- TEMPLATE PARA DEMAIS POLÍTICAS
-- ===============================================

-- Para cada política identificada nos logs, seguir o padrão:
-- 1. DROP POLICY IF EXISTS "nome_da_politica" ON tabela;
-- 2. CREATE POLICY "nome_da_politica" ON tabela 
--    FOR operacao 
--    TO role 
--    USING/WITH CHECK (condição com (select auth.uid()));

-- ===============================================
-- CONSOLIDAÇÃO DE POLÍTICAS MÚLTIPLAS
-- ===============================================

-- Exemplo para api_credentials (que tem múltiplas políticas permissivas):
DROP POLICY IF EXISTS "Users can only see credentials for their bars" ON public.api_credentials;
DROP POLICY IF EXISTS "api_credentials_admin_access" ON public.api_credentials;

-- Criar uma única política consolidada
CREATE POLICY "api_credentials_unified_access" ON public.api_credentials 
FOR ALL 
TO authenticated 
USING (
    -- Usuários podem ver/editar credenciais de seus bares
    bar_id IN (
        SELECT ub.bar_id 
        FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid())
    )
    OR
    -- Admins têm acesso total
    EXISTS (
        SELECT 1 FROM usuarios_bar ub 
        WHERE ub.user_id = (select auth.uid()) 
        AND ub.is_admin = true
    )
);

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar políticas restantes que precisam de otimização
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
ORDER BY tablename, policyname;
