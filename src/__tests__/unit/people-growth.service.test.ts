import { PeopleGrowthService } from '../../modules/people-growth/service';
import { PrismaClient } from '@prisma/client';
import {
  createTestCompany,
  createTestUser,
  createTestContact,
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

describe('PeopleGrowthService', () => {
  let service: PeopleGrowthService;
  let company: any;
  let agent: any;
  let contact: any;

  beforeEach(async () => {
    service = new PeopleGrowthService();
    company = await createTestCompany();
    agent = await createTestUser(company.id, 'agent');
    contact = await createTestContact(company.id);
  });

  describe('detectGapsFromInteraction', () => {
    it('should detect gaps from interaction using AI', async () => {
      const interaction = await createTestInteraction(company.id, agent.id, contact.id, {
        type: 'call',
        content: 'Customer was unhappy with response time. I struggled to address their concerns.',
        sentiment: 'negative',
        duration: 15,
      });

      // Mock OpenAI to return gaps
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [
                  {
                    domain: 'SOFT_SKILLS',
                    gap: 'Difficulty handling customer complaints',
                    severity: 'HIGH',
                    recommendation: 'Practice empathy and active listening',
                  },
                  {
                    domain: 'COMMERCIAL',
                    gap: 'Weak objection handling',
                    severity: 'MEDIUM',
                    recommendation: 'Study objection handling techniques',
                  },
                ],
                strengths: ['Polite communication'],
                overall_quality: 5,
              }),
            },
          },
        ],
      });

      const gaps = await service.detectGapsFromInteraction(interaction.id);

      expect(gaps.length).toBe(2);
      expect(gaps[0].domain).toBe('SOFT_SKILLS');
      expect(gaps[0].severity).toBe('HIGH');
      expect(gaps[1].domain).toBe('COMMERCIAL');

      // Check if gaps were created in database
      const dbGaps = await prisma.employeeGap.findMany({
        where: {
          employeeId: agent.id,
          companyId: company.id,
        },
      });

      expect(dbGaps.length).toBe(2);
      expect(dbGaps[0].evidence.length).toBeGreaterThan(0);
    });

    it('should not create duplicate gaps', async () => {
      const interaction1 = await createTestInteraction(company.id, agent.id, contact.id, {
        content: 'Struggled with objection handling',
      });

      const interaction2 = await createTestInteraction(company.id, agent.id, contact.id, {
        content: 'Again had trouble with objections',
      });

      // Mock OpenAI to return same gap
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [
                  {
                    domain: 'COMMERCIAL',
                    gap: 'Weak objection handling',
                    severity: 'MEDIUM',
                    recommendation: 'Practice',
                  },
                ],
                strengths: [],
                overall_quality: 6,
              }),
            },
          },
        ],
      });

      await service.detectGapsFromInteraction(interaction1.id);
      await service.detectGapsFromInteraction(interaction2.id);

      const dbGaps = await prisma.employeeGap.findMany({
        where: {
          employeeId: agent.id,
          companyId: company.id,
        },
      });

      // Should have only 1 gap with 2 evidence entries
      expect(dbGaps.length).toBe(1);
      expect(dbGaps[0].evidence.length).toBe(2);
    });

    it('should handle AI analysis errors gracefully', async () => {
      const interaction = await createTestInteraction(company.id, agent.id, contact.id);

      // Mock OpenAI to throw error
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      );

      const gaps = await service.detectGapsFromInteraction(interaction.id);

      expect(gaps).toEqual([]);

      // Should not create any gaps
      const dbGaps = await prisma.employeeGap.findMany({
        where: { employeeId: agent.id },
      });

      expect(dbGaps.length).toBe(0);
    });

    it('should skip if no gaps detected', async () => {
      const interaction = await createTestInteraction(company.id, agent.id, contact.id, {
        content: 'Perfect customer interaction, very professional',
        sentiment: 'positive',
      });

      // Mock OpenAI to return no gaps
      const openAI = mockOpenAI();
      (openAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [],
                strengths: ['Excellent communication', 'Great rapport'],
                overall_quality: 9,
              }),
            },
          },
        ],
      });

      const gaps = await service.detectGapsFromInteraction(interaction.id);

      expect(gaps).toEqual([]);
    });
  });

  describe('detectGapsFromSimulation', () => {
    it('should create gaps from simulation evaluation', async () => {
      const scenario = await prisma.simulationScenario.create({
        data: {
          companyId: company.id,
          title: 'Price Objection',
          description: 'Handle price objection',
          type: 'OBJECTION',
          difficulty: 3,
          estimatedDuration: 15,
          persona: { name: 'John', role: 'Buyer' },
          rubric: {
            criteria: [
              { name: 'Empathy', weight: 30 },
              { name: 'Solution', weight: 70 },
            ],
            passing_score: 70,
          },
        },
      });

      const session = await prisma.simulationSession.create({
        data: {
          scenarioId: scenario.id,
          userId: agent.id,
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
          messages: [],
          evaluation: {},
        },
      });

      const evaluation = {
        score: 60,
        passed: false,
        gaps: [
          {
            domain: 'COMMERCIAL',
            description: 'Weak value proposition',
            severity: 'HIGH',
          },
          {
            domain: 'SOFT_SKILLS',
            description: 'Lacked empathy',
            severity: 'MEDIUM',
          },
        ],
      };

      await service.detectGapsFromSimulation(session.id, evaluation);

      const dbGaps = await prisma.employeeGap.findMany({
        where: {
          employeeId: agent.id,
          companyId: company.id,
        },
      });

      expect(dbGaps.length).toBe(2);
      expect(dbGaps[0].evidence[0].type).toBe('simulation');
      expect(dbGaps[0].evidence[0].sessionId).toBe(session.id);
    });

    it('should skip if no gaps in evaluation', async () => {
      const scenario = await prisma.simulationScenario.create({
        data: {
          companyId: company.id,
          title: 'Test Scenario',
          description: 'Test',
          type: 'OBJECTION',
          difficulty: 1,
          estimatedDuration: 10,
          persona: {},
          rubric: {},
        },
      });

      const session = await prisma.simulationSession.create({
        data: {
          scenarioId: scenario.id,
          userId: agent.id,
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
          messages: [],
          evaluation: {},
        },
      });

      const evaluation = {
        score: 85,
        passed: true,
        gaps: [],
      };

      await service.detectGapsFromSimulation(session.id, evaluation);

      const dbGaps = await prisma.employeeGap.findMany({
        where: { employeeId: agent.id },
      });

      expect(dbGaps.length).toBe(0);
    });
  });

  describe('suggestLearningPath', () => {
    it('should suggest relevant learning paths for gap', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Weak objection handling',
          severity: 'HIGH',
          evidence: [],
        },
      });

      // Create learning paths
      const path1 = await prisma.learningPath.create({
        data: {
          companyId: company.id,
          title: 'Objection Handling Mastery',
          description: 'Learn to handle objections',
          category: 'COMMERCIAL',
          difficulty: 'intermediate',
          estimatedHours: 10,
          targetSkills: [],
          createdBy: agent.id,
        },
      });

      const path2 = await prisma.learningPath.create({
        data: {
          companyId: company.id,
          title: 'Sales Techniques',
          description: 'Advanced sales',
          category: 'COMMERCIAL',
          difficulty: 'advanced',
          estimatedHours: 20,
          targetSkills: [],
          createdBy: agent.id,
        },
      });

      const suggestions = await service.suggestLearningPath(gap.id);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((p: any) => p.category === 'COMMERCIAL')).toBe(true);
    });

    it('should return empty array if no matching paths', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'TECHNICAL',
          gap: 'Weak coding skills',
          severity: 'HIGH',
          evidence: [],
        },
      });

      const suggestions = await service.suggestLearningPath(gap.id);

      expect(suggestions).toEqual([]);
    });
  });

  describe('closeGap', () => {
    it('should close gap successfully', async () => {
      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'MEDIUM',
          evidence: [],
          status: 'OPEN',
        },
      });

      await service.closeGap(gap.id, agent.id);

      const updatedGap = await prisma.employeeGap.findUnique({
        where: { id: gap.id },
      });

      expect(updatedGap!.status).toBe('CLOSED');
      expect(updatedGap!.closedAt).toBeDefined();
    });

    it('should throw error if gap does not belong to user', async () => {
      const otherUser = await createTestUser(company.id, 'agent');

      const gap = await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: otherUser.id,
          domain: 'COMMERCIAL',
          gap: 'Test gap',
          severity: 'MEDIUM',
          evidence: [],
          status: 'OPEN',
        },
      });

      await expect(service.closeGap(gap.id, agent.id)).rejects.toThrow('Gap not found');
    });
  });

  describe('getTeamGapsReport', () => {
    it('should generate team gaps report', async () => {
      // Create gaps for multiple users
      await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent.id,
          domain: 'COMMERCIAL',
          gap: 'Gap 1',
          severity: 'HIGH',
          evidence: [],
          status: 'OPEN',
        },
      });

      const agent2 = await createTestUser(company.id, 'agent');

      await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent2.id,
          domain: 'TECHNICAL',
          gap: 'Gap 2',
          severity: 'MEDIUM',
          evidence: [],
          status: 'OPEN',
        },
      });

      await prisma.employeeGap.create({
        data: {
          companyId: company.id,
          employeeId: agent2.id,
          domain: 'COMMERCIAL',
          gap: 'Gap 3',
          severity: 'LOW',
          evidence: [],
          status: 'CLOSED',
        },
      });

      const report = await service.getTeamGapsReport(company.id);

      expect(report.total).toBe(2); // Only OPEN and IN_PROGRESS
      expect(report.byDomain).toBeDefined();
      expect(report.bySeverity).toBeDefined();
      expect(report.bySeverity.HIGH).toBe(1);
      expect(report.bySeverity.MEDIUM).toBe(1);
    });
  });
});
