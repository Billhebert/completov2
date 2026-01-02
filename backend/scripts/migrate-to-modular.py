#!/usr/bin/env python3
"""
Script de Migração para Arquitetura 100% Modular
Converte rotas monolíticas em estrutura 1 arquivo = 1 rota

Uso:
    python migrate-to-modular.py <module-name>

Exemplo:
    python migrate-to-modular.py crm
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple

class RouteExtractor:
    """Extrai rotas de arquivos TypeScript"""

    def __init__(self, module_path: Path):
        self.module_path = module_path
        self.routes_file = module_path / "routes.ts"
        self.index_file = module_path / "index.ts"

    def extract_routes(self) -> List[Dict]:
        """Extrai todas as rotas do arquivo routes.ts"""
        if not self.routes_file.exists():
            print(f"❌ Arquivo {self.routes_file} não encontrado")
            return []

        content = self.routes_file.read_text()
        routes = []

        # Pattern para encontrar definições de rotas
        # Procura por app.get, app.post, app.put, app.patch, app.delete
        route_pattern = r'app\.(get|post|put|patch|delete)\s*\(\s*[`\'"]([^`\'"]+)[`\'"]'

        matches = re.finditer(route_pattern, content, re.MULTILINE)

        for match in matches:
            method = match.group(1).upper()
            path = match.group(2)

            # Extrair o bloco completo da rota
            start_pos = match.start()
            # Procurar pelo fechamento da função (procurar pelo último });
            end_pattern = r'\}\s*\);'
            end_match = re.search(end_pattern, content[start_pos:])

            if end_match:
                end_pos = start_pos + end_match.end()
                route_code = content[start_pos:end_pos]

                routes.append({
                    'method': method,
                    'path': path,
                    'code': route_code,
                    'full_code': self._extract_full_route_code(content, start_pos, end_pos)
                })

        print(f"✅ Encontradas {len(routes)} rotas no módulo")
        return routes

    def _extract_full_route_code(self, content: str, start: int, end: int) -> str:
        """Extrai o código completo da rota incluindo comentários"""
        # Procurar comentários antes da rota
        lines_before = content[:start].split('\n')
        comment_lines = []

        for line in reversed(lines_before[-10:]):  # Olhar até 10 linhas antes
            if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
                comment_lines.insert(0, line)
            elif line.strip() == '':
                comment_lines.insert(0, line)
            else:
                break

        comment_text = '\n'.join(comment_lines) if comment_lines else ''
        route_code = content[start:end]

        return f"{comment_text}\n{route_code}" if comment_text else route_code

class ModularGenerator:
    """Gera a estrutura modular de arquivos"""

    def __init__(self, module_name: str, module_path: Path):
        self.module_name = module_name
        self.module_path = module_path
        self.routes_dir = module_path / "routes"

    def create_structure(self):
        """Cria a estrutura de diretórios"""
        self.routes_dir.mkdir(exist_ok=True)
        print(f"✅ Diretório {self.routes_dir} criado")

    def generate_route_file(self, route: Dict) -> Tuple[str, str]:
        """Gera arquivo individual para uma rota"""
        # Criar nome do arquivo baseado no path e method
        path_clean = route['path'].replace('${baseUrl}/', '').replace('/', '-').replace(':', '')
        method_lower = route['method'].lower()

        # Remover prefixos comuns
        path_clean = path_clean.replace('api-v1-', '').replace(f'{self.module_name}-', '')

        filename = f"{path_clean}.route.ts" if path_clean else f"{method_lower}.route.ts"
        filename = filename.replace('--', '-').strip('-')

        # Gerar conteúdo do arquivo
        content = self._generate_route_content(route, filename)

        return filename, content

    def _generate_route_content(self, route: Dict, filename: str) -> str:
        """Gera o conteúdo do arquivo de rota"""
        method = route['method']
        path = route['path']

        # Extrair nome da função setup
        route_name = filename.replace('.route.ts', '').replace('-', '_').title().replace('_', '')
        setup_function = f"setup{route_name}Route"

        template = f'''/**
 * {self.module_name.title()} - {route_name} Route
 * {method} {path}
 */

import {{ Express, Request, Response, NextFunction }} from 'express';
import {{ PrismaClient }} from '@prisma/client';

export function {setup_function}(app: Express, prisma: PrismaClient, baseUrl: string) {{
{route['code']}
}}
'''
        return template

    def generate_index(self, routes: List[Dict]) -> str:
        """Gera o arquivo index.ts do routes"""
        imports = []
        calls = []
        route_list = []

        for i, route in enumerate(routes):
            path_clean = route['path'].replace('${baseUrl}/', '').replace('/', '-').replace(':', '')
            method_lower = route['method'].lower()
            path_clean = path_clean.replace('api-v1-', '').replace(f'{self.module_name}-', '')

            filename = f"{path_clean}.route.ts" if path_clean else f"{method_lower}.route.ts"
            filename = filename.replace('--', '-').strip('-').replace('.route.ts', '')

            route_name = filename.replace('-', '_').title().replace('_', '')
            setup_function = f"setup{route_name}Route"

            imports.append(f"import {{ {setup_function} }} from './{filename}.route';")
            calls.append(f"  {setup_function}(app, prisma, baseUrl);")
            route_list.append(f" * - {route['method']:6} {route['path']}")

        content = f'''/**
 * {self.module_name.title()} Routes - Index
 * Centralized route registration for {self.module_name.title()} module
 *
 * This file imports and registers all individual routes.
 * Each route is in its own file for maximum modularity.
 */

import {{ Express }} from 'express';
import {{ PrismaClient }} from '@prisma/client';

// Import individual route setup functions
{chr(10).join(imports)}

/**
 * Setup all {self.module_name} routes
 * @param app - Express application
 * @param prisma - Prisma client
 */
export function setup{self.module_name.title()}Routes(app: Express, prisma: PrismaClient) {{
  const baseUrl = '/api/v1/{self.module_name}';

  // Register all routes
{chr(10).join(calls)}
}}

/**
 * Route Summary:
 *
 * ROUTES ({len(routes)} total):
{chr(10).join(route_list)}
 */
'''
        return content

def migrate_module(module_name: str):
    """Migra um módulo completo para a estrutura modular"""
    print(f"\n{'='*60}")
    print(f"🚀 Migrando módulo: {module_name.upper()}")
    print(f"{'='*60}\n")

    # Encontrar o caminho do módulo
    base_path = Path(__file__).parent.parent / "src" / "modules" / module_name

    if not base_path.exists():
        print(f"❌ Módulo {module_name} não encontrado em {base_path}")
        return False

    # Extrair rotas
    extractor = RouteExtractor(base_path)
    routes = extractor.extract_routes()

    if not routes:
        print(f"⚠️  Nenhuma rota encontrada no módulo {module_name}")
        return False

    # Gerar estrutura modular
    generator = ModularGenerator(module_name, base_path)
    generator.create_structure()

    # Gerar arquivos individuais
    print(f"\n📝 Gerando arquivos de rota...")
    for route in routes:
        filename, content = generator.generate_route_file(route)
        file_path = generator.routes_dir / filename
        file_path.write_text(content)
        print(f"  ✅ {filename}")

    # Gerar index.ts
    print(f"\n📝 Gerando routes/index.ts...")
    index_content = generator.generate_index(routes)
    index_path = generator.routes_dir / "index.ts"
    index_path.write_text(index_content)
    print(f"  ✅ routes/index.ts")

    # Backup do arquivo antigo
    old_routes = base_path / "routes.ts"
    if old_routes.exists():
        backup_path = base_path / "routes.ts.backup"
        old_routes.rename(backup_path)
        print(f"\n💾 Backup criado: routes.ts.backup")

        # Copiar novo index para routes.ts
        import shutil
        shutil.copy(index_path, old_routes)
        print(f"  ✅ routes.ts atualizado")

    print(f"\n{'='*60}")
    print(f"✅ Módulo {module_name.upper()} migrado com sucesso!")
    print(f"{'='*60}")
    print(f"\nArquivos criados:")
    print(f"  - {len(routes)} arquivos de rota")
    print(f"  - 1 arquivo index.ts")
    print(f"  - 1 backup (routes.ts.backup)")
    print(f"\nTotal: {len(routes) + 2} arquivos\n")

    return True

def main():
    if len(sys.argv) < 2:
        print("Uso: python migrate-to-modular.py <module-name>")
        print("\nMódulos disponíveis:")
        modules_path = Path(__file__).parent.parent / "src" / "modules"
        if modules_path.exists():
            for module in sorted(modules_path.iterdir()):
                if module.is_dir() and (module / "routes.ts").exists():
                    print(f"  - {module.name}")
        sys.exit(1)

    module_name = sys.argv[1]
    success = migrate_module(module_name)

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
