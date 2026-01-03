import { OpenAI } from 'openai';
import { logger } from '../../../core/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePersonaMessage(persona: any, transcript: any[]): Promise<string> {
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
