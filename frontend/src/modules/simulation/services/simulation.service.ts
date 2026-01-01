import api from '../../../core/utils/api';

/**
 * Simulation service
 *
 * Provides client-side access to the simulation endpoints. A simulation
 * consists of creating and managing training scenarios (scripts with
 * personas and rubrics) and running sessions where a user interacts
 * with a persona and receives feedback from an AI evaluator. These
 * endpoints map to the backend routes defined under `/api/v1/simulation`.
 *
 * The service includes:
 * - **listScenarios**: retrieve active simulation scenarios filtered by
 *   type【769830315344270†L16-L33】.
 * - **createScenario**: create a new scenario (admin/supervisor only) with
 *   attributes like title, description, type, persona, rubric and
 *   difficulty【769830315344270†L43-L64】.
 * - **startSimulation**: initiate a simulation session for a given
 *   scenario, returning the session ID and initial persona message【769830315344270†L82-L125】.
 * - **sendMessage**: add a user message to an ongoing session and receive
 *   the persona’s response【769830315344270†L134-L184】.
 * - **endSimulation**: finalize a session and receive a scored
 *   evaluation with feedback【769830315344270†L191-L230】.
 * - **getHistory**: list the recent simulation sessions of the current
 *   user【769830315344270†L237-L255】.
 */

export interface ScenarioInput {
  title: string;
  description: string;
  type: string;
  persona: any;
  rubric: any;
  difficulty?: number;
  estimatedDuration?: number;
}

class SimulationService {
  private baseUrl = '/simulation';

  async listScenarios(type?: string) {
    const params = type ? { type } : undefined;
    const response = await api.get(`${this.baseUrl}/scenarios`, { params });
    return response.data.data;
  }

  async createScenario(scenario: ScenarioInput) {
    const response = await api.post(`${this.baseUrl}/scenarios`, scenario);
    return response.data;
  }

  async startSimulation(scenarioId: string) {
    const response = await api.post(`${this.baseUrl}/start`, { scenarioId });
    return response.data;
  }

  async sendMessage(sessionId: string, message: string) {
    const response = await api.post(`${this.baseUrl}/${sessionId}/message`, { message });
    return response.data;
  }

  async endSimulation(sessionId: string) {
    const response = await api.post(`${this.baseUrl}/${sessionId}/end`);
    return response.data;
  }

  async getHistory() {
    const response = await api.get(`${this.baseUrl}/history`);
    return response.data.data;
  }
}

export const simulationService = new SimulationService();
export default simulationService;