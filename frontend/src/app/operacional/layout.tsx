'use client';

// Layout para operacional com proteção de módulo
import { createProtectedDashboardLayout } from '@/components/layouts';

export default createProtectedDashboardLayout({ requiredModule: 'operacoes' });
