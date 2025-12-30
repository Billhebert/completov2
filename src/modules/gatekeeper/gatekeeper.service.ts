import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { logger } from '@core/logger';

const prisma = new PrismaClient();

export type GatekeeperDecision = 'EXECUTE' | 'SUGGEST' | 'LOG_ONLY' | 'BLOCK';

export interface GatekeeperContext {
  userId: string;
  companyId: string;
  action: string;
  context: any;
}

export interface GatekeeperResult {
  decision: GatekeeperDecision;
  reason: string;
  metadata?: any;
}

/**
 * GatekeeperService - Orquestra atenção e autonomia
 *
 * Hierarquia de políticas:
 * 1. Company Policy (obrigatória)
 * 2. User Profile (preferências)
 * 3. Context (quiet hours, urgência, VIP)
 * 4. Anti-spam (score de atenção)
 */
export class GatekeeperService {
  /**
   * Decide se uma ação deve ser executada, sugerida, logada ou bloqueada
   */
  async shouldExecute(params: GatekeeperContext): Promise<GatekeeperResult> {
    const { userId, companyId, action, context } = params;

    try {
      // 1. Carregar políticas e perfis
      const [companyPolicy, userProfile, user] = await Promise.all([
        this.getCompanyPolicy(companyId),
        this.getAttentionProfile(userId),
        this.getUser(userId)
      ]);

      // Check if user exists
      if (!user) {
        return { decision: 'BLOCK', reason: 'User not found' };
      }

      // 2. Verificar ações proibidas (nível empresa)
      const forbiddenCheck = this.checkForbidden(action, companyPolicy);
      if (forbiddenCheck.blocked) {
        await this.log(companyId, userId, action, 'BLOCK', forbiddenCheck.reason, context);
        return { decision: 'BLOCK', reason: forbiddenCheck.reason };
      }

      // 3. Verificar VIP (tem prioridade máxima sobre todas as restrições, exceto BLOCK da empresa)
      const isVIP = this.checkIfVIP(context, userProfile);
      if (isVIP) {
        await this.log(companyId, userId, action, 'EXECUTE', 'VIP context - bypassing restrictions', context);
        return { decision: 'EXECUTE', reason: 'VIP context allows execution' };
      }

      // 4. Verificar autonomia máxima por role
      const roleCheck = this.checkRoleAutonomy(action, user.role, companyPolicy);
      if (roleCheck.decision === 'BLOCK') {
        await this.log(companyId, userId, action, 'BLOCK', roleCheck.reason, context);
        return { decision: 'BLOCK', reason: roleCheck.reason };
      }

      // 5. Verificar quiet hours (tem precedência sobre role SUGGEST e preferências do usuário)
      if (this.isInQuietHours(userProfile)) {
        await this.log(companyId, userId, action, 'SUGGEST', 'User is in quiet hours', context);
        return { decision: 'SUGGEST', reason: 'User is in quiet hours' };
      }

      // 6. Verificar preferências do usuário (pode ser mais restritivo que role)
      const userCheck = this.checkUserAutonomy(action, userProfile);

      // Usuário pode ser mais restritivo que role (BLOCK > SUGGEST > LOG_ONLY > EXECUTE)
      if (userCheck.decision === 'BLOCK') {
        await this.log(companyId, userId, action, 'BLOCK', userCheck.reason, context);
        return { decision: 'BLOCK', reason: userCheck.reason };
      }

      if (userCheck.decision === 'SUGGEST' && roleCheck.decision === 'EXECUTE') {
        await this.log(companyId, userId, action, 'SUGGEST', userCheck.reason, context);
        return { decision: 'SUGGEST', reason: userCheck.reason };
      }

      if (userCheck.decision === 'LOG_ONLY') {
        await this.log(companyId, userId, action, 'LOG_ONLY', userCheck.reason, context);
        return { decision: 'LOG_ONLY', reason: userCheck.reason };
      }

      // Se role exige SUGGEST, usar isso (role tem precedência sobre preferências mais permissivas)
      if (roleCheck.decision === 'SUGGEST') {
        await this.log(companyId, userId, action, 'SUGGEST', roleCheck.reason, context);
        return { decision: 'SUGGEST', reason: roleCheck.reason };
      }

      // 6. Score de atenção (anti-spam)
      const attentionScore = await this.calculateAttentionScore(userId, action);
      if (attentionScore < 0.3) {
        await this.log(companyId, userId, action, 'LOG_ONLY', 'Low attention score (spam prevention)', context);
        return { decision: 'LOG_ONLY', reason: 'Low attention score - spam prevention' };
      }

      // 7. Verificar canais permitidos (para notificações)
      if (action.includes('notification') || action.includes('send')) {
        const channelAllowed = this.checkChannelAllowed(action, userProfile);
        if (!channelAllowed) {
          await this.log(companyId, userId, action, 'LOG_ONLY', 'Channel not allowed by user', context);
          return { decision: 'LOG_ONLY', reason: 'Channel not allowed by user preferences' };
        }
      }

      // 8. Decisão padrão: EXECUTE
      await this.log(companyId, userId, action, 'EXECUTE', 'All checks passed', context);
      return { decision: 'EXECUTE', reason: 'All checks passed', metadata: { attentionScore } };

    } catch (error) {
      logger.error({ error, params }, 'Gatekeeper error');
      // Em caso de erro, bloqueia por segurança
      return { decision: 'BLOCK', reason: 'Gatekeeper error - blocking for safety' };
    }
  }

  /**
   * Verifica se ação está na lista de proibidas
   */
  private checkForbidden(action: string, policy: any): { blocked: boolean; reason: string } {
    const forbidden = policy?.forbidden || [];
    if (forbidden.includes(action)) {
      return { blocked: true, reason: 'Action forbidden by company policy' };
    }
    return { blocked: false, reason: '' };
  }

  /**
   * Verifica autonomia máxima por role
   */
  private checkRoleAutonomy(action: string, role: string, policy: any): { decision: GatekeeperDecision; reason: string } {
    const maxAutonomy = policy?.maxAutonomy?.[role];
    if (!maxAutonomy) {
      // Se não tem política definida, permite por padrão (mas pode mudar estratégia)
      return { decision: 'EXECUTE', reason: 'No policy defined for role' };
    }

    const actionPolicy = maxAutonomy[action];
    if (!actionPolicy) {
      // Ação não mapeada, assume EXECUTE (ou pode ser SUGGEST por segurança)
      return { decision: 'EXECUTE', reason: 'Action not mapped in role policy' };
    }

    if (actionPolicy === 'BLOCK') {
      return { decision: 'BLOCK', reason: `Not allowed for role ${role}` };
    }
    if (actionPolicy === 'SUGGEST') {
      return { decision: 'SUGGEST', reason: `Requires approval for role ${role}` };
    }

    return { decision: 'EXECUTE', reason: 'Role policy allows execution' };
  }

  /**
   * Verifica preferências do usuário
   */
  private checkUserAutonomy(action: string, profile: any): { decision: GatekeeperDecision; reason: string } {
    const userAutonomy = profile?.autonomy?.[action];
    if (!userAutonomy) {
      return { decision: 'EXECUTE', reason: 'No user preference for action' };
    }

    if (userAutonomy === 'BLOCK') {
      return { decision: 'BLOCK', reason: `User autonomy level is BLOCK` };
    }

    if (userAutonomy === 'SUGGEST') {
      return { decision: 'SUGGEST', reason: `User autonomy level is SUGGEST` };
    }

    if (userAutonomy === 'LOG_ONLY') {
      return { decision: 'LOG_ONLY', reason: 'User prefers silence for this action' };
    }

    return { decision: 'EXECUTE', reason: 'User preference allows execution' };
  }

  /**
   * Verifica se está em quiet hours
   */
  private isInQuietHours(profile: any): boolean {
    const quietHours = profile?.quietHours || [];
    if (quietHours.length === 0) return false;

    for (const qh of quietHours) {
      const now = DateTime.now().setZone(qh.timezone || 'America/Sao_Paulo');
      const start = DateTime.fromFormat(qh.start, 'HH:mm', { zone: qh.timezone || 'America/Sao_Paulo' });
      const end = DateTime.fromFormat(qh.end, 'HH:mm', { zone: qh.timezone || 'America/Sao_Paulo' });

      // Verificar se hoje está nos dias da semana configurados
      if (qh.days && qh.days.length > 0) {
        const weekday = now.weekday; // 1 = Monday, 7 = Sunday
        if (!qh.days.includes(weekday)) continue;
      }

      // Verificar se está no intervalo de horário
      let inRange = false;
      if (end < start) {
        // Intervalo cruza meia-noite (ex: 22:00 - 08:00)
        inRange = now >= start || now <= end;
      } else {
        inRange = now >= start && now <= end;
      }

      if (inRange) return true;
    }

    return false;
  }

  /**
   * Verifica se contexto é VIP (clientes, projetos ou deals prioritários)
   */
  private checkIfVIP(context: any, profile: any): boolean {
    const vipList = profile?.vipList || {};

    if (context.contactId && vipList.contacts?.includes(context.contactId)) return true;
    if (context.projectId && vipList.projects?.includes(context.projectId)) return true;
    if (context.dealId && vipList.deals?.includes(context.dealId)) return true;

    return false;
  }

  /**
   * Calcula score de atenção (anti-spam)
   */
  private async calculateAttentionScore(userId: string, action: string): Promise<number> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Contar notificações/ações recentes
    const [recentActions, recentDismissals] = await Promise.all([
      prisma.gatekeeperLog.count({
        where: {
          userId,
          decision: { in: ['EXECUTE', 'SUGGEST'] },
          timestamp: { gte: oneHourAgo }
        }
      }),
      prisma.reminder.count({
        where: {
          userId,
          status: 'DISMISSED',
          dismissedAt: { gte: oneDayAgo }
        }
      })
    ]);

    let score = 1.0;

    // Penaliza se muitas ações/notificações recentes
    if (recentActions > 10) score -= 0.5;
    if (recentActions > 20) score -= 0.3;

    // Penaliza se usuário dismissou muitas notificações (sinal de spam)
    const dismissRate = recentDismissals / Math.max(recentActions, 1);
    if (dismissRate > 0.7) score -= 0.4;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Verifica se canal está permitido pelo usuário
   */
  private checkChannelAllowed(action: string, profile: any): boolean {
    const channels = profile?.channels || { email: true, push: true, inapp: true, whatsapp: false };

    // Mapear ação para canal
    if (action.includes('email')) return channels.email !== false;
    if (action.includes('push')) return channels.push !== false;
    if (action.includes('whatsapp')) return channels.whatsapp !== false;
    if (action.includes('sms')) return channels.sms !== false;

    // Padrão: permite in-app
    return channels.inapp !== false;
  }

  /**
   * Loga decisão do Gatekeeper
   */
  private async log(
    companyId: string,
    userId: string | null,
    action: string,
    decision: GatekeeperDecision,
    reason: string,
    context: any
  ): Promise<void> {
    try {
      await prisma.gatekeeperLog.create({
        data: {
          companyId,
          userId,
          action,
          decision,
          reason,
          context,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to log gatekeeper decision');
    }
  }

  /**
   * Helpers para carregar dados
   */
  private async getCompanyPolicy(companyId: string) {
    const policy = await prisma.companyPolicy.findUnique({
      where: { companyId }
    });

    // Retorna política padrão se não existir
    return policy || this.getDefaultCompanyPolicy();
  }

  private async getAttentionProfile(userId: string) {
    const profile = await prisma.attentionProfile.findUnique({
      where: { userId }
    });

    // Retorna perfil padrão se não existir
    return profile || this.getDefaultAttentionProfile();
  }

  private async getUser(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, companyId: true }
    });
  }

  /**
   * Políticas padrão (quando não configuradas)
   */
  private getDefaultCompanyPolicy() {
    return {
      maxAutonomy: {
        viewer: {
          create_zettel: 'SUGGEST',
          send_notification: 'BLOCK',
          send_external_message: 'BLOCK'
        },
        agent: {
          create_zettel: 'EXECUTE',
          send_notification: 'SUGGEST',
          send_external_message: 'SUGGEST'
        },
        supervisor: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE'
        },
        company_admin: {
          create_zettel: 'EXECUTE',
          send_notification: 'EXECUTE',
          send_external_message: 'EXECUTE'
        }
      },
      forbidden: ['delete_contact_auto', 'modify_invoice_auto'],
      auditRules: { retention_days: 365, immutable: true },
      rateLimits: { ai_calls_per_user_per_day: 100, ai_calls_per_company_per_day: 1000 }
    };
  }

  private getDefaultAttentionProfile() {
    return {
      level: 'BALANCED',
      quietHours: [],
      channels: { email: true, push: true, inapp: true, whatsapp: false, sms: false },
      vipList: { contacts: [], projects: [], deals: [] },
      autonomy: {
        create_zettel: 'EXECUTE',
        create_reminder: 'EXECUTE',
        send_notification: 'EXECUTE',
        send_external_message: 'SUGGEST'
      }
    };
  }
}

export const gatekeeperService = new GatekeeperService();
