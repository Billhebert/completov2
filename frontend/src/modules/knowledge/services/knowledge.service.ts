/**
 * Knowledge Service
 * Gerenciamento completo da base de conhecimento com artigos, categorias e sistema de busca
 */

import api, { extractData } from '../../../core/utils/api';
import { Article, Category, ArticleFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Busca artigos da base de conhecimento com suporte a filtros avançados
 *
 * TODO: Implementar sistema completo de busca de artigos
 *
 * FUNCIONALIDADES:
 * - Busca full-text usando elasticsearch ou similar no título, conteúdo e summary
 * - Suporte a operadores booleanos (AND, OR, NOT) para buscas complexas
 * - Highlighting dos termos encontrados nos resultados
 * - Busca fonética e correção automática de digitação (did you mean?)
 * - Suporte a sinônimos e termos relacionados
 *
 * FILTROS:
 * - Por categoria (único ou múltiplas categorias)
 * - Por status (draft, published, archived)
 * - Por tags (filtro AND/OR configurável)
 * - Por autor (userId)
 * - Por data de criação/publicação (range de datas)
 * - Por rating mínimo (calculado de helpful/notHelpful)
 * - Apenas artigos em destaque (featured)
 *
 * ORDENAÇÃO:
 * - Por relevância (score de busca) - padrão quando há termo de busca
 * - Por data de criação/publicação (desc/asc)
 * - Por número de visualizações (mais populares)
 * - Por rating (mais úteis)
 * - Por última atualização
 *
 * PAGINAÇÃO:
 * - Implementar cursor-based pagination para melhor performance
 * - Incluir total de resultados e páginas
 * - Suportar page size configurável (máx 100)
 *
 * OTIMIZAÇÕES:
 * - Implementar cache de 5 minutos para buscas frequentes
 * - Usar debounce no frontend para evitar muitas requisições
 * - Lazy loading de conteúdo completo (retornar apenas summary na listagem)
 *
 * ANALYTICS:
 * - Registrar termos de busca para análise posterior
 * - Tracking de clicks nos resultados para melhorar ranking
 *
 * RETORNO:
 * - Lista paginada com metadados (total, hasNext, hasPrev)
 * - Para cada artigo: id, título, summary, categoria, tags, autor, datas, stats (views, rating)
 * - Highlights dos termos de busca quando aplicável
 */
export const getArticles = async (
  params?: PaginationParams & ArticleFilters
): Promise<PaginatedResult<Article>> => {
  const response = await api.get('/knowledge/articles', { params });
  return extractData(response);
};

/**
 * Cria novo artigo na base de conhecimento
 *
 * TODO: Implementar criação completa de artigos
 *
 * VALIDAÇÕES OBRIGATÓRIAS:
 * - Título: mínimo 5, máximo 200 caracteres, não pode ser duplicado na mesma categoria
 * - Conteúdo: mínimo 50 caracteres, máximo 50.000 caracteres
 * - Categoria: deve existir e estar ativa, validar permissão do usuário na categoria
 * - Tags: máximo 10 tags, cada tag entre 2-30 caracteres, normalizar (lowercase, trim)
 * - Status inicial: sempre 'draft', apenas autores podem criar
 *
 * PROCESSAMENTO DE CONTEÚDO:
 * - Aceitar markdown ou HTML (detectar automaticamente)
 * - Sanitizar HTML para evitar XSS (usar DOMPurify ou similar)
 * - Processar markdown para HTML se necessário (usar marked ou remark)
 * - Extrair e otimizar imagens (converter para WebP, gerar thumbnails)
 * - Gerar summary automático se não fornecido:
 *   * Extrair primeiros 200 caracteres de texto puro
 *   * Remover formatação e caracteres especiais
 *   * Adicionar "..." se truncado
 *
 * FUNCIONALIDADES ADICIONAIS:
 * - Gerar slug automático do título (URL-friendly)
 * - Extrair keywords automaticamente do conteúdo para SEO
 * - Detectar idioma do conteúdo automaticamente
 * - Gerar índice (table of contents) automático dos headings
 * - Estimar tempo de leitura baseado em palavra/minuto
 *
 * PERMISSÕES:
 * - Verificar se usuário tem permissão 'knowledge.articles.create'
 * - Validar quota de artigos se aplicável
 * - Verificar se categoria permite criação pelo usuário
 *
 * METADADOS AUTOMÁTICOS:
 * - authorId: do usuário autenticado
 * - createdAt/updatedAt: timestamp atual
 * - views: inicializar com 0
 * - helpful/notHelpful: inicializar com 0
 * - version: inicializar com 1
 *
 * NOTIFICAÇÕES:
 * - Notificar moderadores da categoria se configurado
 * - Enviar confirmação para o autor
 *
 * RETORNO:
 * - Artigo criado completo com todos os campos
 * - Incluir URL de acesso ao artigo
 *
 * ERROS POSSÍVEIS:
 * - 400: Validação falhou (detalhar campo específico)
 * - 403: Sem permissão para criar artigos
 * - 404: Categoria não encontrada
 * - 409: Título duplicado na categoria
 * - 413: Conteúdo excede tamanho máximo
 */
export const createArticle = async (data: Partial<Article>): Promise<Article> => {
  const response = await api.post('/knowledge/articles', data);
  return extractData(response);
};

/**
 * Atualiza artigo existente
 *
 * TODO: Implementar atualização com versionamento
 *
 * VALIDAÇÕES:
 * - Artigo existe e não está arquivado
 * - Usuário é o autor OU tem permissão 'knowledge.articles.edit'
 * - Se publicado, validar que mudanças não quebram links existentes
 * - Validar campos conforme regras de criação
 *
 * VERSIONAMENTO:
 * - Criar snapshot da versão anterior antes de atualizar
 * - Armazenar em tabela article_versions com:
 *   * Todos os campos do artigo
 *   * Timestamp da versão
 *   * userId que fez a alteração
 *   * Diff das mudanças (opcional, para mostrar o que mudou)
 * - Incrementar campo 'version' do artigo
 * - Permitir reverter para versão anterior (implementar método separado)
 *
 * CAMPOS EDITÁVEIS:
 * - Título, conteúdo, summary, tags, categoryId
 * - featuredImage, metaDescription
 * - Não permitir mudar: id, authorId, createdAt, views, ratings
 *
 * REGRAS DE NEGÓCIO:
 * - Se mudar categoria, verificar permissões na nova categoria
 * - Se artigo estiver publicado, mudanças devem ir para revisão (opcional)
 * - Atualizar automaticamente 'updatedAt' para timestamp atual
 * - Reprocessar conteúdo (sanitização, imagens, etc.)
 * - Reindexar no sistema de busca
 *
 * STATUS:
 * - Se estava published e conteúdo mudou significativamente, mudar para 'under_review'
 * - Manter log de mudanças de status
 *
 * NOTIFICAÇÕES:
 * - Notificar seguidores do artigo sobre atualização importante
 * - Se mudou muito (>50% do conteúdo), marcar como "atualização major"
 *
 * CACHE:
 * - Invalidar cache do artigo após atualização
 * - Invalidar cache de listagens que incluem este artigo
 *
 * RETORNO:
 * - Artigo atualizado completo
 * - Número da nova versão
 * - Timestamp da atualização
 */
export const updateArticle = async (id: string, data: Partial<Article>): Promise<Article> => {
  const response = await api.put(`/knowledge/articles/${id}`, data);
  return extractData(response);
};

/**
 * Publica artigo (mudança de draft para published)
 *
 * TODO: Implementar workflow de publicação
 *
 * PRÉ-REQUISITOS:
 * - Artigo deve estar em status 'draft' ou 'under_review'
 * - Usuário deve ser autor OU ter permissão 'knowledge.articles.publish'
 * - Artigo deve estar completo (todos campos obrigatórios preenchidos)
 * - Conteúdo deve ter passado validação de qualidade:
 *   * Mínimo de caracteres atingido
 *   * Imagens com alt text
 *   * Links não quebrados (validação assíncrona)
 *   * Sem palavras proibidas/ofensivas
 *
 * PROCESSO DE PUBLICAÇÃO:
 * 1. Validar pré-requisitos acima
 * 2. Mudar status de 'draft' para 'published'
 * 3. Definir publishedAt com timestamp atual (apenas primeira publicação)
 * 4. Se é republicação, atualizar lastPublishedAt
 * 5. Gerar versão canônica do conteúdo
 * 6. Indexar no sistema de busca (Elasticsearch/Algolia)
 * 7. Gerar sitemap.xml atualizado para SEO
 * 8. Limpar cache de listagens
 *
 * NOTIFICAÇÕES:
 * - Se configurado, enviar email para seguidores da categoria
 * - Notificar in-app para usuários interessados nos tópicos
 * - Se artigo está em destaque, notificação push opcional
 * - Postar em canais integrados (Slack, Teams) se configurado
 *
 * ANALYTICS:
 * - Registrar evento de publicação
 * - Iniciar tracking de métricas (views, tempo de leitura, etc.)
 *
 * AGENDA DE PUBLICAÇÃO (OPCIONAL):
 * - Suportar publishAt futuro (scheduled publishing)
 * - Criar job para publicar automaticamente na data agendada
 * - Permitir cancelar publicação agendada
 *
 * PERMISSÕES:
 * - Autores podem publicar próprios artigos sem aprovação
 * - Ou implementar workflow de aprovação (depende de configuração):
 *   * Artigo vai para 'pending_approval'
 *   * Editor/Moderador deve aprovar
 *   * Autor recebe notificação de aprovação/rejeição
 *
 * RETORNO:
 * - Artigo com status atualizado
 * - publishedAt definido
 * - URL pública do artigo
 * - Estatísticas iniciais
 *
 * ERROS:
 * - 400: Artigo não está completo ou falhou validação
 * - 403: Sem permissão para publicar
 * - 404: Artigo não encontrado
 * - 409: Artigo já está publicado
 */
export const publishArticle = async (id: string): Promise<Article> => {
  const response = await api.post(`/knowledge/articles/${id}/publish`);
  return extractData(response);
};

/**
 * Registra avaliação de utilidade do artigo
 *
 * TODO: Implementar sistema de rating com analytics
 *
 * FUNCIONALIDADE:
 * - Permitir usuário marcar artigo como útil ou não útil
 * - Um voto por usuário por artigo (armazenar em article_ratings)
 * - Permitir mudar voto (de helpful para notHelpful ou vice-versa)
 * - Atualizar contadores helpful/notHelpful no artigo
 *
 * VALIDAÇÕES:
 * - Usuário deve estar autenticado
 * - Artigo deve estar publicado
 * - Artigo deve existir e não estar arquivado
 * - Parâmetro helpful deve ser booleano válido
 *
 * ARMAZENAMENTO:
 * - Tabela article_ratings:
 *   * articleId, userId, helpful (boolean), ratedAt, updatedAt
 *   * Constraint unique (articleId, userId)
 * - Se usuário já votou, fazer UPDATE ao invés de INSERT
 * - Incrementar/decrementar contadores no artigo:
 *   * Se novo voto helpful: article.helpful++
 *   * Se mudou de notHelpful para helpful: article.helpful++, article.notHelpful--
 *   * E vice-versa
 *
 * ANALYTICS E INSIGHTS:
 * - Calcular rating score: (helpful / (helpful + notHelpful)) * 100
 * - Se rating < 40%, marcar artigo para revisão
 * - Notificar autor se artigo receber muitos votos negativos
 * - Tracking de quando/onde usuários votam (posição na página)
 *
 * FEEDBACK OPCIONAL:
 * - Permitir comentário opcional junto com voto negativo
 * - "Por que este artigo não foi útil?": desatualizado, incompleto, erro, outro
 * - Armazenar feedback para análise posterior
 * - Enviar feedback para autor/moderador
 *
 * GAMIFICAÇÃO (OPCIONAL):
 * - Dar pontos/badges para autores de artigos bem avaliados
 * - Destacar artigos com >90% helpful
 *
 * RATE LIMITING:
 * - Prevenir spam de ratings do mesmo usuário
 * - Máximo 1 mudança de voto por artigo a cada 5 minutos
 *
 * RETORNO:
 * - Void (ou confirmaçãosimples)
 * - Opcionalmente retornar stats atualizados do artigo
 *
 * ERROS:
 * - 401: Usuário não autenticado
 * - 403: Artigo não pode ser avaliado (draft/archived)
 * - 404: Artigo não encontrado
 * - 429: Too many requests (rate limiting)
 */
export const rateArticle = async (id: string, helpful: boolean): Promise<void> => {
  await api.post(`/knowledge/articles/${id}/rate`, { helpful });
};

/**
 * Lista todas as categorias da base de conhecimento
 *
 * TODO: Implementar gestão hierárquica de categorias
 *
 * FUNCIONALIDADES:
 * - Retornar categorias em estrutura hierárquica (árvore)
 * - Suportar categorias aninhadas até N níveis (configurável, padrão 3)
 * - Cada categoria contém:
 *   * Informações básicas (id, name, description, icon, color)
 *   * Estatísticas (articleCount, subcategoryCount)
 *   * Subcategorias (children) recursivamente
 *   * parentId para navegação reversa
 *
 * ORDENAÇÃO:
 * - Respeitar campo 'order' customizado
 * - Ordenação alfabética como fallback
 * - Categorias com mais artigos podem aparecer primeiro (configurável)
 *
 * FILTROS OPCIONAIS:
 * - Apenas categorias ativas (isActive = true)
 * - Apenas categorias visíveis ao usuário (baseado em permissões)
 * - Apenas categorias com artigos publicados
 * - Por nível na hierarquia (level = 1 retorna apenas raiz)
 *
 * METADADOS:
 * - articleCount: total de artigos (incluindo subcategorias ou não)
 * - publishedArticlesCount: apenas artigos publicados
 * - lastArticlePublishedAt: data do artigo mais recente
 * - Breadcrumb path para cada categoria
 *
 * PERMISSÕES:
 * - Filtrar categorias que usuário não tem acesso
 * - Marcar categorias que usuário pode editar/criar artigos
 *
 * CACHE:
 * - Estrutura de categorias muda pouco, cache de 1 hora
 * - Invalidar ao criar/editar/deletar categoria
 *
 * OTIMIZAÇÕES:
 * - Usar query recursiva (CTE) ou closure table no banco
 * - Retornar árvore completa de uma vez ao invés de N queries
 *
 * CASOS DE USO:
 * - Menu de navegação na KB
 * - Seletor de categoria ao criar artigo
 * - Breadcrumbs na visualização de artigo
 * - Filtros de busca
 *
 * RETORNO:
 * - Array de categorias raiz, cada uma com children recursivo
 * - Ou flat array com parentId (dependendo de parâmetro)
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/knowledge/categories');
  return extractData(response);
};

/**
 * Cria nova categoria na base de conhecimento
 *
 * TODO: Implementar criação de categoria com validações
 *
 * VALIDAÇÕES:
 * - Nome: obrigatório, 3-100 caracteres, único no mesmo nível
 * - Descrição: opcional, máximo 500 caracteres
 * - ParentId: se fornecido, deve existir e estar ativo
 * - Validar profundidade máxima da hierarquia (não exceder limite)
 * - Slug: gerar automaticamente do nome, único globalmente
 *
 * PERMISSÕES:
 * - Apenas usuários com 'knowledge.categories.create'
 * - Ou role de Admin/Editor
 *
 * CAMPOS OPCIONAIS:
 * - icon: nome do ícone (Material Icons, Font Awesome, etc.)
 * - color: hex color para UI (#FF5733)
 * - order: ordem de exibição (número inteiro)
 * - isActive: padrão true
 * - metadata: JSON com configurações extras
 *
 * REGRAS DE NEGÓCIO:
 * - Se parentId fornecido, herdar algumas configs da categoria pai
 * - Gerar path completo (ex: "tecnologia/programacao/javascript")
 * - Calcular level na hierarquia automaticamente
 *
 * INICIALIZAÇÃO:
 * - articleCount = 0
 * - createdAt = now
 * - createdBy = userId autenticado
 *
 * NOTIFICAÇÕES:
 * - Notificar editores sobre nova categoria
 * - Se categoria raiz, pode precisar aprovação
 *
 * RETORNO:
 * - Categoria criada com todos os campos
 * - Incluir path completo e level
 *
 * ERROS:
 * - 400: Validação falhou
 * - 403: Sem permissão
 * - 404: Parent category não encontrada
 * - 409: Nome duplicado no mesmo nível
 */
export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  const response = await api.post('/knowledge/categories', data);
  return extractData(response);
};
