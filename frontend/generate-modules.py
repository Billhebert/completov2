#!/usr/bin/env python3
"""
Gerador de Módulos Frontend
Cria a estrutura base para todos os módulos do Completov2
"""

import os

MODULES = [
    # Business
    {"id": "crm", "name": "CRM", "description": "Gestão de contatos, empresas e deals", "category": "business", "permissions": ["crm.read"]},
    {"id": "chat", "name": "Chat", "description": "Sistema de mensagens em tempo real", "category": "business", "permissions": ["chat.read"]},
    {"id": "knowledge", "name": "Base de Conhecimento", "description": "Zettelkasten com RAG e busca semântica", "category": "business", "permissions": ["knowledge.read"]},

    # AI
    {"id": "ai", "name": "IA", "description": "Integração com LLMs", "category": "ai", "permissions": ["ai.read"]},
    {"id": "automations", "name": "Automações", "description": "Editor de workflows visual", "category": "ai", "permissions": ["automations.read"]},
    {"id": "narrative", "name": "Narrativas IA", "description": "Geração de narrativas com IA", "category": "ai", "permissions": ["narrative.read"]},
    {"id": "deduplication", "name": "Deduplicação IA", "description": "Detecção de duplicatas com IA", "category": "ai", "permissions": ["deduplication.read"]},
    {"id": "gatekeeper", "name": "Gatekeeper", "description": "Gerenciamento de atenção com IA", "category": "ai", "permissions": ["gatekeeper.read"]},

    # Operations
    {"id": "omnichannel", "name": "Omnichannel", "description": "Atendimento multicanal", "category": "operations", "permissions": ["omnichannel.read"]},
    {"id": "analytics", "name": "Analytics", "description": "Business intelligence e relatórios", "category": "operations", "permissions": ["analytics.read"]},
    {"id": "notifications", "name": "Notificações", "description": "Sistema de notificações multicanal", "category": "operations", "permissions": []},
    {"id": "rbac", "name": "RBAC", "description": "Controle de acesso", "category": "operations", "permissions": ["rbac.read"]},

    # Infrastructure
    {"id": "webhooks", "name": "Webhooks", "description": "Gestão de webhooks", "category": "infrastructure", "permissions": ["webhooks.read"]},
    {"id": "files", "name": "Arquivos", "description": "Gerenciamento de arquivos", "category": "infrastructure", "permissions": ["files.read"]},
    {"id": "search", "name": "Busca Global", "description": "Sistema de busca cross-module", "category": "infrastructure", "permissions": []},
    {"id": "audit", "name": "Auditoria", "description": "Logs de auditoria", "category": "infrastructure", "permissions": ["audit.read"]},
    {"id": "apikeys", "name": "API Keys", "description": "Gerenciamento de API keys", "category": "infrastructure", "permissions": ["apikeys.read"]},
    {"id": "sync", "name": "Sincronização", "description": "Integração com sistemas terceiros", "category": "infrastructure", "permissions": ["sync.read"]},
    {"id": "sso", "name": "SSO", "description": "Single Sign-On", "category": "infrastructure", "permissions": []},
    {"id": "mcp", "name": "MCP", "description": "Model Context Protocol", "category": "infrastructure", "permissions": ["mcp.read"]},

    # ERP
    {"id": "erp", "name": "ERP", "description": "Gestão financeira", "category": "erp", "permissions": ["erp.read"]},
    {"id": "services", "name": "Serviços", "description": "Marketplace de serviços", "category": "erp", "permissions": ["services.read"]},
    {"id": "partnerships", "name": "Parcerias", "description": "Gestão de parcerias B2B", "category": "erp", "permissions": ["partnerships.read"]},

    # HR
    {"id": "people-growth", "name": "Crescimento Pessoal", "description": "Planos de desenvolvimento", "category": "hr", "permissions": ["people-growth.read"]},
    {"id": "jobs", "name": "Vagas", "description": "Recrutamento e seleção", "category": "hr", "permissions": ["jobs.read"]},
    {"id": "learning", "name": "Aprendizado", "description": "Trilhas de aprendizado", "category": "hr", "permissions": ["learning.read"]},

    # Specialized
    {"id": "fsm", "name": "Field Service", "description": "Gestão de serviços em campo", "category": "specialized", "permissions": ["fsm.read"]},
    {"id": "cmms", "name": "CMMS", "description": "Gestão de ativos e manutenção", "category": "specialized", "permissions": ["cmms.read"]},
    {"id": "simulation", "name": "Simulações", "description": "Simulações de treinamento", "category": "specialized", "permissions": ["simulation.read"]},
    {"id": "email-templates", "name": "Templates de Email", "description": "Gestão de templates", "category": "specialized", "permissions": ["email-templates.read"]},

    # Settings
    {"id": "settings", "name": "Configurações", "description": "Configurações gerais", "category": "core", "permissions": []},
]

def create_module_config(module):
    permissions = ', '.join([f'"{p}"' for p in module['permissions']]) if module['permissions'] else ''
    return f'''/**
 * {module['name']} Module Configuration
 */

import {{ ModuleConfig }} from '../../core/types';

export const {module['id'].replace('-', '')}ModuleConfig: ModuleConfig = {{
  id: '{module['id']}',
  name: '{module['name']}',
  description: '{module['description']}',
  version: '1.0.0',
  enabled: true,
  category: '{module['category']}',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: [{permissions}],
}};

export default {module['id'].replace('-', '')}ModuleConfig;
'''

def create_types(module):
    name_pascal = ''.join(word.capitalize() for word in module['id'].split('-'))
    return f'''/**
 * {module['name']} Module Types
 */

export interface {name_pascal} {{
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}}

export interface Create{name_pascal}Request {{
  name: string;
  description?: string;
}}

export interface Update{name_pascal}Request {{
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}}
'''

def create_service(module):
    name_pascal = ''.join(word.capitalize() for word in module['id'].split('-'))
    return f'''/**
 * {module['name']} Service
 */

import api, {{ extractData }} from '../../../core/utils/api';
import {{ {name_pascal}, Create{name_pascal}Request, Update{name_pascal}Request }} from '../types';
import {{ PaginatedResult, PaginationParams }} from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<{name_pascal}>> => {{
  const response = await api.get('/{module['id']}', {{ params }});
  return extractData(response);
}};

export const getById = async (id: string): Promise<{name_pascal}> => {{
  const response = await api.get(`/{module['id']}/${{id}}`);
  return extractData(response);
}};

export const create = async (data: Create{name_pascal}Request): Promise<{name_pascal}> => {{
  const response = await api.post('/{module['id']}', data);
  return extractData(response);
}};

export const update = async (id: string, data: Update{name_pascal}Request): Promise<{name_pascal}> => {{
  const response = await api.put(`/{module['id']}/${{id}}`, data);
  return extractData(response);
}};

export const remove = async (id: string): Promise<void> => {{
  await api.delete(`/{module['id']}/${{id}}`);
}};
'''

def create_list_page(module):
    name_pascal = ''.join(word.capitalize() for word in module['id'].split('-'))
    return f'''/**
 * {module['name']} List Page
 */

import React, {{ useState, useEffect }} from 'react';
import {{ AppLayout, Card, Button, DataTable }} from '../../shared';
import * as {module['id'].replace('-', '')}Service from '../services/{module['id']}.service';
import {{ {name_pascal} }} from '../types';
import {{ handleApiError }} from '../../../core/utils/api';

export const {name_pascal}ListPage: React.FC = () => {{
  const [data, setData] = useState<{name_pascal}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {{
    loadData();
  }}, []);

  const loadData = async () => {{
    setIsLoading(true);
    try {{
      const result = await {module['id'].replace('-', '')}Service.getAll();
      setData(result.data);
    }} catch (error) {{
      console.error('Error loading data:', handleApiError(error));
    }} finally {{
      setIsLoading(false);
    }}
  }};

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="text-3xl font-bold text-gray-900">{module['name']}</h1>
          <Button variant="primary">Criar Novo</Button>
        </div>

        <Card noPadding>
          <DataTable
            columns={{[
              {{ key: 'name', label: 'Nome', sortable: true }},
              {{ key: 'status', label: 'Status' }},
              {{ key: 'createdAt', label: 'Criado em' }},
            ]}}
            data={{data}}
            keyExtractor={{(record) => record.id}}
            isLoading={{isLoading}}
          />
        </Card>
      </div>
    </AppLayout>
  );
}};

export default {name_pascal}ListPage;
'''

def create_routes(module):
    name_pascal = ''.join(word.capitalize() for word in module['id'].split('-'))
    return f'''/**
 * {module['name']} Module Routes
 */

import {{ lazy }} from 'react';
import {{ ProtectedRouteConfig }} from '../../core/types';

const {name_pascal}ListPage = lazy(() => import('./pages/{name_pascal}ListPage'));

export const {module['id'].replace('-', '')}Routes: ProtectedRouteConfig[] = [
  {{
    path: '/{module['id']}',
    element: <{name_pascal}ListPage />,
    requiredPermissions: {module['permissions']},
    meta: {{
      title: '{module['name']}',
    }},
  }},
];

export default {module['id'].replace('-', '')}Routes;
'''

def create_index(module):
    return f'''/**
 * {module['name']} Module Barrel Export
 */

export * from './types';
export * as {module['id'].replace('-', '')}Service from './services/{module['id']}.service';
export {{ default as {module['id'].replace('-', '')}Routes }} from './routes';
export {{ default as {module['id'].replace('-', '')}ModuleConfig }} from './module.config';
'''

# Generate all modules
for module in MODULES:
    base_path = f"src/modules/{module['id']}"

    # Create module.config.ts
    with open(f"{base_path}/module.config.ts", 'w') as f:
        f.write(create_module_config(module))

    # Create types/index.ts
    with open(f"{base_path}/types/index.ts", 'w') as f:
        f.write(create_types(module))

    # Create services/{id}.service.ts
    with open(f"{base_path}/services/{module['id']}.service.ts", 'w') as f:
        f.write(create_service(module))

    # Create pages/{Name}ListPage.tsx
    name_pascal = ''.join(word.capitalize() for word in module['id'].split('-'))
    with open(f"{base_path}/pages/{name_pascal}ListPage.tsx", 'w') as f:
        f.write(create_list_page(module))

    # Create routes.tsx
    with open(f"{base_path}/routes.tsx", 'w') as f:
        f.write(create_routes(module))

    # Create index.ts
    with open(f"{base_path}/index.ts", 'w') as f:
        f.write(create_index(module))

    print(f"✅ Module {module['id']} created")

print(f"\n🎉 Successfully created {len(MODULES)} modules!")
