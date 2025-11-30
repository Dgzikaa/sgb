'use client';

// Layout para analítico com proteção de role admin
import { createProtectedDashboardLayout } from '@/components/layouts';

export default createProtectedDashboardLayout({ requiredRole: 'admin' });
