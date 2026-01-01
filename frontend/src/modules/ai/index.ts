/**
 * Barrel export do módulo de IA
 *
 * Este módulo reúne serviços para consultar a base de conhecimento por
 * RAG (Retrieve-Augmented Generation), gerar respostas de chat AI,
 * ingerir nodes e controlar o modo de operação da IA. As rotas estão
 * definidas em `backend/src/modules/ai/index.ts`【282032691130219†L16-L124】.
 */

export * from './services/ai.service';
export { default as aiModuleConfig } from './module.config';