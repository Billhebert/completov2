/**
 * Search Service  
 * Sistema de busca global unificado com Elasticsearch/Algolia
 * Busca full-text, fuzzy matching, facets e autocomplete
 */

import api, { extractData } from '../../../core/utils/api';
import { SearchResult, SearchFilters } from '../types';

/**
 * Busca global em todas as entidades do sistema
 *
 * TODO: Implementar busca avançada com Elasticsearch/Algolia
 *
 * FUNCIONALIDADES:
 * - Busca unificada em múltiplas entidades
 * - Full-text search com ranking por relevância
 * - Fuzzy matching para typos
 * - Faceted search (filtros dinâmicos)
 * - Highlighting de termos encontrados
 * - Paginação infinita
 * - Sugestões de busca (did you mean?)
 * - Histórico de buscas
 * - Buscas salvas/favoritas
 *
 * ENTIDADES PESQUISÁVEIS:
 * - CRM: contacts, companies, deals
 * - Content: articles (knowledge base), files, documents
 * - Communication: conversations (omnichannel), messages, emails
 * - Tasks: tasks, projects, milestones
 * - System: users, teams, departments
 * - Custom: entidades customizadas do usuário
 *
 * ALGORITMO DE BUSCA:
 * - Tokenização e normalização (lowercase, remove accents)
 * - Stemming (encontrar, encontrando, encontrados → encontr)
 * - Stop words em PT/EN (o, a, de, the, in, etc.)
 * - N-grams para busca parcial (permite achar "anto" em "Antonio")
 * - Phonetic matching (Metaphone, Soundex para nomes)
 * - Fuzzy matching (Levenshtein distance ≤ 2)
 * - Synonym expansion (CEO → diretor, gerente)
 *
 * RANKING POR RELEVÂNCIA:
 * - BM25 ou TF-IDF para score base
 * - Boost por campos:
 *   * Nome/título: 3x
 *   * Email/telefone: 2x
 *   * Descrição/notas: 1x
 *   * Tags/metadata: 1.5x
 * - Boost por recência (documentos recentes rank melhor)
 * - Boost por popularidade (mais acessados rank melhor)
 * - Penalizar por status (arquivados rank menor)
 * - Personalização: boost itens do dept do usuário
 *
 * FILTROS DISPONÍVEIS:
 * - Por tipo: contacts, deals, companies, articles, files, etc.
 * - Por status: ativo, arquivado, deletado
 * - Por data: range de criação/modificação
 * - Por autor/criador: userId específico
 * - Por tags: AND/OR entre tags
 * - Por localização: cidade, estado, país (para contacts/companies)
 * - Por valores numéricos: deal amount range, file size, etc.
 * - Customizados: campos custom da entidade
 *
 * FACETS (FILTROS DINÂMICOS):
 * - Retornar contagem por facet:
 *   * Tipo: contacts (45), deals (12), companies (8)
 *   * Status: ativo (50), arquivado (15)
 *   * Tags: importante (10), urgente (5), cliente (20)
 *   * Data: hoje (5), última semana (30), último mês (100)
 * - Permitir drill-down: clicar em facet aplica filtro
 * - Multi-select: combinar múltiplos filtros
 * - Atualizar facets ao mudar query/filtros
 *
 * HIGHLIGHTING:
 * - Marcar termos de busca nos resultados
 * - Retornar fragmentos relevantes (snippets)
 * - Formato: "...encontrado <mark>termo</mark> no texto..."
 * - Limitar snippet a ~150 caracteres
 * - Mostrar múltiplos snippets se termo aparece várias vezes
 * - Configurável: quantos snippets retornar
 *
 * QUERY PARSING:
 * - Suporte a operadores:
 *   * AND: "joão silva" (busca ambos termos)
 *   * OR: "joão | pedro" (busca qualquer um)
 *   * NOT: "joão -silva" (joão mas não silva)
 *   * Exact: "\"joão silva\"" (frase exata)
 *   * Wildcard: "jo*" (começa com jo)
 *   * Field: "email:@gmail.com" (busca em campo específico)
 * - Parser robusto que entende linguagem natural
 * - Fallback: se query avançada falha, busca simples
 *
 * TYPO CORRECTION:
 * - Detectar typos comuns (edit distance)
 * - Sugerir correções: "Você quis dizer: antonio?"
 * - Auto-corrigir se apenas 1 resultado na correção
 * - Mostrar resultados da correção com aviso
 *
 * PAGINAÇÃO:
 * - Infinite scroll preferível
 * - Ou paginação tradicional (20 por página)
 * - Deep pagination performance: use search_after (Elasticsearch)
 * - Total count aproximado para grandes resultsets
 *
 * PERFORMANCE:
 * - Índices otimizados (Elasticsearch/Algolia)
 * - Cache de buscas frequentes (Redis, 5 min)
 * - Debounce de 300ms no frontend
 * - Máximo 100 resultados por request
 * - Async indexing: não bloquear writes
 *
 * PERMISSÕES:
 * - Apenas retornar resultados que usuário pode acessar
 * - Filtrar por ACL antes de retornar
 * - Não vazar dados sensíveis em snippets
 * - Respeitar permissões por departamento/team
 *
 * ANALYTICS:
 * - Registrar todas buscas para análise
 * - Identificar termos mais buscados
 * - Click-through rate por resultado
 * - Zero-result queries (buscas sem resultado)
 * - Tempo até encontrar resultado relevante
 *
 * CASOS DE USO:
 * - Busca global no header do app
 * - Command palette (Cmd+K)
 * - Busca específica dentro de módulos
 * - Busca de contatos ao criar deal
 * - Pesquisa de artigos na KB
 *
 * RETORNO:
 * - Array de SearchResult ordenados por relevância
 * - Cada resultado com:
 *   * type, id, title, description
 *   * highlights (termos marcados)
 *   * score (relevância 0-100)
 *   * url (deep link)
 *   * metadata (campos importantes da entidade)
 * - Metadados:
 *   * totalCount (aproximado)
 *   * took (tempo de busca em ms)
 *   * facets (contagem por tipo/filtro)
 *   * suggestion (correção sugerida)
 *
 * ERROS:
 * - 400: Query inválida ou malformada
 * - 422: Filtros incompatíveis
 */
export const search = async (
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  const response = await api.get('/search', {
    params: { q: query, ...filters },
  });
  return extractData(response);
};

/**
 * Autocomplete/sugestões enquanto usuário digita
 *
 * TODO: Implementar autocomplete rápido com cache
 *
 * FUNCIONALIDADES:
 * - Sugestões instantâneas enquanto digita
 * - Baseado em prefixo (prefix matching)
 * - Ranking por popularidade
 * - Histórico de buscas do usuário
 * - Trending searches
 * - Typo tolerance
 *
 * VELOCIDADE:
 * - Deve responder em < 50ms (percepção de instantâneo)
 * - Cache agressivo (Redis/Memcached)
 * - Índice otimizado para prefix queries
 * - Edge n-grams no Elasticsearch
 * - Limitar a 10 sugestões máximo
 *
 * FONTES DE SUGESTÕES:
 * - Entidades do sistema (nomes de contacts, companies, deals)
 * - Buscas populares (trending)
 * - Histórico do usuário (últimas buscas)
 * - Queries frequentes globais
 * - Termos relacionados
 *
 * RANKING:
 * - Histórico do usuário primeiro (personalizado)
 * - Depois por popularidade global
 * - Boost entidades recentemente acessadas
 * - Penalizar queries antigas/obsoletas
 *
 * FORMATAÇÃO:
 * - Highlight do prefixo digitado
 * - Separar por tipo: "Buscar contacts", "Buscar deals", etc.
 * - Mostrar ícone por tipo de resultado
 * - Preview rápido (avatar, info resumida)
 *
 * DEBOUNCING:
 * - Frontend deve fazer debounce (200-300ms)
 * - Evitar requests a cada keystroke
 * - Cancelar requests anteriores (AbortController)
 *
 * CACHE:
 * - Cache agressivo (1 hora para prefixos comuns)
 * - Cache no cliente também (session storage)
 * - Invalidar ao criar/editar entidades
 *
 * CASOS DE USO:
 * - Search bar com dropdown de sugestões
 * - Command palette (Cmd+K)
 * - Quick switcher
 * - Autocomplete em forms (selecionar contact, company)
 *
 * RETORNO:
 * - Array de até 10 sugestões
 * - Cada sugestão:
 *   * query: texto sugerido
 *   * type: entidade ou query histórica
 *   * count: quantos resultados teria
 *   * metadata: preview info
 * - Ordenado por relevância
 *
 * ERROS:
 * - Não deve falhar, retornar [] vazio se erro
 */
export const getSuggestions = async (query: string): Promise<SearchResult[]> => {
  const response = await api.get('/search/suggestions', {
    params: { q: query },
  });
  return extractData(response);
};

/**
 * Registra busca para analytics
 *
 * TODO: Implementar tracking completo de buscas
 *
 * FUNCIONALIDADES:
 * - Registrar query, filtros, resultados
 * - Tracking de clicks nos resultados
 * - Análise de zero-result queries
 * - Identificar queries populares
 * - Medir tempo até click
 * - A/B testing de ranking
 *
 * DADOS REGISTRADOS:
 * - Query: termo de busca original
 * - Filters: filtros aplicados (JSON)
 * - Results count: quantos resultados retornou
 * - Timestamp: quando foi feita
 * - UserId: quem buscou
 * - Session: sessão do usuário
 * - Source: de onde veio (header search, command palette, etc.)
 * - Click data (se clicar em resultado):
 *   * Qual resultado clicou (position, score)
 *   * Tempo até clicar
 *   * Se voltou e clicou outro
 * - Refinements: se mudou filtros/query depois
 *
 * PROCESSAMENTO:
 * - Não bloquear response da busca
 * - Enviar de forma assíncrona
 * - Queue no backend (Kafka, RabbitMQ, SQS)
 * - Processar em batch para analytics
 *
 * ANALYTICS GERADOS:
 * - Queries mais comuns (trending searches)
 * - Zero-result queries (para melhorar índice)
 * - Taxa de refinamento (usuário mudou busca)
 * - Click-through rate por posição
 * - Tempo médio até encontrar resultado
 * - Queries que levam a conversão (deal won, etc.)
 *
 * USO DOS DADOS:
 * - Melhorar ranking (clicks indicam relevância)
 * - Identificar gaps de conteúdo (muito zero-result)
 * - Personalização (histórico do usuário)
 * - Sugestões de autocomplete
 * - Dashboard de analytics de busca
 *
 * PRIVACIDADE:
 * - Anonimizar dados após X dias
 * - Não registrar queries sensíveis (detectar PII)
 * - Permitir opt-out de tracking
 * - LGPD compliance
 *
 * RETORNO:
 * - Void (fire and forget)
 * - Ou confirmação assíncrona
 */
export const logSearch = async (query: string, resultsCount: number): Promise<void> => {
  await api.post('/search/log', { query, resultsCount });
};
