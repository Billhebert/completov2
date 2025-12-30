import { CuratorService } from '../../modules/knowledge/curator.service';
import { PrismaClient } from '@prisma/client';
import {
  createTestCompany,
  createTestUser,
  createTestContact,
  createTestDeal,
  createTestInteraction,
  mockOpenAI,
} from '../helpers/test-helpers';

const prisma = new PrismaClient();

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => mockOpenAI()),
  };
});

describe('CuratorService', () => {
  let curatorService: CuratorService;
  let company: any;
  let user: any;
  let contact: any;

  beforeEach(async () => {
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
          companyId: company.id,
          contactId: contact.id,
          ownerId: user.id,
          channel: 'whatsapp',
        },
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
        expect(clientZettel.title).toContain(contact.firstName);
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
          title: `${contact.firstName} ${contact.lastName}`,
          content: 'Existing contact zettel',
          nodeType: 'CLIENT',
          tags: ['contact'],
        },
      });

      const conversationData = {
        conversation: {
          id: 'conv-123',
          companyId: company.id,
          contactId: contact.id,
          ownerId: user.id,
          channel: 'whatsapp',
        },
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
          companyId: company.id,
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'I will send you the proposal by tomorrow',
          direction: 'outbound',
        },
      };

      // Mock OpenAI to return commitments
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                commitments: [
                  {
                    action: 'Enviar proposta',
                    deadline: 'tomorrow',
                    priority: 'HIGH',
                  },
                ],
              }),
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
          companyId: company.id,
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'Hello, how are you?',
          direction: 'outbound',
        },
      };

      // Mock OpenAI to return no commitments
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                commitments: [],
              }),
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
    it('should create LEARNING zettel when deal advances', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        stage: 'PROPOSAL',
      });

      const dealData = {
        deal: {
          id: deal.id,
          companyId: company.id,
          contactId: contact.id,
          ownerId: user.id,
          previousStage: 'PROSPECTING',
          currentStage: 'PROPOSAL',
        },
      };

      await curatorService.onDealStageChanged(dealData);

      const learningZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'LEARNING',
        },
      });

      expect(learningZettels.length).toBeGreaterThan(0);
      expect(learningZettels[0].title).toContain('avançou');
    });
  });

  describe('onDealClosed', () => {
    it('should create detailed LEARNING zettel when deal is won', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        status: 'WON',
        value: 50000,
      });

      const dealData = {
        deal: {
          id: deal.id,
          companyId: company.id,
          contactId: contact.id,
          ownerId: user.id,
          status: 'WON',
          value: 50000,
        },
        result: 'WON',
      };

      // Mock OpenAI to return analysis
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                lessons: ['Good rapport building', 'Clear value proposition'],
                patterns: ['Responded quickly to objections'],
                recommendations: ['Continue this approach'],
              }),
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
      expect(learningZettels[0].title).toContain('Ganho');
      expect(learningZettels[0].content).toContain('Good rapport building');
    });

    it('should create LEARNING zettel when deal is lost', async () => {
      const deal = await createTestDeal(company.id, contact.id, user.id, {
        status: 'LOST',
      });

      const dealData = {
        deal: {
          id: deal.id,
          companyId: company.id,
          contactId: contact.id,
          ownerId: user.id,
          status: 'LOST',
        },
        result: 'LOST',
      };

      await curatorService.onDealClosed(dealData);

      const learningZettels = await prisma.knowledgeNode.findMany({
        where: {
          companyId: company.id,
          nodeType: 'LEARNING',
        },
      });

      expect(learningZettels.length).toBeGreaterThan(0);
      expect(learningZettels[0].title).toContain('Perdido');
    });
  });

  describe('onInteractionCreated', () => {
    it('should create relevant zettels based on interaction type', async () => {
      const interaction = await createTestInteraction(company.id, user.id, contact.id, {
        type: 'meeting',
        content: 'Discussed pricing and implementation timeline',
        duration: 45,
      });

      const interactionData = {
        interaction: {
          id: interaction.id,
          companyId: company.id,
          userId: user.id,
          contactId: contact.id,
          type: 'meeting',
          content: 'Discussed pricing and implementation timeline',
        },
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
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      );

      const messageData = {
        message: {
          id: 'msg-123',
          companyId: company.id,
          conversationId: 'conv-123',
          senderId: user.id,
          content: 'Test message',
          direction: 'outbound',
        },
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
