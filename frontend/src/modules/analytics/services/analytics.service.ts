/**
 * Analytics Service
 * Sistema completo de métricas, dashboards e relatórios
 * Integração com ferramentas BI e exportação de dados
 */

import api, { extractData } from '../../../core/utils/api';
import { Metric, ChartData, Report } from '../types';

/**
 * Busca métricas principais (KPIs) do dashboard
 *
 * TODO: Implementar sistema completo de KPIs e métricas
 *
 * FUNCIONALIDADES:
 * - KPIs principais em tempo real
 * - Comparação com período anterior
 * - Indicadores de tendência (up/down)
 * - Metas e progresso
 * - Alertas de thresholds
 * - Drill-down para detalhes
 *
 * PERÍODOS SUPORTADOS:
 * - today: hoje vs ontem
 * - week: últimos 7 dias vs 7 dias anteriores
 * - month: último mês vs mês anterior
 * - quarter: últimos 3 meses vs trimestre anterior
 * - year: últimos 12 meses vs ano anterior  
 * - custom: range customizado (startDate, endDate)
 * - ytd: year-to-date (1º jan até hoje)
 * - mtd: month-to-date (1º do mês até hoje)
 *
 * MÉTRICAS POR MÓDULO:
 *
 * CRM/SALES:
 * - Total MRR (Monthly Recurring Revenue)
 * - New MRR (novos contratos este mês)
 * - Churn MRR (cancelamentos)
 * - ARR (Annual Recurring Revenue)
 * - Total deals (pipeline value)
 * - Deals won/lost (count e value)
 * - Win rate (%)
 * - Average deal size
 * - Sales cycle length (dias médios)
 * - Leads gerados
 * - Conversion rate (lead → deal → won)
 * - CAC (Customer Acquisition Cost)
 * - LTV (Lifetime Value)
 * - LTV/CAC ratio
 *
 * OMNICHANNEL/SUPPORT:
 * - Total conversations
 * - Open conversations
 * - Resolved conversations
 * - First Response Time (média)
 * - Resolution Time (média)
 * - CSAT Score (1-5)
 * - NPS (Net Promoter Score)
 * - Conversations per agent
 * - SLA compliance (%)
 * - Backlog size
 *
 * CONHECIMENTO/CONTENT:
 * - Total artigos
 * - Artigos publicados (período)
 * - Page views
 * - Unique visitors
 * - Average time on page
 * - Bounce rate
 * - Most viewed articles
 * - Articles rating (helpful/not helpful)
 * - Search queries (trending)
 *
 * USUÁRIOS/ATIVIDADE:
 * - Active users (DAU, MAU)
 * - New signups
 * - User retention rate
 * - Session duration (média)
 * - Pages per session
 * - Top features used
 * - Login frequency
 *
 * SISTEMA:
 * - API requests (count)
 * - API latency (p50, p95, p99)
 * - Error rate (%)
 * - Uptime (%)
 * - Storage used (GB)
 * - Database query time (média)
 *
 * CÁLCULO DE VARIAÇÃO:
 * - Absoluta: atual - anterior (ex: +50 deals)
 * - Percentual: ((atual - anterior) / anterior) * 100 (ex: +25%)
 * - Tipo de mudança:
 *   * 'increase': valor subiu (positivo ou negativo depende métrica)
 *   * 'decrease': valor caiu
 *   * 'stable': variação < 5%
 * - Cor/indicador:
 *   * Verde: melhoria (revenue +, churn -)
 *   * Vermelho: piora (revenue -, churn +)
 *   * Amarelo: estável
 *
 * METAS E PROGRESSO:
 * - Cada métrica pode ter meta configurada
 * - Calcular % de progresso em relação à meta
 * - Status: on_track, at_risk, behind
 * - Projeção: baseado em tendência, vai atingir meta?
 * - Alertas: notificar se muito abaixo da meta
 *
 * FORMATO DOS DADOS:
 * - name: nome da métrica (ex: "Total MRR")
 * - value: valor atual (número)
 * - formattedValue: valor formatado (ex: "R$ 125.500,00", "45%", "2.5k")
 * - change: variação absoluta
 * - changePercent: variação percentual
 * - changeType: 'increase' | 'decrease' | 'stable'
 * - trend: 'up' | 'down' | 'flat'
 * - goal: meta configurada (opcional)
 * - progress: % de progresso em relação à meta
 * - sparkline: array de valores para mini-gráfico (últimos 30 dias)
 *
 * CACHE:
 * - Cache de 5-15 minutos (depende da métrica)
 * - Métricas de sistema: cache 1 minuto
 * - Métricas de negócio: cache 15 minutos
 * - Invalidar ao receber eventos relevantes
 * - Background jobs para pré-calcular métricas pesadas
 *
 * PERFORMANCE:
 * - Pré-agregar dados em tabelas separadas
 * - Usar materialized views no PostgreSQL
 * - OLAP database para analytics (ClickHouse, Druid)
 * - Calcular métricas em batch (cron jobs)
 * - Não calcular em tempo real para queries lentas
 *
 * PERMISSÕES:
 * - Filtrar métricas por permissão
 * - Gerente vê apenas seu time
 * - Admin vê tudo
 * - Vendedor vê apenas próprias métricas
 *
 * DRILL-DOWN:
 * - Clicar em métrica abre detalhamento
 * - Link para página com gráfico completo
 * - Filtros para segmentar (por time, produto, região)
 *
 * RETORNO:
 * - Array de Metric objects
 * - Cada um com valores, variações, trends
 * - Ordenado por importância/configuração
 *
 * ERROS:
 * - 400: Período inválido
 * - 422: Datas fora do range permitido
 */
export const getMetrics = async (period?: string): Promise<Metric[]> => {
  const response = await api.get('/analytics/metrics', { params: { period } });
  return extractData(response);
};

/**
 * Busca dados para renderizar gráficos
 *
 * TODO: Implementar engine de gráficos com múltiplos tipos
 *
 * TIPOS DE GRÁFICOS:
 * - line: evolução temporal (revenue over time, users growth)
 * - bar: comparações (deals por stage, conversas por canal)
 * - pie/donut: distribuição (market share, deal sources)
 * - area: volume acumulado (cumulative revenue)
 * - scatter: correlação (deal size vs sales cycle)
 * - heatmap: atividade (commits por dia/hora)
 * - funnel: conversão (lead → oportunity → deal → won)
 * - gauge: progresso de meta (quota attainment)
 * - treemap: hierarquia (revenue por produto/categoria)
 * - sankey: fluxos (customer journey)
 *
 * AGREGAÇÕES TEMPORAIS:
 * - hour: por hora (últimas 24h)
 * - day: por dia (último mês)
 * - week: por semana (último trimestre)
 * - month: por mês (último ano)
 * - quarter: por trimestre (últimos 4 trimestres)
 * - year: por ano (histórico completo)
 *
 * MÚLTIPLAS SÉRIES:
 * - Comparar múltiplas métricas no mesmo gráfico
 * - Ex: revenue vs custos, deals won vs lost
 * - Diferentes eixos Y se escalas muito diferentes
 * - Cores distintas por série
 * - Legendas configuráveis
 *
 * FORMATO DOS DADOS:
 * - labels: array de labels do eixo X (datas, categorias)
 * - datasets: array de séries
 *   * label: nome da série
 *   * data: array de valores
 *   * backgroundColor/borderColor: cores
 *   * type: override de tipo para série específica
 * - options: configurações do gráfico
 *   * title, subtitle
 *   * axes labels
 *   * tooltips format
 *   * legends position
 *
 * INTERATIVIDADE:
 * - Hover mostra tooltip com detalhes
 * - Click em ponto faz drill-down
 * - Zoom in/out em gráficos de linha
 * - Pan para navegar dados
 * - Export para PNG/SVG
 *
 * FILTROS E SEGMENTAÇÃO:
 * - Filtrar por dimensões (team, product, region)
 * - Segmentar por categoria
 * - Agrupar dados (sum, avg, count, min, max)
 * - Aplicar cálculos (growth rate, moving average)
 *
 * BIBLIOTECAS FRONTEND:
 * - Chart.js: gráficos básicos responsivos
 * - Recharts: componentes React nativos
 * - D3.js: visualizações customizadas complexas
 * - ApexCharts: gráficos interativos modernos
 * - Highcharts: gráficos corporativos (licença paga)
 *
 * PERFORMANCE:
 * - Limitar pontos de dados (max 1000 pontos)
 * - Sampling para datasets grandes
 * - Agregar dados no backend
 * - Cache de queries pesadas
 * - Lazy loading de gráficos (render on scroll)
 *
 * RETORNO:
 * - ChartData formatado para biblioteca escolhida
 * - Labels e datasets prontos para render
 * - Configurações recomendadas
 * - Metadados: query executada, tempo, count
 */
export const getChartData = async (
  type: string,
  period: string
): Promise<ChartData> => {
  const response = await api.get('/analytics/charts', {
    params: { type, period },
  });
  return extractData(response);
};

/**
 * Gera relatório customizado
 *
 * TODO: Implementar engine de relatórios com templates
 *
 * TIPOS DE RELATÓRIOS:
 * - sales: relatório de vendas (deals, revenue, pipeline)
 * - support: relatório de atendimento (CSAT, FRT, RT)
 * - marketing: relatório de marketing (leads, conversions, CAC)
 * - financial: relatório financeiro (receita, despesas, lucro)
 * - operations: relatório operacional (produtividade, SLAs)
 * - executive: executive summary (high-level KPIs)
 * - custom: relatório customizado do usuário
 *
 * COMPONENTES DO RELATÓRIO:
 * - Header: logo, título, período, data geração
 * - Executive summary: principais insights
 * - KPIs: métricas chave em cards
 * - Charts: gráficos relevantes
 * - Tables: tabelas de dados detalhados
 * - Insights: análises automáticas (tendências, anomalias)
 * - Footer: disclaimers, contato
 *
 * FORMATOS DE EXPORTAÇÃO:
 * - PDF: relatório visual bonito (usando Puppeteer/wkhtmltopdf)
 * - Excel: dados em planilhas (usando ExcelJS)
 * - CSV: dados brutos para análise
 * - PowerPoint: slides para apresentação
 * - HTML: página web interativa
 * - JSON: dados estruturados para integração
 *
 * FILTROS:
 * - Período: range de datas
 * - Segmentação: por team, produto, região, canal
 * - Métricas: escolher quais KPIs incluir
 * - Detalhamento: summary vs detailed
 * - Comparação: vs período anterior, vs meta
 *
 * GERAÇÃO:
 * - Assíncrona: não bloquear UI
 * - Queue de jobs (Bull, BullMQ)
 * - Progress tracking (0-100%)
 * - Notificar quando pronto
 * - Armazenar em S3/GCS
 * - Link de download temporário (expira em 24h)
 *
 * TEMPLATES:
 * - Templates pré-configurados por tipo
 * - Usuário pode salvar templates customizados
 * - Versionamento de templates
 * - Compartilhar templates entre equipe
 *
 * AGENDAMENTO:
 * - Agendar geração recorrente (diário, semanal, mensal)
 * - Enviar por email automaticamente
 * - Distribuir para stakeholders
 * - Cron jobs para automação
 *
 * BRANDING:
 * - Logo da empresa
 * - Cores corporativas
 * - Fonte customizada
 * - Cabeçalho/rodapé customizado
 *
 * INSIGHTS AUTOMÁTICOS:
 * - Análise de tendências (ML)
 * - Detecção de anomalias
 * - Forecasting (previsões)
 * - Recomendações baseadas em dados
 * - Highlight de mudanças significativas
 *
 * RETORNO:
 * - Report object com:
 *   * id: ID do job de geração
 *   * status: queued, generating, completed, failed
 *   * progress: 0-100
 *   * downloadUrl: quando completado
 *   * expiresAt: quando link expira
 *   * format: PDF, Excel, etc.
 *   * size: tamanho do arquivo em bytes
 */
export const generateReport = async (type: string, filters?: Record<string, unknown>): Promise<Report> => {
  const response = await api.post('/analytics/reports', { type, filters });
  return extractData(response);
};

/**
 * Registra evento customizado para analytics
 *
 * TODO: Implementar event tracking completo
 *
 * CASOS DE USO:
 * - Product analytics (feature usage)
 * - User behavior tracking
 * - Funnel analysis
 * - A/B testing
 * - Business events
 *
 * EVENTOS COMUNS:
 * - page_view: visualização de página
 * - button_click: clique em botão específico
 * - form_submit: envio de formulário
 * - feature_used: uso de feature
 * - search_performed: busca realizada
 * - file_downloaded: download de arquivo
 * - email_sent: email enviado
 * - deal_created/won/lost: eventos de negócio
 * - error_occurred: erros da aplicação
 *
 * PROPRIEDADES:
 * - userId: quem executou
 * - sessionId: sessão do usuário
 * - timestamp: quando aconteceu
 * - page: em qual página
 * - properties: dados específicos do evento (JSON)
 *   * deal_id, deal_value para deal_won
 *   * search_query, results_count para search
 *   * feature_name para feature_used
 *   * error_message, stack_trace para error
 *
 * PROCESSAMENTO:
 * - Envio assíncrono (não bloquear app)
 * - Batch events antes de enviar (reduz requests)
 * - Queue no backend
 * - Stream processing (Kafka, Kinesis)
 * - Armazenar em data warehouse (BigQuery, Snowflake)
 *
 * ANALYTICS GERADOS:
 * - Feature adoption (quantos usam X)
 * - User journey (caminho mais comum)
 * - Drop-off points (onde usuários abandonam)
 * - Time to value (quanto tempo até primeiro sucesso)
 * - Retention cohorts
 * - Funnel conversion rates
 *
 * INTEGRAÇÕES:
 * - Google Analytics
 * - Mixpanel
 * - Amplitude
 * - Segment (hub de analytics)
 * - Custom data warehouse
 *
 * RETORNO:
 * - Void (fire and forget)
 * - Ou confirmação assíncrona
 */
export const trackEvent = async (event: string, properties?: Record<string, unknown>): Promise<void> => {
  await api.post('/analytics/events', { event, properties });
};
