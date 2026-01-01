/**
 * Barrel export do módulo Gatekeeper
 *
 * Reexporta o serviço e a configuração para facilitar as importações.
 */

export * from './services/gatekeeper.service';
export { default as gatekeeperModuleConfig } from './module.config';
