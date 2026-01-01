/**
 * Barrel export do módulo de CRM
 *
 * Este arquivo reexporta o serviço de CRM e o objeto de configuração do módulo.
 * Sempre que novas páginas ou componentes forem adicionados ao módulo, elas devem
 * ser exportadas aqui para que possam ser consumidas pelo restante da aplicação.
 */

export * from './services/crm.service';
export { default as crmModuleConfig } from './module.config';