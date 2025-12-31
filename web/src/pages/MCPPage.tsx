// web/src/pages/MCPPage.tsx
import { useEffect, useState } from 'react';
import {
  Plus,
  Cpu,
  Play,
  Square,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Terminal,
  Box,
} from 'lucide-react';
import { useMcpStore } from '../store/mcpStore';
import type { MCPServer, CreateMCPServer } from '../types/mcp';
import toast from 'react-hot-toast';

export default function MCPPage() {
  const {
    servers,
    selectedServer,
    tools,
    resources,
    logs,
    isLoading,
    fetchServers,
    createServer,
    updateServer,
    deleteServer,
    toggleServer,
    testServer,
    selectServer,
    fetchTools,
    fetchResources,
    fetchLogs,
  } = useMcpStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'servers' | 'tools' | 'resources' | 'logs'>(
    'servers'
  );

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchTools(selectedServer.id);
      fetchResources(selectedServer.id);
      fetchLogs(selectedServer.id);
    }
  }, [selectedServer]);

  const handleCreateServer = async (data: CreateMCPServer) => {
    try {
      await createServer(data);
      toast.success('MCP server created successfully');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create server');
    }
  };

  const handleToggleServer = async (id: string, isActive: boolean) => {
    try {
      await toggleServer(id, !isActive);
      toast.success(`Server ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle server');
    }
  };

  const handleTestServer = async (id: string) => {
    try {
      const result = await testServer(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test server');
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return;
    try {
      await deleteServer(id);
      toast.success('Server deleted successfully');
      if (selectedServer?.id === id) {
        selectServer(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server');
    }
  };

  const typeColors = {
    builtin: 'bg-blue-500/10 text-blue-600',
    custom: 'bg-purple-500/10 text-purple-600',
    community: 'bg-green-500/10 text-green-600',
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
          <h1 className="text-3xl font-bold text-foreground">MCP Servers</h1>
          <p className="text-muted-foreground mt-2">
            Manage Model Context Protocol servers and integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Server
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Servers</p>
              <p className="text-2xl font-bold text-foreground mt-1">{servers.length}</p>
            </div>
            <Cpu className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Servers</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {servers.filter((s) => s.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Custom Servers</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {servers.filter((s) => s.type === 'custom').length}
              </p>
            </div>
            <Settings className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tools</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {servers.reduce((sum, s) => sum + (s._count?.tools || 0), 0)}
              </p>
            </div>
            <Box className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-foreground mb-4">Servers</h2>
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => selectServer(server)}
                className={`bg-card border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedServer?.id === server.id
                    ? 'border-primary shadow-md'
                    : 'border-border hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">{server.name}</h3>
                    </div>
                    {server.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {server.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {server.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[server.type]}`}>
                    {server.type}
                  </span>

                  {server._count && (
                    <div className="text-xs text-muted-foreground">
                      {server._count.tools} tools
                    </div>
                  )}
                </div>

                <div className="flex gap-1 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestServer(server.id);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                    title="Test"
                  >
                    <Play className="h-3 w-3" />
                    Test
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleServer(server.id, server.isActive);
                    }}
                    className={`flex-1 px-2 py-1 text-xs rounded flex items-center justify-center gap-1 ${
                      server.isActive
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title={server.isActive ? 'Stop' : 'Start'}
                  >
                    {server.isActive ? (
                      <>
                        <Square className="h-3 w-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServer(server.id);
                    }}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {servers.length === 0 && (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Cpu className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No servers</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add your first MCP server.</p>
              </div>
            )}
          </div>
        </div>

        {/* Server Details */}
        <div className="lg:col-span-2">
          {selectedServer ? (
            <>
              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedServer.name}</h2>
                    {selectedServer.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedServer.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      selectedServer.isActive
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {selectedServer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">Command:</span>
                    <code className="block mt-1 p-2 bg-muted rounded text-sm text-foreground">
                      {selectedServer.command}
                    </code>
                  </div>

                  {selectedServer.args && Object.keys(selectedServer.args).length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-foreground">Arguments:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs text-foreground overflow-x-auto">
                        {JSON.stringify(selectedServer.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-border mb-4">
                <nav className="flex gap-4">
                  {['tools', 'resources', 'logs'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab as any)}
                      className={`pb-3 px-2 border-b-2 transition-colors capitalize ${
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

              {/* Tools Tab */}
              {selectedTab === 'tools' && (
                <div className="space-y-3">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-foreground mb-1">{tool.name}</h3>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                      )}
                      {tool.inputSchema && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Schema
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-foreground overflow-x-auto">
                            {JSON.stringify(tool.inputSchema, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}

                  {tools.length === 0 && (
                    <div className="text-center py-12 bg-card border border-border rounded-lg">
                      <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No tools available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {selectedTab === 'resources' && (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-foreground mb-1">{resource.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{resource.uri}</p>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      )}
                    </div>
                  ))}

                  {resources.length === 0 && (
                    <div className="text-center py-12 bg-card border border-border rounded-lg">
                      <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No resources available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {selectedTab === 'logs' && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded text-sm font-mono ${
                          log.level === 'error'
                            ? 'bg-red-500/10 text-red-600'
                            : log.level === 'warn'
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      </div>
                    ))}

                    {logs.length === 0 && (
                      <div className="text-center py-12">
                        <Terminal className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No logs available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-card border border-border rounded-lg">
              <div className="text-center">
                <Cpu className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Select a server</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a server from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Server Modal */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateServer}
        />
      )}
    </div>
  );
}

// Create Server Modal Component
function CreateServerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: CreateMCPServer) => void;
}) {
  const [formData, setFormData] = useState<CreateMCPServer>({
    name: '',
    type: 'custom',
    command: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Add MCP Server</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Server Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="My Custom Server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="builtin">Built-in</option>
              <option value="custom">Custom</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Command</label>
            <input
              type="text"
              required
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
              placeholder="node /path/to/server.js"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Server
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
