import api from '../../../core/utils/api';

/**
 * Narrative service
 *
 * This service allows generating narratives based on knowledge nodes (zettels).
 * The backend collects relevant evidence based on the provided parameters
 * and uses a large language model to synthesize a narrative in the desired
 * format【88407885655133†L10-L59】. The response includes a title,
 * the generated content and references to the source zettels.
 */

export interface NarrativeParams {
  /**
   * Type of narrative (e.g., "projeto", "cliente", etc.). Defines the
   * subject of the report and may influence the prompt passed to the LLM.
   */
  type: string;
  /** Format of the narrative. Accepted values include:
   *  - `summary`: executive summary of evidence【88407885655133†L71-L82】
   *  - `timeline`: chronological timeline of events【88407885655133†L71-L82】
   *  - `lessons`: lessons learned【88407885655133†L71-L82】
   *  - `risks`: risks and critical decisions【88407885655133†L71-L82】
   */
  format: string;
  /** Optional ID of a related entity (e.g., contact or deal). When provided,
   * only evidences linked to this entity will be included【88407885655133†L26-L34】.
   */
  entityId?: string;
  /** Optional start date (ISO string) to filter evidences【88407885655133†L30-L33】. */
  startDate?: string;
  /** Optional end date (ISO string) to filter evidences【88407885655133†L30-L34】. */
  endDate?: string;
}

export interface NarrativeResponse {
  title: string;
  content: string;
  sources: Array<{ nodeId: string; title: string; type: string }>;
  generatedAt: string;
}

class NarrativeService {
  private baseUrl = '/narrative';

  /**
   * Generate a narrative from evidence (knowledge nodes). You must specify
   * both `type` and `format` for the narrative. Optionally you can
   * restrict the evidence by entity ID or by a date range【88407885655133†L13-L34】.
   */
  async generateNarrative(params: NarrativeParams): Promise<NarrativeResponse> {
    const response = await api.post(`${this.baseUrl}/generate`, params);
    return response.data;
  }
}

export const narrativeService = new NarrativeService();
export default narrativeService;