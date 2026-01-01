/**
 * Dashboard Service
 * Serviço para buscar dados agregados do dashboard
 */

import api, { extractData } from '../utils/api';

export interface DashboardStats {
  contacts: {
    total: number;
    change: number; // percentual de mudança
  };
  deals: {
    active: number;
    value: number;
    change: number;
  };
  tickets: {
    open: number;
    pending: number;
    change: number;
  };
  revenue: {
    monthly: number;
    change: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'contact' | 'deal' | 'ticket' | 'task';
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface PendingTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  pendingTasks: PendingTask[];
  dealsChart: ChartData[];
  revenueChart: ChartData[];
}

/**
 * Busca todos os dados do dashboard
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await api.get('/dashboard');
    return extractData(response);
  } catch (error) {
    // Fallback para dados mock em caso de erro (desenvolvimento)
    console.warn('Using mock dashboard data');
    return getMockDashboardData();
  }
};

/**
 * Atualiza status de uma tarefa
 */
export const updateTaskStatus = async (taskId: string, completed: boolean): Promise<void> => {
  await api.patch(`/tasks/${taskId}`, { completed });
};

/**
 * Dados mock para desenvolvimento
 */
function getMockDashboardData(): DashboardData {
  return {
    stats: {
      contacts: {
        total: 1234,
        change: 12.5,
      },
      deals: {
        active: 56,
        value: 450000,
        change: 8.2,
      },
      tickets: {
        open: 23,
        pending: 15,
        change: -5.3,
      },
      revenue: {
        monthly: 45000,
        change: 15.8,
      },
    },
    recentActivities: [
      {
        id: '1',
        type: 'contact',
        title: 'Novo contato criado',
        description: 'João Silva adicionado ao CRM',
        user: { name: 'Maria Santos' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
      },
      {
        id: '2',
        type: 'deal',
        title: 'Deal atualizado',
        description: 'Proposta enviada para Cliente ABC',
        user: { name: 'Carlos Oliveira' },
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5h atrás
      },
      {
        id: '3',
        type: 'ticket',
        title: 'Ticket resolvido',
        description: 'Problema de integração corrigido',
        user: { name: 'Ana Costa' },
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h atrás
      },
      {
        id: '4',
        type: 'task',
        title: 'Tarefa completada',
        description: 'Relatório mensal finalizado',
        user: { name: 'Pedro Alves' },
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h atrás
      },
    ],
    pendingTasks: [
      {
        id: '1',
        title: 'Follow-up com Cliente XYZ',
        description: 'Enviar proposta comercial atualizada',
        priority: 'high',
        dueDate: new Date().toISOString(),
        completed: false,
      },
      {
        id: '2',
        title: 'Revisar contrato',
        description: 'Análise jurídica do novo contrato',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // amanhã
        completed: false,
      },
      {
        id: '3',
        title: 'Preparar apresentação',
        description: 'Slides para reunião de vendas',
        priority: 'high',
        dueDate: new Date().toISOString(),
        completed: false,
      },
      {
        id: '4',
        title: 'Atualizar documentação',
        description: 'Manuais de processo interno',
        priority: 'low',
        dueDate: new Date(Date.now() + 172800000).toISOString(), // 2 dias
        completed: false,
      },
    ],
    dealsChart: [
      { name: 'Jan', value: 42 },
      { name: 'Fev', value: 48 },
      { name: 'Mar', value: 51 },
      { name: 'Abr', value: 45 },
      { name: 'Mai', value: 52 },
      { name: 'Jun', value: 56 },
    ],
    revenueChart: [
      { name: 'Jan', value: 32000 },
      { name: 'Fev', value: 35000 },
      { name: 'Mar', value: 38000 },
      { name: 'Abr', value: 36000 },
      { name: 'Mai', value: 42000 },
      { name: 'Jun', value: 45000 },
    ],
  };
}
