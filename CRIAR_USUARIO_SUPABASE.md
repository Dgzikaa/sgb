# Como criar usuário de teste no Supabase

## 1. Acesse o painel do Supabase
https://supabase.com/dashboard/project/msfzwfudjwjkcweemcxp

## 2. Vá para Authentication
No menu lateral, clique em **Authentication** → **Users**

## 3. Crie um novo usuário
1. Clique em **"Add user"** → **"Create new user"**
2. Preencha:
   - Email: `teste@sgbsistema.com`
   - Password: `teste123`
   - ✅ Marque "Auto Confirm Email"
3. Clique em **"Create user"**

## 4. Copie o User ID
Após criar, copie o ID do usuário (UUID)

## 5. Execute este SQL no SQL Editor
Vá em **SQL Editor** e execute:

```sql
-- Substituir 'UUID_DO_USUARIO_AQUI' pelo ID copiado acima
INSERT INTO usuarios_bar (
  user_id,
  bar_id,
  email,
  nome,
  role,
  ativo,
  senha_redefinida,
  modulos_permitidos
) VALUES (
  'UUID_DO_USUARIO_AQUI',
  1,
  'teste@sgbsistema.com',
  'Usuário Teste',
  'admin',
  true,
  true,
  ARRAY['todos']
) ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  ativo = true,
  senha_redefinida = true;

-- Verificar se o bar existe
INSERT INTO bars (id, nome, ativo) 
VALUES (1, 'Bar Teste', true) 
ON CONFLICT (id) DO NOTHING;
```

## 6. Teste o login
Use as credenciais:
- Email: `teste@sgbsistema.com`
- Senha: `teste123` 