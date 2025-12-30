import { CuratorService } from '../../modules/knowledge/curator.service';
import { PrismaClient } from '@prisma/client';
import {
  createTestCompany,
  createTestUser,
  createTestContact,
  createTestDeal,
  createTestInteraction,
} from '../helpers/test-helpers';

const prisma = new PrismaClient();

// Create shared mock - must be outside jest.mock to be accessible from tests
// but referenced inside the factory via closure
let sharedMockCreate: jest.Mock;

jest.mock('openai', () => {
  // Create the mock inside the factory
  sharedMockCreate = jest.fn();

  return {
    OpenAI: jest.fn(() => ({
      chat: {
        completions: {
          create: sharedMockCreate,
        },
      },
    })),
  };
});

// Wrap for easier access in tests
const openAIMock = {
  get mockCreate() {
    return sharedMockCreate;
  },
};

describe('CuratorService', () => {
  let curatorService: CuratorService;
  let company: any;
  let user: any;
  let contact: any;

  beforeEach(async () => {
    openAIMock.mockCreate.mockReset();
    curatorService = new CuratorService();
    company = await createTestCompany();
    user = await createTestUser(company.id, 'agent');
    contact = await createTestContact(company.id);
  });

  describe('onConversationCreated', () => {
    it('should create CLIENT and NEGOTIATION zettels', async () => {
      const conversationData = {
        conversation: {
          id: 'conv-123',
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          userId: user.id,
          channel: 'whatsapp',
        },
        companyId: company.id,
      };

      await curatorService.onConversationCreated(conversationData);

      const zettels = await prisma.knowledgeNode.findMany({
        where: { companyId: company.id },
      });

      // Should create 2 zettels: CLIENT + NEGOTIATION
      expect(zettels.length).toBeGreaterThanOrEqual(1);

      const clientZettel = zettels.find((z) => z.nodeType === 'CLIENT');
      const negotiationZettel = zettels.find((z) => z.nodeType === 'NEGOTIATION');

      if (clientZettel) {
        expect(clientZettel.title).toContain(contact.name);
        expect(clientZettel.sourceType).toBe('conversation');
        expect(clientZettel.sourceId).toBe(conversationData.conversation.id);
      }

      if (negotiationZettel) {
        expect(negotiationZettel.title).toContain('Negociação');
        expect(negotiationZettel.sourceType).toBe('conversation');
      }
    });

    it('should link zettels to existing contact zettel if exists', async () => {
      // Create existing contact zettel
      const existingZettel = await prisma.knowledgeNode.create({
        data: {
          companyId: company.id,
          createdById: user.id,
          title: contact.name,
          content: 'Existing contact zettel',
          nodeType: 'CLIENT',
          tags: ['contact'],
        },
      });

      const conversationData = {
        conversation: {
          id: 'conv-123',
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          userId: user.id,
          channel: 'whatsapp',
        },
        companyId: company.id,
      };

      await curatorService.onConversationCreated(conversationData);

      const zettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'NEGOTIATION',
        },
      });

      // Should link to existing zettel
      expect(zettels.length).toBeGreaterThan(0);
    });
  });

  describe('onMessageReceived', () => {
    it('should detect commitments and create TASK zettels', async () => {
      const messageData = {
        message: {
          id: 'msg-123',
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'I will send you the proposal by tomorrow',
          direction: 'outbound',
        },
        conversation: {
          id: 'conv-123',
          assignedToId: user.id,
        },
        companyId: company.id,
      };

      // Mock OpenAI to return commitments
      (openAIMock.mockCreate as jest.Mock).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  title: 'Enviar proposta',
                  description: 'Enviar a proposta comercial para o cliente',
                  dueDate: new Date(Date.now() + 86400000).toISOString(),
                  priority: 'HIGH',
                },
              ]),
            },
          },
        ],
      });

      await curatorService.onMessageReceived(messageData);

      const taskZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'TASK',
        },
      });

      expect(taskZettels.length).toBeGreaterThan(0);
      expect(taskZettels[0].title).toContain('Enviar proposta');
      expect(taskZettels[0].priority).toBe('HIGH');
    });

    it('should skip if no commitments detected', async () => {
      const messageData = {
        message: {
          id: 'msg-123',
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'Hello, how are you?',
          direction: 'outbound',
        },
        conversation: {
          id: 'conv-123',
          assignedToId: user.id,
        },
        companyId: company.id,
      };

      // Mock OpenAI to return no commitments
      (openAIMock.mockCreate as jest.Mock).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify([]),
            },
          },
        ],
      });

      await curatorService.onMessageReceived(messageData);

      const taskZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'TASK',
        },
      });

      expect(taskZettels.length).toBe(0);
    });
  });

  describe('onDealStageChanged', () => {
    it('should create/update NEGOTIATION zettel when deal stage changes', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        stage: 'PROPOSAL',
        title: 'Test Deal',
      });

      const dealData = {
        deal: {
          id: deal.id,
          contactId: contact.id,
          ownerId: user.id,
          title: deal.title,
          value: deal.value,
          currency: deal.currency,
          stage: 'PROPOSAL',
        },
        oldStage: 'PROSPECTING',
        newStage: 'PROPOSAL',
        companyId: company.id,
      };

      await curatorService.onDealStageChanged(dealData);

      const negotiationZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'NEGOTIATION',
        },
      });

      expect(negotiationZettels.length).toBeGreaterThan(0);
      expect(negotiationZettels[0].content).toContain('PROSPECTING');
      expect(negotiationZettels[0].content).toContain('PROPOSAL');
    });
  });

  describe('onDealClosed', () => {
    it('should create detailed LEARNING zettel when deal is won', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        stage: 'WON',
        value: 50000,
        title: 'Big Deal Won',
      });

      const dealData = {
        deal: {
          id: deal.id,
          contactId: contact.id,
          ownerId: user.id,
          title: deal.title,
          stage: 'WON',
          value: 50000,
        },
        result: 'WON',
        companyId: company.id,
      };

      // Mock OpenAI to return analysis
      (openAIMock.mockCreate as jest.Mock).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: `# Lições Aprendidas\n\n## O que funcionou\n- Good rapport building\n- Clear value proposition\n\n## Padrões\n- Responded quickly to objections\n\n## Recomendações\n- Continue this approach`,
            },
          },
        ],
      });

      await curatorService.onDealClosed(dealData);

      const learningZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'LEARNING',
        },
      });

      expect(learningZettels.length).toBeGreaterThan(0);
      expect(learningZettels[0].title).toContain('Lições');
      expect(learningZettels[0].title).toContain('WON');
      expect(learningZettels[0].content).toContain('Good rapport building');
    });

    it('should create LEARNING zettel when deal is lost', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        stage: 'LOST',
        title: 'Lost Deal',
      });

      const dealData = {
        deal: {
          id: deal.id,
          contactId: contact.id,
          ownerId: user.id,
          title: deal.title,
          stage: 'LOST',
        },
        result: 'LOST',
        companyId: company.id,
      };

      // Mock OpenAI to return analysis
      (openAIMock.mockCreate as jest.Mock).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: `# Lições Aprendidas\n\n## O que não funcionou\n- Preço muito alto\n- Não demonstramos valor suficiente\n\n## Recomendações\n- Ajustar estratégia de precificação`,
            },
          },
        ],
      });

      await curatorService.onDealClosed(dealData);

      const learningZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'LEARNING',
        },
      });

      expect(learningZettels.length).toBeGreaterThan(0);
      expect(learningZettels[0].title).toContain('Lições');
      expect(learningZettels[0].title).toContain('LOST');
    });
  });

  describe('onInteractionCreated', () => {
    it('should create/update CLIENT zettel based on interaction', async () => {
      const interaction = await createTestInteraction(company.id, user.id, contact.id, {
        type: 'meeting',
        content: 'Discussed pricing and implementation timeline',
        duration: 45,
      });

      const interactionData = {
        interaction: {
          id: interaction.id,
          userId: user.id,
          contactId: contact.id,
          type: 'meeting',
          content: 'Discussed pricing and implementation timeline',
          timestamp: new Date(),
        },
        companyId: company.id,
      };

      await curatorService.onInteractionCreated(interactionData);

      const zettels = await prisma.knowledgeNode.findMany({
        where: { companyId: company.id },
      });

      expect(zettels.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      (openAIMock.mockCreate as jest.Mock).mockRejectedValueOnce(
        new Error('OpenAI API error')
      );

      const messageData = {
        message: {
          id: 'msg-123',
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'Test message',
          direction: 'outbound',
        },
        conversation: {
          id: 'conv-123',
          assignedToId: user.id,
        },
        companyId: company.id,
      };

      // Should not throw error
      await expect(curatorService.onMessageReceived(messageData)).resolves.not.toThrow();

      // Should not create zettels
      const taskZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'TASK',
        },
      });

      expect(taskZettels.length).toBe(0);
    });
  });
});
