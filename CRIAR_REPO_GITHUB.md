# Como criar repositório no GitHub e fazer push

## 1. Criar conta no GitHub (se não tiver)
Acesse: https://github.com e crie uma conta gratuita

## 2. Criar novo repositório
1. Faça login no GitHub
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Configure:
   - Repository name: `sgb-v2` (ou outro nome)
   - Description: "Sistema de Gestão de Bares V2"
   - **NÃO** marque "Initialize this repository with a README"
   - Clique em **"Create repository"**

## 3. Copie a URL do repositório
Após criar, você verá uma página com comandos. 
A URL será algo como: `https://github.com/SEU-USUARIO/sgb-v2.git`

## 4. No terminal, execute estes comandos:

```bash
# Configurar seu nome e email (primeira vez apenas)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@example.com"

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Primeiro commit - Sistema SGB V2"

# Adicionar o GitHub como repositório remoto
git remote add origin https://github.com/SEU-USUARIO/sgb-v2.git

# Enviar para o GitHub
git push -u origin main
```

## 5. Se pedir usuário e senha:
- Username: seu usuário do GitHub
- Password: você precisa criar um **Personal Access Token**:
  1. Vá em GitHub → Settings → Developer settings → Personal access tokens
  2. Generate new token (classic)
  3. Dê um nome e marque "repo"
  4. Copie o token e use como senha

## 6. Volte ao Netlify
Agora você pode importar do GitHub! 