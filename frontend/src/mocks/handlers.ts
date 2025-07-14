import { http, HttpResponse } from 'msw'

// Mock data
const mockUsers = [
  { id: '1', nome: 'João Silva', email: 'joao@teste.com', role: 'admin', ativo: true },
  { id: '2', nome: 'Maria Santos', email: 'maria@teste.com', role: 'funcionario', ativo: true },
  { id: '3', nome: 'Pedro Costa', email: 'pedro@teste.com', role: 'funcionario', ativo: false },
]

const mockChecklists = [
  { id: '1', nome: 'Checklist Abertura', tipo: 'abertura', ativo: true, bar_id: '1' },
  { id: '2', nome: 'Checklist Fechamento', tipo: 'fechamento', ativo: true, bar_id: '1' },
  { id: '3', nome: 'Checklist Limpeza', tipo: 'limpeza', ativo: false, bar_id: '1' },
]

const mockBars = [
  { id: '1', nome: 'Bar Teste', email: 'bar@teste.com', ativo: true, plano: 'premium' },
]

export const handlers = [
  // Auth handlers
  http.get('/api/auth/user', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        nome: 'Usuário Teste',
        role: 'admin',
        bar_id: '1',
        ativo: true
      }
    })
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: '1',
        email: 'test@example.com',
        nome: 'Usuário Teste',
        role: 'admin'
      }
    })
  }),

  // Users handlers
  http.get('/api/usuarios', () => {
    return HttpResponse.json(mockUsers)
  }),

  http.post('/api/usuarios/bulk', async ({ request }) => {
    const body = await request.json() as any
    const { action, userIds } = body

    switch (action) {
      case 'delete':
        return HttpResponse.json({
          success: true,
          results: userIds.map((id: string) => ({ id, success: true })),
          summary: { total: userIds.length, success: userIds.length, errors: 0, action }
        })
      case 'activate':
        return HttpResponse.json({
          success: true,
          results: [{ success: true, affected: userIds.length }],
          summary: { total: userIds.length, success: userIds.length, errors: 0, action }
        })
      default:
        return HttpResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }
  }),

  // Checklists handlers
  http.get('/api/checklists', () => {
    return HttpResponse.json(mockChecklists)
  }),

  http.post('/api/checklists/bulk', async ({ request }) => {
    const body = await request.json() as any
    const { action, checklistIds } = body

    switch (action) {
      case 'delete':
        return HttpResponse.json({
          success: true,
          results: checklistIds.map((id: string) => ({ id, success: true })),
          summary: { total: checklistIds.length, success: checklistIds.length, errors: 0, action }
        })
      case 'duplicate':
        return HttpResponse.json({
          success: true,
          results: checklistIds.map((id: string) => ({ 
            id, 
            success: true, 
            newId: `${id}_copy`,
            newName: `Checklist ${id} (Cópia)`
          })),
          summary: { total: checklistIds.length, success: checklistIds.length, errors: 0, action }
        })
      default:
        return HttpResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }
  }),

  // Bars handlers
  http.get('/api/bars', () => {
    return HttpResponse.json(mockBars)
  }),

  // Cache handlers
  http.get('/api/cache/metricas', () => {
    return HttpResponse.json({
      hitRate: 85.5,
      totalKeys: 150,
      memoryUsage: '2.5MB',
      uptime: '2h 15m',
      operations: {
        hits: 1250,
        misses: 200,
        sets: 180,
        deletes: 25
      }
    })
  }),

  http.post('/api/cache/invalidate', () => {
    return HttpResponse.json({ success: true, message: 'Cache invalidado' })
  }),

  // Analytics handlers
  http.get('/api/analytics/kpis', () => {
    return HttpResponse.json({
      totalUsuarios: 145,
      usuariosAtivos: 128,
      totalChecklists: 42,
      checklistsAtivos: 38,
      totalExecucoes: 1250,
      execucoesSucesso: 1180
    })
  }),

  http.get('/api/analytics/metricas', () => {
    return HttpResponse.json([
      { nome: 'Page Views', valor: 15420, tipo: 'counter', categoria: 'trafego' },
      { nome: 'API Calls', valor: 8930, tipo: 'counter', categoria: 'sistema' },
      { nome: 'Response Time', valor: 145, tipo: 'gauge', categoria: 'performance' }
    ])
  }),

  // Error simulation handlers
  http.get('/api/test/error', () => {
    return HttpResponse.json({ error: 'Erro simulado' }, { status: 500 })
  }),

  http.get('/api/test/timeout', () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({ message: 'Resposta com delay' }))
      }, 5000)
    })
  }),

  // Fallback handler for unhandled requests
  http.get('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`)
    return HttpResponse.json(
      { error: 'Endpoint não mockado', url: request.url },
      { status: 404 }
    )
  }),
] 