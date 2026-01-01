/**
 * Barrel export do módulo de Learning
 *
 * Este módulo expõe serviços para gerenciar trilhas de aprendizado,
 * matrículas, progresso, habilidades e planos de desenvolvimento do
 * colaborador. As funções são baseadas nas rotas do backend
 * `backend/src/modules/learning/index.ts`【342141902301556†L27-L285】.
 */

export * from './services/learning.service';
export { default as learningModuleConfig } from './module.config';