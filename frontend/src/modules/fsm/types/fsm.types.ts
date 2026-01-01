/** FSM Types - Field Service Management */
export interface ServiceOrder { id: string; customerId: string; customerName: string; address: string; type: string; priority: 'low' | 'medium' | 'high'; technicianId?: string; status: 'scheduled' | 'in_progress' | 'completed'; scheduledAt: string; }
export interface Technician { id: string; name: string; skills: string[]; currentLocation?: { lat: number; lng: number }; availability: 'available' | 'busy' | 'offline'; }
