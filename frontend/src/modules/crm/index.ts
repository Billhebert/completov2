/**
 * CRM Module Barrel Export
 */

export * from './types';
export * as contactService from './services/contact.service';
export * as dealService from './services/deal.service';
export * as companyService from './services/company.service';
export { default as crmRoutes } from './routes';
export { default as crmModuleConfig } from './module.config';
