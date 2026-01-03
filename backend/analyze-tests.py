#!/usr/bin/env python3
"""
Script para validar e analisar todos os arquivos teste.http
Sem precisar que o backend esteja rodando
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def parse_http_file(file_path):
    """Extrai informações do arquivo .http"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tests = []
        methods = []
        headers = set()
        variables = set()
        
        # Extrair seções de testes (### Test Name)
        test_sections = re.findall(r'### (.+)', content)
        
        # Extrair métodos HTTP
        methods = re.findall(r'(GET|POST|PUT|DELETE|PATCH)\s+(/[\w\-/{}]*)', content)
        
        # Extrair variáveis
        variables = set(re.findall(r'\{\{(\w+)\}\}', content))
        
        # Extrair headers
        if 'Content-Type' in content:
            headers.add('Content-Type')
        if 'Authorization' in content:
            headers.add('Authorization')
        if 'Bearer' in content:
            headers.add('Bearer Token')
            
        return {
            'tests': len(test_sections),
            'test_names': test_sections,
            'endpoints': len(methods),
            'methods': dict(defaultdict(int, 
                          [(m, methods.count((m, p))) for m, p in methods])),
            'variables': variables,
            'headers': headers
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    """Analisa todos os arquivos teste.http"""
    base_path = Path('c:\\Users\\Bill\\Downloads\\Nova pasta (3)\\completov2\\backend\\src\\modules')
    
    if not base_path.exists():
        print(f"❌ Pasta não encontrada: {base_path}")
        return
    
    results = {}
    total_tests = 0
    total_endpoints = 0
    
    # Procurar todos os arquivos teste.http
    for module_dir in sorted(base_path.iterdir()):
        if not module_dir.is_dir():
            continue
            
        test_file = module_dir / 'teste.http'
        if test_file.exists():
            module_name = module_dir.name.upper()
            data = parse_http_file(test_file)
            
            if 'error' not in data:
                results[module_name] = data
                total_tests += data['tests']
                total_endpoints += data['endpoints']
                
                print(f"✅ {module_name:20} | {data['tests']:2} testes | {data['endpoints']:2} endpoints")
            else:
                print(f"❌ {module_name:20} | Erro ao parsing")
    
    print(f"\n{'='*60}")
    print(f"TOTAL: {len(results)} módulos | {total_tests} testes | {total_endpoints} endpoints")
    print(f"{'='*60}\n")
    
    # Gerar relatório detalhado
    report = f"""# 📊 RELATÓRIO DE VALIDAÇÃO AUTOMÁTICA

**Data**: 3 de janeiro de 2026  
**Total de Módulos**: {len(results)}  
**Total de Testes**: {total_tests}  
**Total de Endpoints**: {total_endpoints}  

## Módulos Validados

"""
    
    for module in sorted(results.keys()):
        data = results[module]
        report += f"\n### {module}\n"
        report += f"- Testes: {data['tests']}\n"
        report += f"- Endpoints: {data['endpoints']}\n"
        report += f"- Métodos: {', '.join(data['methods'].keys())}\n"
        if data['variables']:
            report += f"- Variáveis: {', '.join(sorted(data['variables']))}\n"
    
    # Salvar relatório
    report_path = Path('c:\\Users\\Bill\\Downloads\\Nova pasta (3)\\completov2\\DETAILED_TEST_ANALYSIS.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ Relatório salvo em: {report_path}")

if __name__ == '__main__':
    main()
