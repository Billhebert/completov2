import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { gatekeeperService } from '../modules/gatekeeper/gatekeeper.service';
import { eventBus } from '@core/event-bus';

const prisma = new PrismaClient();

/**
 * Reminders Cron Job
 *
 * Executa a cada 5 minutos, verifica lembretes pendentes e envia notificações
 * respeitando as políticas do Gatekeeper.
 */
export function startRemindersCron() {
  // A cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    logger.info('[CRON] Reminders: Starting check...');

    try {
      const now = new Date();

      // Buscar lembretes pendentes que já devem ser enviados
      const dueReminders = await prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: { lte: now }
        },
        include: {
          node: true,
          user: true,
          company: true
        },
        take: 100 // Limitar a 100 por execução para não sobrecarregar
      });

      logger.info(`[CRON] Reminders: Found ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        try {
          // Passar pelo Gatekeeper
          const decision = await gatekeeperService.shouldExecute({
            userId: reminder.userId,
            companyId: reminder.companyId,
            action: 'send_notification',
            context: {
              type: reminder.type,
              nodeId: reminder.nodeId,
              priority: reminder.node.priority || 'MEDIUM',
              source: 'reminder'
            }
          });

          if (decision.decision === 'EXECUTE') {
            // Enviar notificação
            await sendReminderNotification(reminder);

            // Marcar como enviado
            await prisma.reminder.update({
              where: { id: reminder.id },
              status: 'SENT',
              sentAt: new Date()
            });

            logger.info('[CRON] Reminders: Sent notification', {
              reminderId: reminder.id,
              userId: reminder.userId,
              type: reminder.type
            });

          } else if (decision.decision === 'LOG_ONLY') {
            // Apenas logar, não enviar notificação
            logger.info('[CRON] Reminders: Skipped (Gatekeeper LOG_ONLY)', {
              reminderId: reminder.id,
              reason: decision.reason
            });

            // Marcar como enviado mesmo assim para não reprocessar
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
                metadata: { gatekeeperDecision: decision }
              }
            });

          } else if (decision.decision === 'SUGGEST') {
            // Criar notificação "light" (menos intrusiva)
            await sendReminderNotification(reminder, { priority: 'LOW' });

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            });

          } else {
            // BLOCK - não enviar nada
            logger.warn('[CRON] Reminders: Blocked by Gatekeeper', {
              reminderId: reminder.id,
              reason: decision.reason
            });

            // Marcar como dismissed automaticamente
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: 'DISMISSED',
                dismissedAt: new Date(),
                metadata: { gatekeeperDecision: decision }
              }
            });
          }

        } catch (error) {
          logger.error('[CRON] Reminders: Failed to process reminder', {
            reminderId: reminder.id,
            error
          });
        }
      }

      logger.info('[CRON] Reminders: Check completed');

    } catch (error) {
      logger.error('[CRON] Reminders: Cron failed', { error });
    }
  });

  logger.info('[CRON] Reminders cron job started (every 5 minutes)');
}

/**
 * Envia notificação de lembrete
 */
async function sendReminderNotification(reminder: any, options?: { priority?: string }) {
  try {
    // Criar notificação in-app
    await prisma.notification.create({
      data: {
        companyId: reminder.companyId,
        userId: reminder.userId,
        type: reminder.type,
        title: getReminderTitle(reminder.type),
        body: reminder.message,
        data: {
          nodeId: reminder.nodeId,
          reminderId: reminder.id,
          priority: options?.priority || 'MEDIUM'
        }
      }
    });

    // Emitir evento (para WebSocket, email, etc)
    await eventBus.emit('reminder.sent', {
      reminderId: reminder.id,
      userId: reminder.userId,
      companyId: reminder.companyId,
      type: reminder.type,
      message: reminder.message,
      node: reminder.node
    });

  } catch (error) {
    logger.error('Failed to send reminder notification', { error, reminderId: reminder.id });
    throw error;
  }
}

/**
 * Gera título da notificação baseado no tipo
 */
function getReminderTitle(type: string): string {
  const titles: Record<string, string> = {
    'FOLLOW_UP': '🔔 Follow-up Pendente',
    'TASK_DUE': '⏰ Tarefa Vencendo',
    'REVIEW_REQUIRED': '📝 Revisão Necessária',
    'COMMITMENT': '🤝 Compromisso Assumido'
  };

  return titles[type] || '🔔 Lembrete';
}

/**
 * Cron Job para limpeza de lembretes antigos (executado diariamente às 03:00)
 */
export function startRemindersCleanupCron() {
  cron.schedule('0 3 * * *', async () => {
    logger.info('[CRON] Reminders Cleanup: Starting...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Deletar lembretes completados/dismissed há mais de 30 dias
      const result = await prisma.reminder.deleteMany({
        where: {
          status: { in: ['SENT', 'DISMISSED', 'COMPLETED'] },
          updatedAt: { lte: thirtyDaysAgo }
        }
      });

      logger.info(`[CRON] Reminders Cleanup: Deleted ${result.count} old reminders`);

    } catch (error) {
      logger.error('[CRON] Reminders Cleanup: Failed', { error });
    }
  });

  logger.info('[CRON] Reminders cleanup cron job started (daily at 03:00)');
}
