// Sistema RBAC (Role-Based Access Control) para Zykor
import React from 'react';
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  hierarchy: number; // 1 = mais baixo, 10 = mais alto
  isSystemRole: boolean;
}

export interface UserRole {
  userId: string;
  roleId: string;
  grantedBy: string;
  grantedAt: number;
  expiresAt?: number;
  conditions?: Record<string, any>;
}

export interface AccessContext {
  userId: string;
  userRoles: string[];
  resource: string;
  action: string;
  data?: any;
  barId?: string;
  timestamp: number;
}

// Definição de permissões do sistema Zykor
export const PERMISSIONS: Record<string, Permission> = {
  // Dashboard e Analytics
  'dashboard.view': {
    id: 'dashboard.view',
    name: 'Ver Dashboard',
    description: 'Visualizar dashboard principal',
    resource: 'dashboard',
    action: 'view'
  },
  'analytics.view': {
    id: 'analytics.view',
    name: 'Ver Analytics',
    description: 'Acessar relatórios e análises',
    resource: 'analytics',
    action: 'view'
  },
  'analytics.export': {
    id: 'analytics.export',
    name: 'Exportar Relatórios',
    description: 'Exportar dados e relatórios',
    resource: 'analytics',
    action: 'export'
  },

  // Gestão de Usuários
  'users.view': {
    id: 'users.view',
    name: 'Ver Usuários',
    description: 'Visualizar lista de usuários',
    resource: 'users',
    action: 'view'
  },
  'users.create': {
    id: 'users.create',
    name: 'Criar Usuários',
    description: 'Criar novos usuários',
    resource: 'users',
    action: 'create'
  },
  'users.edit': {
    id: 'users.edit',
    name: 'Editar Usuários',
    description: 'Modificar dados de usuários',
    resource: 'users',
    action: 'edit'
  },
  'users.delete': {
    id: 'users.delete',
    name: 'Deletar Usuários',
    description: 'Remover usuários do sistema',
    resource: 'users',
    action: 'delete'
  },

  // Gestão de Bares
  'bars.view': {
    id: 'bars.view',
    name: 'Ver Bares',
    description: 'Visualizar informações dos bares',
    resource: 'bars',
    action: 'view'
  },
  'bars.manage': {
    id: 'bars.manage',
    name: 'Gerenciar Bares',
    description: 'Gerenciar configurações dos bares',
    resource: 'bars',
    action: 'manage'
  },
  'bars.financial': {
    id: 'bars.financial',
    name: 'Dados Financeiros',
    description: 'Acessar dados financeiros dos bares',
    resource: 'bars',
    action: 'financial'
  },

  // Funcionários
  'employees.view': {
    id: 'employees.view',
    name: 'Ver Funcionários',
    description: 'Visualizar lista de funcionários',
    resource: 'employees',
    action: 'view'
  },
  'employees.manage': {
    id: 'employees.manage',
    name: 'Gerenciar Funcionários',
    description: 'Gerenciar funcionários e horários',
    resource: 'employees',
    action: 'manage'
  },
  'employees.checklist': {
    id: 'employees.checklist',
    name: 'Checklists',
    description: 'Acessar e gerenciar checklists',
    resource: 'employees',
    action: 'checklist'
  },

  // Eventos
  'events.view': {
    id: 'events.view',
    name: 'Ver Eventos',
    description: 'Visualizar eventos',
    resource: 'events',
    action: 'view'
  },
  'events.create': {
    id: 'events.create',
    name: 'Criar Eventos',
    description: 'Criar novos eventos',
    resource: 'events',
    action: 'create'
  },
  'events.manage': {
    id: 'events.manage',
    name: 'Gerenciar Eventos',
    description: 'Editar e gerenciar eventos',
    resource: 'events',
    action: 'manage'
  },

  // Integrações
  'integrations.view': {
    id: 'integrations.view',
    name: 'Ver Integrações',
    description: 'Visualizar status das integrações',
    resource: 'integrations',
    action: 'view'
  },
  'integrations.manage': {
    id: 'integrations.manage',
    name: 'Gerenciar Integrações',
    description: 'Configurar integrações (ContaHub, etc)',
    resource: 'integrations',
    action: 'manage'
  },

  // Sistema e Configurações
  'system.admin': {
    id: 'system.admin',
    name: 'Administração Sistema',
    description: 'Acesso total ao sistema',
    resource: 'system',
    action: 'admin'
  },
  'system.config': {
    id: 'system.config',
    name: 'Configurações Sistema',
    description: 'Modificar configurações do sistema',
    resource: 'system',
    action: 'config'
  },
  'system.logs': {
    id: 'system.logs',
    name: 'Ver Logs',
    description: 'Acessar logs do sistema',
    resource: 'system',
    action: 'logs'
  },

  // IA Assistant
  'ai.use': {
    id: 'ai.use',
    name: 'Usar IA Assistant',
    description: 'Interagir com o Zykor AI Assistant',
    resource: 'ai',
    action: 'use'
  },
  'ai.advanced': {
    id: 'ai.advanced',
    name: 'IA Avançada',
    description: 'Recursos avançados da IA',
    resource: 'ai',
    action: 'advanced'
  }
};

// Definição de roles do sistema
export const ROLES: Record<string, Role> = {
  'super_admin': {
    id: 'super_admin',
    name: 'Super Administrador',
    description: 'Acesso total ao sistema',
    permissions: Object.keys(PERMISSIONS),
    hierarchy: 10,
    isSystemRole: true
  },
  'admin': {
    id: 'admin',
    name: 'Administrador',
    description: 'Administrador do bar/sistema',
    permissions: [
      'dashboard.view', 'analytics.view', 'analytics.export',
      'users.view', 'users.create', 'users.edit',
      'bars.view', 'bars.manage', 'bars.financial',
      'employees.view', 'employees.manage', 'employees.checklist',
      'events.view', 'events.create', 'events.manage',
      'integrations.view', 'integrations.manage',
      'system.config', 'system.logs',
      'ai.use', 'ai.advanced'
    ],
    hierarchy: 8,
    isSystemRole: true
  },
  'manager': {
    id: 'manager',
    name: 'Gerente',
    description: 'Gerente do bar',
    permissions: [
      'dashboard.view', 'analytics.view', 'analytics.export',
      'users.view',
      'bars.view', 'bars.financial',
      'employees.view', 'employees.manage', 'employees.checklist',
      'events.view', 'events.create', 'events.manage',
      'integrations.view',
      'ai.use'
    ],
    hierarchy: 6,
    isSystemRole: true
  },
  'supervisor': {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Supervisor de operações',
    permissions: [
      'dashboard.view', 'analytics.view',
      'bars.view',
      'employees.view', 'employees.checklist',
      'events.view', 'events.manage',
      'ai.use'
    ],
    hierarchy: 4,
    isSystemRole: true
  },
  'employee': {
    id: 'employee',
    name: 'Funcionário',
    description: 'Funcionário do bar',
    permissions: [
      'dashboard.view',
      'employees.checklist',
      'events.view',
      'ai.use'
    ],
    hierarchy: 2,
    isSystemRole: true
  },
  'viewer': {
    id: 'viewer',
    name: 'Visualizador',
    description: 'Acesso apenas para visualização',
    permissions: [
      'dashboard.view',
      'analytics.view',
      'bars.view',
      'events.view'
    ],
    hierarchy: 1,
    isSystemRole: true
  }
};

export class RBACManager {
  private userRoles = new Map<string, UserRole[]>();
  private customPermissions = new Map<string, Permission>();
  private customRoles = new Map<string, Role>();

  constructor() {
    // Carregar roles e permissões customizados do banco se necessário
    this.loadCustomRolesAndPermissions();
  }

  // Verificar se usuário tem permissão
  hasPermission(context: AccessContext): boolean {
    const userPermissions = this.getUserPermissions(context.userId);
    const requiredPermission = `${context.resource}.${context.action}`;
    
    // Verificar permissão direta
    if (userPermissions.includes(requiredPermission)) {
      return this.evaluateConditions(context, requiredPermission);
    }

    // Verificar permissões administrativas
    if (userPermissions.includes('system.admin')) {
      return true;
    }

    // Verificar permissões hierárquicas
    return this.checkHierarchicalPermissions(context, userPermissions);
  }

  // Verificar se usuário tem role específico
  hasRole(userId: string, roleId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some(role => role.roleId === roleId && !this.isRoleExpired(role));
  }

  // Verificar se usuário pode acessar recurso
  canAccess(userId: string, resource: string, action: string, data?: any): boolean {
    return this.hasPermission({
      userId,
      userRoles: this.getUserRoles(userId).map(r => r.roleId),
      resource,
      action,
      data,
      timestamp: Date.now()
    });
  }

  // Obter permissões do usuário
  getUserPermissions(userId: string): string[] {
    const userRoles = this.getUserRoles(userId);
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      if (this.isRoleExpired(userRole)) continue;

      const role = this.getRole(userRole.roleId);
      if (role) {
        role.permissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  // Obter roles do usuário
  getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  // Atribuir role a usuário
  assignRole(
    userId: string, 
    roleId: string, 
    grantedBy: string, 
    expiresAt?: number,
    conditions?: Record<string, any>
  ): boolean {
    const role = this.getRole(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} não encontrado`);
    }

    // Verificar se quem está atribuindo tem permissão
    if (!this.canGrantRole(grantedBy, roleId)) {
      throw new Error('Sem permissão para atribuir este role');
    }

    const userRole: UserRole = {
      userId,
      roleId,
      grantedBy,
      grantedAt: Date.now(),
      expiresAt,
      conditions
    };

    const currentRoles = this.getUserRoles(userId);
    const existingRoleIndex = currentRoles.findIndex(r => r.roleId === roleId);

    if (existingRoleIndex >= 0) {
      // Atualizar role existente
      currentRoles[existingRoleIndex] = userRole;
    } else {
      // Adicionar novo role
      currentRoles.push(userRole);
    }

    this.userRoles.set(userId, currentRoles);
    
    console.log(`🔐 Role ${roleId} atribuído a ${userId} por ${grantedBy}`);
    return true;
  }

  // Remover role de usuário
  revokeRole(userId: string, roleId: string, revokedBy: string): boolean {
    if (!this.canRevokeRole(revokedBy, roleId)) {
      throw new Error('Sem permissão para revogar este role');
    }

    const currentRoles = this.getUserRoles(userId);
    const filteredRoles = currentRoles.filter(r => r.roleId !== roleId);

    this.userRoles.set(userId, filteredRoles);
    
    console.log(`🚫 Role ${roleId} revogado de ${userId} por ${revokedBy}`);
    return true;
  }

  // Criar permissão customizada
  createCustomPermission(permission: Permission): boolean {
    if (PERMISSIONS[permission.id]) {
      throw new Error('Permissão já existe no sistema');
    }

    this.customPermissions.set(permission.id, permission);
    console.log(`➕ Permissão customizada criada: ${permission.id}`);
    return true;
  }

  // Criar role customizado
  createCustomRole(role: Role): boolean {
    if (ROLES[role.id]) {
      throw new Error('Role já existe no sistema');
    }

    // Verificar se todas as permissões existem
    for (const permissionId of role.permissions) {
      if (!this.getPermission(permissionId)) {
        throw new Error(`Permissão ${permissionId} não encontrada`);
      }
    }

    this.customRoles.set(role.id, role);
    console.log(`➕ Role customizado criado: ${role.id}`);
    return true;
  }

  // Obter role (sistema ou customizado)
  private getRole(roleId: string): Role | undefined {
    return ROLES[roleId] || this.customRoles.get(roleId);
  }

  // Obter permissão (sistema ou customizada)
  private getPermission(permissionId: string): Permission | undefined {
    return PERMISSIONS[permissionId] || this.customPermissions.get(permissionId);
  }

  // Verificar se role está expirado
  private isRoleExpired(userRole: UserRole): boolean {
    return userRole.expiresAt ? Date.now() > userRole.expiresAt : false;
  }

  // Verificar permissões hierárquicas
  private checkHierarchicalPermissions(context: AccessContext, userPermissions: string[]): boolean {
    // Implementar lógica de hierarquia se necessário
    // Por exemplo, admin pode fazer tudo que manager faz
    return false;
  }

  // Avaliar condições da permissão
  private evaluateConditions(context: AccessContext, permissionId: string): boolean {
    const permission = this.getPermission(permissionId);
    if (!permission?.conditions) return true;

    // Implementar avaliação de condições específicas
    // Por exemplo: só pode editar próprios dados, só pode ver dados do próprio bar, etc.
    
    // Condição: próprio bar apenas
    if (permission.conditions.ownBarOnly && context.barId) {
      const userRoles = this.getUserRoles(context.userId);
      // Verificar se usuário tem acesso a este bar específico
      return userRoles.some(role => 
        role.conditions?.barId === context.barId || 
        role.roleId === 'super_admin'
      );
    }

    return true;
  }

  // Verificar se pode atribuir role
  private canGrantRole(granterId: string, roleId: string): boolean {
    const granterRoles = this.getUserRoles(granterId);
    const targetRole = this.getRole(roleId);
    
    if (!targetRole) return false;

    // Super admin pode atribuir qualquer role
    if (granterRoles.some(r => r.roleId === 'super_admin')) {
      return true;
    }

    // Admin pode atribuir roles de hierarquia menor
    const granterMaxHierarchy = Math.max(
      ...granterRoles
        .map(r => this.getRole(r.roleId)?.hierarchy || 0)
    );

    return granterMaxHierarchy > targetRole.hierarchy;
  }

  // Verificar se pode revogar role
  private canRevokeRole(revokerId: string, roleId: string): boolean {
    return this.canGrantRole(revokerId, roleId);
  }

  // Carregar roles e permissões customizados
  private async loadCustomRolesAndPermissions(): Promise<void> {
    // Implementar carregamento do banco de dados se necessário
    // Por enquanto, usar apenas os roles e permissões padrão
  }

  // Obter estatísticas RBAC
  getRBACStats(): {
    totalUsers: number;
    roleDistribution: Record<string, number>;
    permissionUsage: Record<string, number>;
  } {
    const roleDistribution: Record<string, number> = {};
    const permissionUsage: Record<string, number> = {};
    let totalUsers = 0;

    for (const userRoles of this.userRoles.values()) {
      totalUsers++;
      
      for (const userRole of userRoles) {
        if (this.isRoleExpired(userRole)) continue;
        
        // Contar distribuição de roles
        roleDistribution[userRole.roleId] = (roleDistribution[userRole.roleId] || 0) + 1;
        
        // Contar uso de permissões
        const role = this.getRole(userRole.roleId);
        if (role) {
          role.permissions.forEach(permission => {
            permissionUsage[permission] = (permissionUsage[permission] || 0) + 1;
          });
        }
      }
    }

    return {
      totalUsers,
      roleDistribution,
      permissionUsage
    };
  }

  // Middleware para verificação de permissões
  createPermissionMiddleware(resource: string, action: string) {
    return (userId: string, data?: any) => {
      return this.canAccess(userId, resource, action, data);
    };
  }
}

// Instância global
export const rbacManager = new RBACManager();

// Hooks para React
export const useRBAC = () => {
  return {
    hasPermission: (resource: string, action: string, data?: any) => {
      // Implementar com contexto do usuário atual
      return rbacManager.canAccess('current-user-id', resource, action, data);
    },
    hasRole: (roleId: string) => {
      return rbacManager.hasRole('current-user-id', roleId);
    },
    getUserPermissions: () => {
      return rbacManager.getUserPermissions('current-user-id');
    },
    getUserRoles: () => {
      return rbacManager.getUserRoles('current-user-id');
    },
    canAccess: rbacManager.canAccess.bind(rbacManager)
  };
};

// Hook já definido acima - remover duplicata

// Componente HOC para proteção de rotas
export const withPermission = (resource: string, action: string) => {
  return (Component: React.ComponentType) => {
    return function ProtectedComponent(props: any) {
      const { hasPermission } = useRBAC();
      
      if (!hasPermission(resource, action)) {
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar este recurso.
            </p>
          </div>
        );
      }
      
      return <Component {...props} />;
    };
  };
};
