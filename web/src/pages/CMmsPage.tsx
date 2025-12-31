// web/src/pages/CMmsPage.tsx
import { useEffect, useState } from 'react';
import {
  Plus,
  Package,
  Wrench,
  QrCode,
  AlertTriangle,
  Calendar,
  Box,
  Edit,
  Trash2,
} from 'lucide-react';
import { useCmmsStore } from '../store/cmmsStore';
import type { Asset, CreateAsset, MaintenancePlan } from '../types/cmms';
import toast from 'react-hot-toast';

export default function CMmsPage() {
  const {
    assets,
    maintenancePlans,
    maintenanceRecords,
    spareParts,
    isLoading,
    fetchAssets,
    fetchMaintenancePlans,
    fetchMaintenanceRecords,
    fetchSpareParts,
    createAsset,
    deleteAsset,
    generateAssetQRCode,
    createMaintenancePlan,
  } = useCmmsStore();

  const [selectedTab, setSelectedTab] = useState<'assets' | 'maintenance' | 'parts'>('assets');
  const [showCreateAssetModal, setShowCreateAssetModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchMaintenancePlans();
    fetchSpareParts();
  }, []);

  const handleCreateAsset = async (data: CreateAsset) => {
    try {
      await createAsset(data);
      toast.success('Asset created successfully');
      setShowCreateAssetModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create asset');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteAsset(id);
      toast.success('Asset deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete asset');
    }
  };

  const handleGenerateQR = async (id: string) => {
    try {
      const qrCode = await generateAssetQRCode(id);
      toast.success('QR code generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate QR code');
    }
  };

  const handleCreatePlan = async (data: Partial<MaintenancePlan>) => {
    try {
      await createMaintenancePlan(data);
      toast.success('Maintenance plan created successfully');
      setShowCreatePlanModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create maintenance plan');
    }
  };

  const statusColors = {
    operational: 'bg-green-500/10 text-green-600',
    maintenance: 'bg-yellow-500/10 text-yellow-600',
    down: 'bg-red-500/10 text-red-600',
    retired: 'bg-gray-500/10 text-gray-600',
  };

  const criticalityColors = {
    low: 'bg-gray-500/10 text-gray-600',
    medium: 'bg-blue-500/10 text-blue-600',
    high: 'bg-orange-500/10 text-orange-600',
    critical: 'bg-red-500/10 text-red-600',
  };

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
          <h1 className="text-3xl font-bold text-foreground">
            Asset Management (CMMS + EAM)
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage assets, maintenance plans, and spare parts inventory
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTab === 'assets' && (
            <button
              onClick={() => setShowCreateAssetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </button>
          )}
          {selectedTab === 'maintenance' && (
            <button
              onClick={() => setShowCreatePlanModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Plan
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-foreground mt-1">{assets.length}</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Plans</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {maintenancePlans.filter((p) => p.isActive).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Parts</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {spareParts.filter((p) => p.quantityOnHand < p.minQuantity).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Assets</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {assets.filter((a) => a.criticality === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {['assets', 'maintenance', 'parts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`pb-4 px-2 border-b-2 transition-colors capitalize ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Assets Tab */}
      {selectedTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{asset.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Tag: {asset.assetTag}</p>
                  <p className="text-xs text-muted-foreground capitalize">{asset.category}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleGenerateQR(asset.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                    title="Generate QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {asset.manufacturer && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Manufacturer:</span> {asset.manufacturer}
                  </p>
                )}
                {asset.model && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Model:</span> {asset.model}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[asset.status]}`}>
                  {asset.status}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${criticalityColors[asset.criticality]}`}>
                  {asset.criticality}
                </span>
              </div>

              {asset._count && (
                <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span>{asset._count.maintenancePlans} plans</span>
                  <span>{asset._count.maintenanceHistory} records</span>
                </div>
              )}
            </div>
          ))}

          {assets.length === 0 && (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No assets</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first asset.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {selectedTab === 'maintenance' && (
        <div className="grid grid-cols-1 gap-4">
          {maintenancePlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plan.isActive
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 text-foreground capitalize">{plan.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="ml-2 text-foreground">
                        Every {plan.frequency.value} {plan.frequency.unit}
                      </span>
                    </div>
                    {plan.lastPerformed && (
                      <div>
                        <span className="text-muted-foreground">Last Performed:</span>
                        <span className="ml-2 text-foreground">
                          {new Date(plan.lastPerformed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {plan.nextDue && (
                      <div>
                        <span className="text-muted-foreground">Next Due:</span>
                        <span className="ml-2 text-foreground">
                          {new Date(plan.nextDue).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {maintenancePlans.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No maintenance plans</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a maintenance plan to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Spare Parts Tab */}
      {selectedTab === 'parts' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Part Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Min Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spareParts.map((part) => (
                <tr key={part.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {part.partNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {part.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {part.quantityOnHand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {part.minQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {part.quantityOnHand < part.minQuantity ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-600">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-600">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {spareParts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No spare parts</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Spare parts inventory will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Asset Modal */}
      {showCreateAssetModal && (
        <CreateAssetModal
          onClose={() => setShowCreateAssetModal(false)}
          onCreate={handleCreateAsset}
        />
      )}
    </div>
  );
}

// Create Asset Modal Component
function CreateAssetModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: CreateAsset) => void;
}) {
  const [formData, setFormData] = useState<CreateAsset>({
    name: '',
    assetTag: '',
    category: 'equipment',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Asset</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Asset Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Asset Tag</label>
            <input
              type="text"
              required
              value={formData.assetTag}
              onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="facility">Facility</option>
              <option value="tool">Tool</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Manufacturer (Optional)
            </label>
            <input
              type="text"
              value={formData.manufacturer || ''}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Model (Optional)
            </label>
            <input
              type="text"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Serial Number (Optional)
            </label>
            <input
              type="text"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
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
