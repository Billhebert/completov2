import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowAnalyzeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/workflows/:id/analyze`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;
      const { id } = req.params;

      const workflow = await prisma.workflow.findFirst({
        where: { id, companyId },
        include: {
          executions: {
            take: 50,
            orderBy: { startedAt: 'desc' },
          },
        },
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Calculate metrics
      const totalExecutions = workflow.executions.length;
      const successfulExecutions = workflow.executions.filter(e => e.status === 'COMPLETED').length;
      const failedExecutions = workflow.executions.filter(e => e.status === 'FAILED').length;
      const avgDuration = workflow.executions.reduce((sum, e) => {
        if (e.completedAt && e.startedAt) {
          return sum + (new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime());
        }
        return sum;
      }, 0) / (workflow.executions.length || 1);

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const context = `
      Workflow Analysis:
      - Name: ${workflow.name}
      - Description: ${workflow.description || 'No description'}
      - Status: ${workflow.status}
      - Total Executions: ${totalExecutions}
      - Successful: ${successfulExecutions}
      - Failed: ${failedExecutions}
      - Success Rate: ${totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0}%
      - Average Duration: ${Math.round(avgDuration / 1000)}s
      - Nodes: ${(workflow.definition as any)?.nodes?.length || 0}

      Analyze this workflow's efficiency and suggest improvements in Portuguese (pt-BR).
      Consider: success rate, execution time, complexity, and potential bottlenecks.
    `;

      const analysis = await aiService.complete({
        prompt: context,
        systemMessage: 'You are a workflow optimization expert. Provide a detailed analysis with specific recommendations.',
        temperature: 0.7,
      });

      res.json({
        success: true,
        data: {
          metrics: {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
            avgDurationSeconds: Math.round(avgDuration / 1000),
            nodeCount: (workflow.definition as any)?.nodes?.length || 0,
          },
          aiAnalysis: analysis.content,
          efficiency: successfulExecutions / totalExecutions >= 0.9 ? 'excellent' :
                      successfulExecutions / totalExecutions >= 0.7 ? 'good' :
                      successfulExecutions / totalExecutions >= 0.5 ? 'fair' : 'poor',
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
