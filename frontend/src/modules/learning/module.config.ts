/**
 * Configuração do módulo de Learning
 *
 * Este módulo permite criar trilhas de aprendizagem, inscrever usuários,
 * rastrear progresso e avaliar habilidades. Ele depende de autenticação
 * e utiliza permissões de leitura de usuários para criação de trilhas
 * conforme definido no backend【342141902301556†L51-L61】.
 */
import { ModuleConfig } from '../../core/types';

export const learningModuleConfig: ModuleConfig = {
  id: 'learning',
  name: 'Aprendizagem',
  description: 'Trilhas de aprendizado, matrículas e habilidades',
  version: '1.0.0',
  enabled: true,
  category: 'learning',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['learning.read'],
};

export default learningModuleConfig;