// web/src/pages/FSMPage.tsx
import { useEffect, useState } from 'react';
import {
  Plus,
  Wrench,
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { useFSMStore } from '../store/fsmStore';
import type { WorkOrder, CreateWorkOrder } from '../types/fsm';
import toast from 'react-hot-toast';

export default function FSMPage() {
  const {
    workOrders,
    technicians,
    isLoading,
    fetchWorkOrders,
    fetchTechnicians,
    createWorkOrder,
    assignWorkOrder,
    startWorkOrder,
    completeWorkOrder,
  } = useFSMStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchWorkOrders();
    fetchTechnicians();
  }, []);

  const handleCreateWorkOrder = async (data: CreateWorkOrder) => {
    try {
      await createWorkOrder(data);
      toast.success('Work order created successfully');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create work order');
    }
  };

  const handleAssignWorkOrder = async (id: string, technicianId: string) => {
    try {
      await assignWorkOrder(id, technicianId);
      toast.success('Work order assigned successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign work order');
    }
  };

  const handleStartWorkOrder = async (id: string) => {
    try {
      await startWorkOrder(id);
      toast.success('Work order started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start work order');
    }
  };

  const handleCompleteWorkOrder = async (id: string) => {
    try {
      await completeWorkOrder(id);
      toast.success('Work order completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete work order');
    }
  };

  const statusColumns = [
    { status: 'open', label: 'Open', color: 'bg-gray-500' },
    { status: 'assigned', label: 'Assigned', color: 'bg-blue-500' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { status: 'completed', label: 'Completed', color: 'bg-green-500' },
  ];

  const filteredOrders =
    selectedStatus === 'all'
      ? workOrders
      : workOrders.filter((wo) => wo.status === selectedStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Field Service Management</h1>
          <p className="text-muted-foreground mt-2">Manage work orders and field technicians</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const count = workOrders.filter((wo) => wo.status === col.status).length;
          return (
            <div key={col.status} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{col.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const orders = workOrders.filter((wo) => wo.status === col.status);

          return (
            <div key={col.status} className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-foreground">
                  {col.label} ({orders.length})
                </h3>
              </div>

              <div className="space-y-3">
                {orders.map((order) => (
                  <WorkOrderCard
                    key={order.id}
                    order={order}
                    technicians={technicians}
                    onAssign={(techId) => handleAssignWorkOrder(order.id, techId)}
                    onStart={() => handleStartWorkOrder(order.id)}
                    onComplete={() => handleCompleteWorkOrder(order.id)}
                  />
                ))}

                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No work orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          technicians={technicians}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkOrder}
        />
      )}
    </div>
  );
}

// Work Order Card Component
function WorkOrderCard({
  order,
  technicians,
  onAssign,
  onStart,
  onComplete,
}: {
  order: WorkOrder;
  technicians: any[];
  onAssign: (technicianId: string) => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const priorityColors = {
    low: 'bg-gray-500/10 text-gray-600',
    medium: 'bg-blue-500/10 text-blue-600',
    high: 'bg-orange-500/10 text-orange-600',
    urgent: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-foreground text-sm">{order.title}</h4>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            priorityColors[order.priority]
          }`}
        >
          {order.priority}
        </span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{order.description}</p>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{order.location.address}</span>
        </div>

        {order.technician && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{order.technician.userId}</span>
          </div>
        )}

        {order.scheduledStart && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(order.scheduledStart).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === 'open' && technicians.length > 0 && (
          <select
            onChange={(e) => onAssign(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
          >
            <option value="">Assign...</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.userId}
              </option>
            ))}
          </select>
        )}

        {order.status === 'assigned' && (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <PlayCircle className="h-3 w-3" />
            Start
          </button>
        )}

        {order.status === 'in_progress' && (
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            <CheckCircle className="h-3 w-3" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
}

// Create Work Order Modal Component
function CreateWorkOrderModal({
  technicians,
  onClose,
  onCreate,
}: {
  technicians: any[];
  onClose: () => void;
  onCreate: (data: CreateWorkOrder) => void;
}) {
  const [formData, setFormData] = useState<CreateWorkOrder>({
    title: '',
    description: '',
    type: 'maintenance',
    priority: 'medium',
    location: { address: '' },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Work Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="installation">Installation</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Location Address</label>
            <input
              type="text"
              required
              value={formData.location.address}
              onChange={(e) =>
                setFormData({ ...formData, location: { address: e.target.value } })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Assign Technician (Optional)
            </label>
            <select
              value={formData.technicianId || ''}
              onChange={(e) =>
                setFormData({ ...formData, technicianId: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">-- Select Technician --</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.userId}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
