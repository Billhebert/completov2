/** Automations Types */
export interface Automation { id: string; name: string; trigger: string; conditions: Array<{ field: string; operator: string; value: unknown }>; actions: Array<{ type: string; params: Record<string, unknown> }>; isActive: boolean; executionsCount: number; }
export interface AutomationExecution { id: string; automationId: string; success: boolean; triggeredBy: string; executedAt: string; result?: Record<string, unknown>; }
