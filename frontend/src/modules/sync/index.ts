/**
 * Barrel export do módulo de Sincronização
 *
 * Este arquivo reexporta as funções de serviço e o objeto de configuração,
 * simplificando as importações no resto do aplicativo.
 */

export * from './services/sync.service';
export { default as syncModuleConfig } from './module.config';
