import { ModuleConfig } from '../../core/types';

/**
 * Configuration for the narrative module.
 *
 * This module exposes functionality to generate narratives and reports
 * summarizing evidence stored in the knowledge base. Because narratives
 * aggregate information from across the company and may reveal sensitive
 * insights, access should be restricted via permissions.
 */
const narrativeModuleConfig: ModuleConfig = {
  id: 'narrative',
  name: 'Narrativas',
  description: 'Gere narrativas e relatórios executivos a partir de evidências da base de conhecimento.',
  version: '1.0.0',
  category: 'Knowledge',
  requiresAuth: true,
  requiredPermissions: ['narrative.generate'],
};

export default narrativeModuleConfig;