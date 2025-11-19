/**
 * Script para criar usuário Isaias com acesso apenas à produção
 * 
 * USO:
 * node exemplo_teste/criar-usuario-isaias.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function criarUsuarioIsaias() {
  console.log('🚀 Criando usuário Isaias...\n');
  console.log('📡 API:', API_BASE_URL);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/configuracoes/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'isaias@ordinario.bar',
        nome: 'Isaías',
        role: 'producao',
        bar_id: 3,
        ativo: true,
        modulos_permitidos: {
          producao: { leitura: true, escrita: true, exclusao: false },
          insumos: { leitura: true, escrita: true, exclusao: false },
          receitas: { leitura: true, escrita: false, exclusao: false },
          terminal: { leitura: true, escrita: true, exclusao: false }
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao criar usuário:', result.error);
      console.error('   Status:', response.status);
      return;
    }

    console.log('✅ Usuário Isaias criado com sucesso!\n');
    console.log('📧 Email:', result.usuario.email);
    console.log('👤 Nome:', result.usuario.nome);
    console.log('🎭 Role:', result.usuario.role);
    console.log('🔑 Senha temporária: TempPassword123!');
    console.log('\n⚠️  IMPORTANTE: O usuário deve alterar a senha no primeiro login!');
    
    if (result.email_sent) {
      console.log('📨 Email de boas-vindas enviado!');
    } else {
      console.log('⚠️  Email de boas-vindas NÃO foi enviado - informe as credenciais manualmente');
    }

    console.log('\n📊 Permissões:');
    console.log('  ✅ Produção e Insumos (leitura + escrita)');
    console.log('  ✅ Receitas (apenas leitura)');
    console.log('  ✅ Terminal de Produção (leitura + escrita)');
    console.log('  ❌ Configurações (bloqueado)');
    console.log('  ❌ Usuários (bloqueado)');
    console.log('  ❌ Financeiro (bloqueado)');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

// Executar
criarUsuarioIsaias();

