/**
 * Configuração do módulo de Arquivos
 *
 * Define as propriedades básicas para habilitar o módulo de armazenamento
 * e uploads no frontend. O backend provê rotas para upload, listagem,
 * download e exclusão de arquivos, além de upload de avatar【455765087530948†L39-L223】.
 */
import { ModuleConfig } from '../../core/types';

export const filesModuleConfig: ModuleConfig = {
  id: 'files',
  name: 'Arquivos',
  description: 'Gerenciamento de uploads e armazenamento de arquivos',
  version: '1.0.0',
  enabled: true,
  category: 'storage',
  showInMenu: false, // normalmente acessado por outros módulos (chat, CRM, etc.)
  dependencies: ['auth'],
  requiredPermissions: ['files.read'],
};

export default filesModuleConfig;