import api from '@/core/utils/api';

/**
 * CMMS (Computerized Maintenance Management System) service
 *
 * This service wraps all HTTP interactions with the CMMS backend. It allows
 * the frontend to manage assets, maintenance plans, maintenance records,
 * downtime events and spare parts inventory. Each function corresponds to
 * an API endpoint defined in the backend’s `cmms` module. For more details
 * on the business logic and validations, see the backend implementation
 * around the referenced lines below.
 */
class CmmsService {
  /**
   * List assets with optional filters.
   *
   * On the backend this hits GET `/api/v1/cmms/assets` and supports
   * filtering by `category` and `status`【45929943943593†L14-L34】. Assets are
   * returned with counts of maintenance plans, history and child assets.
   *
   * @param params Optional query parameters { category, status }
   */
  async getAssets(params?: { category?: string; status?: string }) {
    const { data } = await api.get('/cmms/assets', { params });
    return data?.data;
  }

  /**
   * Create a new asset. Requires permission `asset.create`.
   *
   * The backend endpoint POST `/api/v1/cmms/assets` stores details such as
   * name, assetTag, category, type, manufacturer, model, serial number,
   * purchase date and cost, location and optional parent asset ID【45929943943593†L40-L61】.
   *
   * @param payload Asset data for creation
   */
  async createAsset(payload: {
    name: string;
    assetTag?: string;
    category?: string;
    type?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    location?: string;
    specifications?: any;
    parentAssetId?: string | null;
  }) {
    const { data } = await api.post('/cmms/assets', payload);
    return data?.data;
  }

  /**
   * Get a single asset by ID, including relations.
   *
   * The backend returns the asset with its parent asset, child assets,
   * active maintenance plans, last 10 maintenance records and meters【45929943943593†L68-L80】.
   *
   * @param id Asset identifier
   */
  async getAsset(id: string) {
    const { data } = await api.get(`/cmms/assets/${id}`);
    return data?.data;
  }

  /**
   * Update an existing asset. Requires permission `asset.update`.
   *
   * Calls PATCH `/cmms/assets/:id` with partial fields【45929943943593†L86-L93】.
   * @param id Asset identifier
   * @param payload Partial asset fields to update
   */
  async updateAsset(id: string, payload: Record<string, any>) {
    const { data } = await api.patch(`/cmms/assets/${id}`, payload);
    return data?.data;
  }

  /**
   * List maintenance plans. Only active plans are returned【45929943943593†L100-L107】.
   */
  async getMaintenancePlans() {
    const { data } = await api.get('/cmms/maintenance-plans');
    return data?.data;
  }

  /**
   * Create a maintenance plan. Requires permission `maintenance.create`.
   *
   * The backend accepts fields such as assetId, name, description, type,
   * frequency, tasks, estimated duration, assignment and priority【45929943943593†L113-L133】.
   * @param payload Maintenance plan data
   */
  async createMaintenancePlan(payload: {
    assetId: string;
    name: string;
    description?: string;
    type?: string;
    frequency?: string;
    tasks?: any;
    estimatedDuration?: number;
    assignedToId?: string;
    priority?: string;
  }) {
    const { data } = await api.post('/cmms/maintenance-plans', payload);
    return data?.data;
  }

  /**
   * List maintenance records with optional filters.
   *
   * GET `/cmms/maintenance-records` returns up to 100 records filtered by
   * assetId and type【45929943943593†L140-L154】.
   * @param params Optional query parameters { assetId, type }
   */
  async getMaintenanceRecords(params?: { assetId?: string; type?: string }) {
    const { data } = await api.get('/cmms/maintenance-records', { params });
    return data?.data;
  }

  /**
   * Create a maintenance record. Requires permission `maintenance.create`.
   *
   * The backend calculates duration and total cost and updates the maintenance
   * plan’s last performed date if a planId is provided【45929943943593†L160-L197】.
   * @param payload Maintenance record data
   */
  async createMaintenanceRecord(payload: {
    assetId: string;
    planId?: string;
    type: string;
    title: string;
    description?: string;
    performedBy?: string;
    startTime: string;
    endTime?: string;
    partsUsed?: any;
    laborCost?: number;
    partsCost?: number;
    outcome?: string;
    notes?: string;
  }) {
    const { data } = await api.post('/cmms/maintenance-records', payload);
    return data?.data;
  }

  /**
   * Report downtime for an asset. This sets the asset status to down【45929943943593†L202-L224】.
   *
   * @param payload Downtime data { assetId, reason, description, impact, cost }
   */
  async reportDowntime(payload: {
    assetId: string;
    reason: string;
    description?: string;
    impact?: string;
    cost?: number;
  }) {
    const { data } = await api.post('/cmms/downtime', payload);
    return data?.data;
  }

  /**
   * Resolve a downtime event. Calculates duration and sets asset status back to
   * operational【45929943943593†L232-L254】.
   *
   * @param id Downtime identifier
   */
  async resolveDowntime(id: string) {
    const { data } = await api.patch(`/cmms/downtime/${id}/resolve`);
    return data?.data;
  }

  /**
   * List all spare parts in inventory【45929943943593†L262-L268】.
   */
  async getSpareParts() {
    const { data } = await api.get('/cmms/spare-parts');
    return data?.data;
  }

  /**
   * List spare parts that are low in stock【45929943943593†L274-L285】.
   */
  async getLowStockSpareParts() {
    const { data } = await api.get('/cmms/spare-parts/low-stock');
    return data?.data;
  }

  /**
   * Create a new spare part record. Requires permission `inventory.create`【45929943943593†L291-L312】.
   *
   * @param payload Spare part data
   */
  async createSparePart(payload: {
    partNumber: string;
    name: string;
    description?: string;
    category?: string;
    manufacturer?: string;
    supplier?: string;
    unitCost?: number;
    quantityOnHand?: number;
    minQuantity?: number;
    maxQuantity?: number;
    location?: string;
  }) {
    const { data } = await api.post('/cmms/spare-parts', payload);
    return data?.data;
  }

  /**
   * Record a spare part movement (in or out) and update inventory【45929943943593†L317-L344】.
   *
   * @param partId Identifier of the spare part
   * @param payload Movement details { type, quantity, reason, reference, notes }
   */
  async recordSparePartMovement(
    partId: string,
    payload: {
      type: 'in' | 'out';
      quantity: number;
      reason?: string;
      reference?: string;
      notes?: string;
    }
  ) {
    const { data } = await api.post(`/cmms/spare-parts/${partId}/movement`, payload);
    return data?.data;
  }
}

export const cmmsService = new CmmsService();
export default cmmsService;