/**
 * Utilitários para normalização de emails
 * 
 * SEMPRE use estas funções ao trabalhar com emails para garantir consistência
 */

/**
 * Normaliza um email para formato padrão (lowercase + trim)
 * @param email - Email a ser normalizado
 * @returns Email normalizado
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Valida formato de email (básico)
 * @param email - Email a ser validado
 * @returns true se email é válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalizeEmail(email));
}

/**
 * Compara dois emails ignorando case e espaços
 * @param email1 - Primeiro email
 * @param email2 - Segundo email
 * @returns true se emails são iguais (case-insensitive)
 */
export function emailsAreEqual(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2);
}

