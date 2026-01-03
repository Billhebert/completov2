import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { generatePersonaMessage } from '../services/persona.service';
import { z } from 'zod';

const startSessionSchema = z.object({
  scenarioId: z.string().min(1)
});

export function setupSessionStartRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/start`,
    authenticate,
    tenantIsolation,
    validateBody(startSessionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.user!;
        const { scenarioId } = req.body;

        const scenario = await prisma.simulationScenario.findUnique({
          where: { id: scenarioId }
        });

        if (!scenario) {
          return res.status(404).json({ error: 'Scenario not found' });
        }

        // Criar sessão
        const session = await prisma.simulationSession.create({
          data: {
            scenarioId,
            userId,
            transcript: []
          }
        });

        // Gerar mensagem inicial da persona
        const initialMessage = await generatePersonaMessage(scenario.persona, []);

        // Adicionar ao transcript
        await prisma.simulationSession.update({
          where: { id: session.id },
          data: {
            transcript: [
              { role: 'persona', content: initialMessage, timestamp: new Date() }
            ] as any
          }
        });

        res.status(201).json({
          sessionId: session.id,
          scenario: { title: scenario.title, description: scenario.description },
          initialMessage
        });
      } catch (error: any) {
        logger.error({ error }, 'Error starting simulation');
        next(error);
      }
    }
  );
}
