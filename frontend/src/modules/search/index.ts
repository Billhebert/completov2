/**
 * Barrel export do módulo de Pesquisa
 *
 * Reexporta o serviço de busca e o objeto de configuração para facilitar
 * a importação em outras partes do aplicativo.
 */

export * from './services/search.service';
export { default as searchModuleConfig } from './module.config';
