import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Play, Pause } from 'lucide-react';
import api from '../services/api';
import type { Workflow as WorkflowType } from '../types';

export default function WorkflowsPage() {
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery<WorkflowType[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        const result = await api.getWorkflows();
        // Ensure we always return an array
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('[WorkflowsPage] Error fetching workflows:', error);
        return [];
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.toggleWorkflow(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !enabled });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-2">Automate your business processes</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workflows?.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
                  {workflow.enabled ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-500">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                {workflow.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{workflow.description}</p>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Trigger:</span> {workflow.triggerType}
                  </div>
                  <div>
                    <span className="font-medium">Actions:</span> {workflow.actions?.length || 0}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(workflow.id, workflow.enabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    workflow.enabled
                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                      : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                  }`}
                  title={workflow.enabled ? 'Pause workflow' : 'Activate workflow'}
                >
                  {workflow.enabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                  Edit
                </button>
              </div>
            </div>

            {workflow.actions && workflow.actions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Actions:</h4>
                <div className="space-y-2">
                  {workflow.actions.map((action, index) => (
                    <div key={action.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{action.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!workflows?.length && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Workflow className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No workflows</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first automation workflow.
          </p>
        </div>
      )}
    </div>
  );
}
