import { logger } from './logger';
import { eventBus } from './event-bus';
import { curatorService } from '../modules/knowledge/curator.service';
import { registerWorkflowEventListeners } from '../modules/automations';
import { startRemindersCron, startRemindersCleanupCron } from '../cron/reminders.cron';
import { startTruthLayerCron } from '../modules/knowledge/truth-layer.service';
import { peopleGrowthService } from '../modules/people-growth/service';

/**
 * Inicializa todos os módulos do sistema
 */
export async function initializeSystem() {
  logger.info('[INIT] Starting system initialization...');

  try {
    // 1. Registrar Event Handlers do Curator (Zettelkasten Auto-criação)
    registerCuratorEventHandlers();

    // 2. Registrar Event Listeners dos Workflows
    await registerWorkflowEventListeners();

    // 3. Iniciar Cron Jobs
    startRemindersCron();
    startRemindersCleanupCron();
    startTruthLayerCron();

    logger.info('[INIT] System initialization completed successfully');

  } catch (error) {
    logger.error('[INIT] System initialization failed', { error });
    throw error;
  }
}

/**
 * Registra event handlers do Curator Service
 */
function registerCuratorEventHandlers() {
  logger.info('[INIT] Registering Curator event handlers...');

  // Conversation events
  eventBus.on('conversation.created', async (data: any) => {
    await curatorService.onConversationCreated(data);
  });

  // Message events
  eventBus.on('message.received', async (data: any) => {
    await curatorService.onMessageReceived(data);
  });

  // Deal events
  eventBus.on('deal.stage_changed', async (data: any) => {
    await curatorService.onDealStageChanged(data);
  });

  eventBus.on('deal.won', async (data: any) => {
    await curatorService.onDealClosed({ ...data, result: 'WON' });
  });

  eventBus.on('deal.lost', async (data: any) => {
    await curatorService.onDealClosed({ ...data, result: 'LOST' });
  });

  // Interaction events
  eventBus.on('interaction.created', async (data: any) => {
    await curatorService.onInteractionCreated(data);

    // Detectar gaps de desenvolvimento
    if (data.interaction?.id) {
      peopleGrowthService.detectGapsFromInteraction(data.interaction.id).catch(err => {
        logger.error('Failed to detect gaps from interaction', { error: err });
      });
    }
  });

  logger.info('[INIT] Curator event handlers registered');
  logger.info('[INIT] People Growth event handlers registered');
}
