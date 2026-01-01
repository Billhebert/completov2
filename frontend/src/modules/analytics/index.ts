/**
 * Barrel export do módulo de Analytics
 *
 * Este módulo fornece uma camada de serviço para obter métricas e relatórios
 * estatísticos do backend. As páginas e componentes de dashboards podem
 * importar estas funções para exibir gráficos e tabelas no frontend.
 */

export * from './services/analytics.service';
export { default as analyticsModuleConfig } from './module.config';