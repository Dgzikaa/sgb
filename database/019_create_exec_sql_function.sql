-- ========================================
-- CREATE EXEC_SQL FUNCTION
-- ========================================
-- This function allows executing arbitrary SQL statements from the application
-- Required for dynamic table creation and DDL operations

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Execute the provided SQL
    EXECUTE sql;
END;
$$;

-- Grant permission to authenticated users to use this function
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Create the execute_sql function as an alias (some code might use this variant)
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Execute the provided SQL
    EXECUTE sql;
END;
$$;

-- Grant permission to authenticated users to use this function
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.exec_sql(text) IS 'Allows executing arbitrary SQL statements for dynamic table creation and DDL operations';
COMMENT ON FUNCTION public.execute_sql(text) IS 'Alias for exec_sql function - allows executing arbitrary SQL statements'; 