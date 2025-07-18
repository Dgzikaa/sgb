// Utilitários de validação centralizados

import { z } from 'zod';
import { LIMITS } from './constants';

// Schemas de validação
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Email inválido'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(LIMITS.MAX_TITLE_LENGTH),
  role: z.string().min(1, 'Role é obrigatório'),
  modulos_permitidos: z.array(z.string()),
  bar_id: z.string().uuid(),
  ativo: z.boolean(),
});

export const checklistSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(1, 'Título é obrigatório').max(LIMITS.MAX_TITLE_LENGTH),
  descricao: z.string().max(LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
  bar_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'atrasado']),
  data_limite: z.string().datetime().optional(),
  data_conclusao: z.string().datetime().optional(),
  score: z.number().min(0).max(100).optional(),
});

export const checklistItemSchema = z.object({
  id: z.string().uuid(),
  checklist_id: z.string().uuid(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['texto', 'numero', 'boolean', 'select', 'multiselect']),
  obrigatorio: z.boolean(),
  ordem: z.number().min(0),
  opcoes: z.array(z.string()).optional(),
  resposta: z.string().optional(),
  observacao: z.string().optional(),
});

export const eventSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(1, 'Título é obrigatório').max(LIMITS.MAX_TITLE_LENGTH),
  descricao: z.string().max(LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
  bar_id: z.string().uuid(),
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime().optional(),
  tipo: z.enum(['evento', 'promocao', 'feriado']),
  status: z.enum(['ativo', 'inativo', 'cancelado']),
});

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string().min(1, 'Título é obrigatório').max(LIMITS.MAX_TITLE_LENGTH),
  mensagem: z.string().min(1, 'Mensagem é obrigatória'),
  tipo: z.enum(['info', 'success', 'warning', 'error']),
  lida: z.boolean(),
  data_envio: z.string().datetime(),
  data_leitura: z.string().datetime().optional(),
});

// Funções de validação
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  );
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return (
    parseInt(cleanCNPJ.charAt(12)) === digit1 &&
    parseInt(cleanCNPJ.charAt(13)) === digit2
  );
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateFileSize = (file: File, maxSize: number = LIMITS.MAX_FILE_SIZE): boolean => {
  return file.size <= maxSize;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Funções de sanitização
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const sanitizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const sanitizeCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

// Funções de formatação para validação
export const formatCPF = (cpf: string): string => {
  const clean = sanitizeCPF(cpf);
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const clean = sanitizeCNPJ(cnpj);
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatPhone = (phone: string): string => {
  const clean = sanitizePhone(phone);
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}; 