/**
 * Barrel export do módulo de Webhooks
 *
 * Este módulo encapsula operações para gerenciamento de eventos e endpoints de webhook.
 * Os clientes podem listar e criar definições de eventos, configurar endpoints que
 * recebem notificações em tempo real e consultar logs de entregas. Funções de teste
 * permitem disparar eventos de exemplo para validar a configuração.【913635998450837†L15-L45】【913635998450837†L125-L175】
 */

export * from './services/webhooks.service';
export { default as webhooksModuleConfig } from './module.config';