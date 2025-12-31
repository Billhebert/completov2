import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { logger } from '@core/logger';
import { z } from 'zod';
import { peopleGrowthService } from '../people-growth/service';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// ROUTES - SCENARIOS
// ============================================

/**
 * GET /api/v1/simulation/scenarios
 * Listar cenários de simulação
 */
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { type } = req.query;

    const where: any = { companyId, isActive: true };
    if (type) where.type = type;

    const scenarios = await prisma.simulationScenario.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: scenarios });
  } catch (error: any) {
    logger.error({ error }, 'Error listing scenarios');
    res.status(500).json({ error: 'Failed to list scenarios' });
  }
});

/**
 * POST /api/v1/simulation/scenarios
 * Criar cenário (admin only)
 */
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;

    if (role !== 'company_admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, type, persona, rubric, difficulty, estimatedDuration } = req.body;

    const scenario = await prisma.simulationScenario.create({
      data: {
        companyId,
        title,
        description,
        type,
        persona,
        rubric,
        difficulty: difficulty || 3,
        estimatedDuration: estimatedDuration || 15
      }
    });

    res.status(201).json(scenario);

  } catch (error: any) {
    logger.error({ error }, 'Error creating scenario');
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// ============================================
// ROUTES - SESSIONS
// ============================================

/**
 * POST /api/v1/simulation/start
 * Iniciar sessão de simulação
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { scenarioId } = req.body;

    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId is required' });
    }

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
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

/**
 * POST /api/v1/simulation/:id/message
 * Enviar mensagem na simulação
 */
router.post('/:id/message', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const session = await prisma.simulationSession.findFirst({
      where: { id, userId },
      include: { scenario: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.finishedAt) {
      return res.status(400).json({ error: 'Session already finished' });
    }

    // Adicionar mensagem do usuário
    const transcript = [...(session.transcript as any[]), {
      role: 'user',
      content: message,
      timestamp: new Date()
    }];

    // Gerar resposta da persona
    const personaResponse = await generatePersonaMessage(session.scenario.persona, transcript);

    // Adicionar resposta da persona
    transcript.push({
      role: 'persona',
      content: personaResponse,
      timestamp: new Date()
    });

    // Atualizar sessão
    await prisma.simulationSession.update({
      where: { id },
      data: { transcript: transcript as any }
    });

    res.json({ response: personaResponse });

  } catch (error: any) {
    logger.error({ error }, 'Error sending message');
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/v1/simulation/:id/end
 * Finalizar simulação e avaliar
 */
router.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const session = await prisma.simulationSession.findFirst({
      where: { id, userId },
      include: { scenario: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Avaliar com LLM
    const evaluation = await evaluateSession(session.transcript as any[], session.scenario.rubric);

    // Atualizar sessão
    await prisma.simulationSession.update({
      where: { id },
      data: {
        finishedAt: new Date(),
        evaluation: evaluation as any,
        score: evaluation.score,
        feedback: evaluation.feedback
      }
    });

    // Criar zettel de learning
    await createLearningZettel(session, evaluation);

    // Detectar gaps de desenvolvimento
    await peopleGrowthService.detectGapsFromSimulation(id, evaluation);

    res.json(evaluation);

  } catch (error: any) {
    logger.error({ error }, 'Error ending simulation');
    res.status(500).json({ error: 'Failed to end simulation' });
  }
});

/**
 * GET /api/v1/simulation/history
 * Histórico de simulações do usuário
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;

    const sessions = await prisma.simulationSession.findMany({
      where: { userId },
      include: {
        scenario: { select: { title: true, type: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: 50
    });

    res.json({ data: sessions });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching history');
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ============================================
// HELPERS
// ============================================

async function generatePersonaMessage(persona: any, transcript: any[]): Promise<string> {
  try {
    const systemPrompt = `Você é a persona descrita abaixo. Atue conforme essa persona em uma simulação de treinamento.

Persona:
${JSON.stringify(persona, null, 2)}

Instruções:
- Seja natural e realista
- Responda de acordo com a personalidade da persona
- Crie um cenário desafiador mas educativo
- Não saia do personagem`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...transcript.map((t: any) => ({
        role: t.role === 'persona' ? 'assistant' : 'user',
        content: t.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: messages as any,
      temperature: 0.8
    });

    return response.choices[0]?.message?.content || 'Desculpe, não consegui gerar resposta.';

  } catch (error) {
    logger.error({ error }, 'Failed to generate persona message');
    return 'Erro ao gerar resposta da persona.';
  }
}

async function evaluateSession(transcript: any[], rubric: any): Promise<any> {
  try {
    const transcriptText = transcript.map(t =>
      `[${t.role}]: ${t.content}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Avalie a simulação abaixo usando a rubrica fornecida. Retorne JSON: {score: 0-100, strengths: string[], improvements: string[], feedback: string, gaps: []}`
        },
        {
          role: 'user',
          content: `Rubrica:\n${JSON.stringify(rubric, null, 2)}\n\nTranscrição:\n${transcriptText}`
        }
      ],
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    return content ? JSON.parse(content) : { score: 0, feedback: 'Erro na avaliação' };

  } catch (error) {
    logger.error({ error }, 'Failed to evaluate session');
    return { score: 0, feedback: 'Erro ao avaliar simulação', strengths: [], improvements: [] };
  }
}

async function createLearningZettel(session: any, evaluation: any): Promise<void> {
  try {
    await prisma.knowledgeNode.create({
      data: {
        companyId: session.scenario.companyId,
        title: `Simulação: ${session.scenario.title}`,
        content: `# Simulação - ${session.scenario.title}

## Resultado
**Score:** ${evaluation.score}/100
**Data:** ${session.finishedAt?.toISOString().split('T')[0]}

## Pontos Fortes
${evaluation.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

## Pontos de Melhoria
${evaluation.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}

## Feedback
${evaluation.feedback}`,
        nodeType: 'LEARNING',
        createdById: session.userId,
        visibility: 'PRIVATE',
        tags: ['simulation', session.scenario.type, `score-${Math.floor(evaluation.score / 10) * 10}`]
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create learning zettel');
  }
}

export default router;
