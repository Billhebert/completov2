import { OpenAI } from 'openai';
import { logger } from '../../../core/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function evaluateSession(transcript: any[], rubric: any): Promise<any> {
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
