import { useQuery } from '@tanstack/react-query';
import { Briefcase, TrendingUp } from 'lucide-react';
import api from '../services/api';
import type { Deal } from '../types';

export default function DealsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.getDeals({ page: 1, pageSize: 20 }),
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING':
        return 'bg-gray-500/10 text-gray-500';
      case 'QUALIFICATION':
        return 'bg-blue-500/10 text-blue-500';
      case 'PROPOSAL':
        return 'bg-purple-500/10 text-purple-500';
      case 'NEGOTIATION':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'CLOSED_WON':
        return 'bg-green-500/10 text-green-500';
      case 'CLOSED_LOST':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalValue = data?.data.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground mt-2">Track your sales pipeline</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-foreground mt-2">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Deals</p>
              <p className="text-3xl font-bold text-foreground mt-2">{data?.data.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Briefcase className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expected Close
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((deal: Deal) => (
                <tr key={deal.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">{deal.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {deal.contact?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      ${(deal.value || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(deal.stage)}`}>
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString()
                      : 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary hover:text-primary/80">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.data.length && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No deals</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first deal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
