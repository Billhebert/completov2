import { Notification, NotificationFilters, NotificationStats } from "../types/notification.types";
import * as dealHealthService from "./deal-health.service";
import * as dealService from "./deal.service";

// Mock notifications storage (in a real app, this would be in the backend)
const STORAGE_KEY = "crm_notifications";

// Get notifications from localStorage
const getStoredNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save notifications to localStorage
const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

// Generate notifications from CRM data
export const generateNotificationsFromCrmData = async (): Promise<Notification[]> => {
  const notifications: Notification[] = [];

  try {
    // Get deals health data
    const healthData = await dealHealthService.getDealsHealth({ includeClosed: false });
    const now = new Date().toISOString();

    // Critical deals notifications
    healthData.deals
      .filter((d: any) => d.health?.status === "critical")
      .forEach((deal: any) => {
        notifications.push({
          id: `deal-critical-${deal.id}-${Date.now()}`,
          type: "deal_critical",
          priority: "urgent",
          title: "Deal Crítico",
          message: `${deal.title} está em estado crítico e pode ser perdido`,
          read: false,
          actionUrl: `/crm/deals/${deal.id}`,
          metadata: { dealId: deal.id, dealTitle: deal.title },
          createdAt: now,
        });
      });

    // At-risk deals notifications
    healthData.deals
      .filter((d: any) => d.health?.status === "at_risk")
      .slice(0, 5) // Limit to 5
      .forEach((deal: any) => {
        notifications.push({
          id: `deal-risk-${deal.id}-${Date.now()}`,
          type: "deal_at_risk",
          priority: "high",
          title: "Deal em Risco",
          message: `${deal.title} requer atenção para evitar perda`,
          read: false,
          actionUrl: `/crm/deals/${deal.id}`,
          metadata: { dealId: deal.id, dealTitle: deal.title },
          createdAt: now,
        });
      });

    // Overdue deals (expected close date passed)
    const allDeals = await dealService.getDeals({ limit: 100 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allDeals.data
      ?.filter((deal: any) => {
        if (!deal.expectedCloseDate || deal.stage === "won" || deal.stage === "lost") {
          return false;
        }
        const closeDate = new Date(deal.expectedCloseDate);
        closeDate.setHours(0, 0, 0, 0);
        return closeDate < today;
      })
      .slice(0, 3)
      .forEach((deal: any) => {
        notifications.push({
          id: `deal-overdue-${deal.id}-${Date.now()}`,
          type: "activity_overdue",
          priority: "high",
          title: "Deal Atrasado",
          message: `${deal.title} passou da data de fechamento esperada`,
          read: false,
          actionUrl: `/crm/deals/${deal.id}`,
          metadata: { dealId: deal.id, dealTitle: deal.title },
          createdAt: now,
        });
      });
  } catch (error) {
    console.error("Error generating notifications:", error);
  }

  return notifications;
};

// Get all notifications
export const getNotifications = async (filters?: NotificationFilters): Promise<Notification[]> => {
  let notifications = getStoredNotifications();

  // If no stored notifications, generate from CRM data
  if (notifications.length === 0) {
    notifications = await generateNotificationsFromCrmData();
    saveNotifications(notifications);
  }

  // Apply filters
  if (filters?.read !== undefined) {
    notifications = notifications.filter((n) => n.read === filters.read);
  }

  if (filters?.type) {
    notifications = notifications.filter((n) => n.type === filters.type);
  }

  if (filters?.priority) {
    notifications = notifications.filter((n) => n.priority === filters.priority);
  }

  // Sort by date (newest first)
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination
  if (filters?.offset !== undefined || filters?.limit !== undefined) {
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    notifications = notifications.slice(offset, offset + limit);
  }

  return notifications;
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  const notifications = getStoredNotifications();
  const notification = notifications.find((n) => n.id === notificationId);

  if (notification) {
    notification.read = true;
    saveNotifications(notifications);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  const notifications = getStoredNotifications();
  notifications.forEach((n) => (n.read = true));
  saveNotifications(notifications);
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  let notifications = getStoredNotifications();
  notifications = notifications.filter((n) => n.id !== notificationId);
  saveNotifications(notifications);
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  saveNotifications([]);
};

// Get notification stats
export const getNotificationStats = async (): Promise<NotificationStats> => {
  const notifications = getStoredNotifications();

  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    byPriority: {
      urgent: notifications.filter((n) => n.priority === "urgent").length,
      high: notifications.filter((n) => n.priority === "high").length,
      medium: notifications.filter((n) => n.priority === "medium").length,
      low: notifications.filter((n) => n.priority === "low").length,
    },
    byType: {
      deal_at_risk: notifications.filter((n) => n.type === "deal_at_risk").length,
      deal_critical: notifications.filter((n) => n.type === "deal_critical").length,
      activity_overdue: notifications.filter((n) => n.type === "activity_overdue").length,
      deal_won: notifications.filter((n) => n.type === "deal_won").length,
      deal_lost: notifications.filter((n) => n.type === "deal_lost").length,
      task_assigned: notifications.filter((n) => n.type === "task_assigned").length,
      deal_stage_changed: notifications.filter((n) => n.type === "deal_stage_changed").length,
      interaction_new: notifications.filter((n) => n.type === "interaction_new").length,
      contact_created: notifications.filter((n) => n.type === "contact_created").length,
      general: notifications.filter((n) => n.type === "general").length,
    },
  };

  return stats;
};

// Refresh notifications (re-generate from CRM data)
export const refreshNotifications = async (): Promise<void> => {
  const newNotifications = await generateNotificationsFromCrmData();
  saveNotifications(newNotifications);
};
