/**
 * ERP Service
 *
 * Este serviço oferece funções para interagir com os recursos de ERP
 * expostos pelo backend. Atualmente, o módulo ERP possui um conjunto
 * enxuto de rotas para listar e criar produtos, conforme definido no
 * `backend/src/modules/erp/index.ts`【358319779755761†L5-L20】. À medida que
 * novas funcionalidades (como pagamentos, relatórios financeiros e ordens
 * de compra) forem expostas, este serviço poderá ser estendido com
 * métodos adicionais.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Obtém a lista de produtos cadastrados no ERP. O backend retorna até 100
 * produtos por vez e aplica o filtro por empresa do usuário autenticado【358319779755761†L5-L11】.
 *
 * @returns Array de produtos com seus campos completos (nome, preço, estoque, etc.).
 */
export const getProducts = async (): Promise<any[]> => {
  const response = await api.get('/erp/products');
  return extractData(response);
};

/**
 * Cria um novo produto no ERP. Os campos aceitos são definidos pela API
 * Prisma do backend; apenas os campos básicos são documentados aqui【358319779755761†L13-L18】.
 *
 * @param product Dados do produto a ser criado.
 * @returns Produto criado.
 */
export const createProduct = async (product: Record<string, any>): Promise<any> => {
  const response = await api.post('/erp/products', product);
  return extractData(response);
};

// Nota: Outros recursos do ERP, como processamento de pagamentos, faturas
// multimoeda, ordens de compra e relatórios financeiros, ainda não foram
// integrados ao `erpModule` no backend. Quando essas rotas forem
// disponibilizadas sob o prefixo `/api/v1/erp`, adicione aqui métodos
// equivalentes para consumir esses endpoints.