/**
 * Barrel export do módulo de Arquivos
 *
 * Este módulo encapsula as operações de upload, listagem, download e exclusão
 * de arquivos no backend. Ele também fornece um atalho para upload de
 * avatar de usuário. Conforme novas operações forem acrescentadas ao
 * backend, exporte-as aqui.
 */

export * from './services/files.service';
export { default as filesModuleConfig } from './module.config';