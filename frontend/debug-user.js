// Script de debug para verificar dados do usuário
console.log('=== DEBUG USUÁRIO ===');

// Verificar localStorage
const userData = localStorage.getItem('sgb_user');
console.log('1. Dados brutos do localStorage:', userData);

if (userData) {
  try {
    const parsedUser = JSON.parse(userData);
    console.log('2. Dados parseados:', parsedUser);
    console.log('3. Tem ID?', !!parsedUser.id);
    console.log('4. Tem email?', !!parsedUser.email);
    console.log('5. Tem modulos_permitidos?', !!parsedUser.modulos_permitidos);
    console.log('6. Role:', parsedUser.role);
    console.log('7. Ativo?', parsedUser.ativo);
    console.log('8. Módulos permitidos:', parsedUser.modulos_permitidos);
  } catch (error) {
    console.error('Erro ao parsear dados do usuário:', error);
  }
} else {
  console.log('2. Nenhum dado encontrado no localStorage');
}

// Verificar se está na página correta
console.log('9. URL atual:', window.location.href);
console.log('10. Pathname:', window.location.pathname);

// Verificar se isClient está funcionando
console.log('11. typeof window:', typeof window);
console.log('12. window existe?', typeof window !== 'undefined');
