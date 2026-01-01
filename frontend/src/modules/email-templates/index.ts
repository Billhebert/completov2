/**
 * Barrel export do módulo de Templates de Email
 *
 * Este módulo fornece acesso às rotas de templates de email do backend,
 * permitindo listar modelos disponíveis, visualizar o conteúdo renderizado
 * com variáveis e enviar emails utilizando esses modelos【533419220309048†L11-L66】.
 */

export * from './services/email-templates.service';
export { default as emailTemplatesModuleConfig } from './module.config';