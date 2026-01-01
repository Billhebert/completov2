/**
 * Barrel export do módulo de Conhecimento
 */

export * from './services/knowledge.service';
export { default as knowledgeModuleConfig } from './module.config';
// Neste momento não temos rotas ou páginas específicas implementadas para o módulo
// de conhecimento no frontend. Assim que as páginas forem criadas, exporte-as aqui.