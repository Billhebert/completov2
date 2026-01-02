export type NotificationType =
  | "deal_at_risk"
  | "deal_critical"
  | "activity_overdue"
  | "deal_won"
  | "deal_lost"
  | "task_assigned"
  | "deal_stage_changed"
  | "interaction_new"
  | "contact_created"
  | "general";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    dealId?: string;
    contactId?: string;
    activityId?: string;
    companyId?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<NotificationType, number>;
}
