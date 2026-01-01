/** CMMS Types - Computerized Maintenance Management System */
export interface Asset { id: string; name: string; type: string; serialNumber: string; location: string; status: 'operational' | 'maintenance' | 'offline'; lastMaintenanceAt?: string; }
export interface MaintenanceOrder { id: string; assetId: string; type: 'preventive' | 'corrective'; priority: 'low' | 'medium' | 'high'; assignedTo?: string; status: 'open' | 'in_progress' | 'completed'; dueDate: string; }
