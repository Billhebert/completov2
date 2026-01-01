/**
 * Barrel export do módulo de Serviços (Marketplace)
 *
 * Este módulo expõe chamadas para o marketplace interno de serviços. No
 * backend, as rotas permitem listar serviços oferecidos pela empresa e
 * parceiros, criar e atualizar serviços (apenas administradores), enviar
 * propostas, gerenciar o ciclo de vida (conclusão e avaliação), além de
 * acompanhar transações e pagamentos.【522691621467066†L17-L110】【522691621467066†L145-L261】
 */

export * from './services/services.service';
export { default as servicesModuleConfig } from './module.config';