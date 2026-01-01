/**
 * Barrel export do módulo de ERP
 *
 * Exporta o serviço de ERP e a configuração do módulo. Este módulo ainda
 * contempla apenas funcionalidades básicas de produtos, mas poderá ser
 * expandido para incluir pagamentos, relatórios financeiros, ordens de compra
 * e integrações multimoeda conforme novos endpoints forem adicionados ao
 * backend.
 */

export * from './services/erp.service';
export { default as erpModuleConfig } from './module.config';