import { ModuleConfig } from '../../core/types';

/**
 * Configuration for the simulation module.
 *
 * The simulation module provides interactive training scenarios where users
 * converse with personas and receive AI-driven feedback. Access to this
 * module requires authentication and appropriate permissions since
 * scenarios and session transcripts may contain sensitive information.
 */
const simulationModuleConfig: ModuleConfig = {
  id: 'simulation',
  name: 'Simulações',
  description: 'Crie e execute cenários de simulação com feedback automático para treinamento e desenvolvimento.',
  version: '1.0.0',
  category: 'Learning',
  requiresAuth: true,
  requiredPermissions: ['simulation.read'],
};

export default simulationModuleConfig;