/** Partnerships Service - TODO: Gestão de parcerias */
import api, { extractData } from '../../../core/utils/api';
import { Partner, PartnerProgram } from '../types';

/** TODO: Listar parceiros */
export const getPartners = async (): Promise<Partner[]> => {
  const response = await api.get('/partnerships/partners');
  return extractData(response);
};

/** TODO: Criar parceiro */
export const createPartner = async (data: Partial<Partner>): Promise<Partner> => {
  const response = await api.post('/partnerships/partners', data);
  return extractData(response);
};

/** TODO: Buscar programas de parceria */
export const getPrograms = async (): Promise<PartnerProgram[]> => {
  const response = await api.get('/partnerships/programs');
  return extractData(response);
};
