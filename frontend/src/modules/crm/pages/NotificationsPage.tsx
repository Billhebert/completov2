import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Badge } from "../../shared/components/UI/Badge";
import { Button } from "../../shared/components/UI/Button";
import { LoadingSpinner } from "../../shared/components/UI/LoadingSpinner";
import { Notification, NotificationType, NotificationPriority } from "../types/notification.types";
import * as notificationService from "../services/notification.service";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ClockIcon,
  TrophyIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");

  useEffect(() => {
    loadData();
  }, [filterRead, filterType, filterPriority]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadNotifications(), loadStats()]);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const filters: any = {};

    if (filterRead === "read") filters.read = true;
    if (filterRead === "unread") filters.read = false;
    if (filterType !== "all") filters.type = filterType;
    if (filterPriority !== "all") filters.priority = filterPriority;

    const data = await notificationService.getNotifications(filters);
    setNotifications(data);
  };

  const loadStats = async () => {
    const data = await notificationService.getNotificationStats();
    setStats(data);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    await loadData();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    await loadData();
  };

  const handleDelete = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    await loadData();
  };

  const handleClearAll = async () => {
    if (window.confirm("Tem certeza que deseja limpar todas as notificações?")) {
      await notificationService.clearAllNotifications();
      await loadData();
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await notificationService.refreshNotifications();
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const className = "h-6 w-6";
    switch (type) {
      case "deal_critical":
        return <FireIcon className={`${className} text-red-600`} />;
      case "deal_at_risk":
        return <ExclamationTriangleIcon className={`${className} text-yellow-600`} />;
      case "activity_overdue":
        return <ClockIcon className={`${className} text-orange-600`} />;
      case "deal_won":
        return <TrophyIcon className={`${className} text-green-600`} />;
      case "deal_lost":
        return <XMarkIcon className={`${className} text-red-600`} />;
      case "interaction_new":
        return <ChatBubbleLeftIcon className={`${className} text-blue-600`} />;
      default:
        return <BellIcon className={`${className} text-gray-600`} />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="danger">Urgente</Badge>;
      case "high":
        return <Badge variant="warning">Alta</Badge>;
      case "medium":
        return <Badge variant="default">Média</Badge>;
      case "low":
        return <Badge variant="success">Baixa</Badge>;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as suas notificações do CRM</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {notifications.length > 0 && (
              <>
                <Button variant="secondary" onClick={handleMarkAllAsRead}>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Marcar todas como lidas
                </Button>
                <Button variant="danger" onClick={handleClearAll}>
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Limpar todas
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BellIcon className="h-10 w-10 text-blue-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Não Lidas</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.unread}</p>
                </div>
                <BellIcon className="h-10 w-10 text-blue-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgentes</p>
                  <p className="text-3xl font-bold text-red-600">{stats.byPriority.urgent}</p>
                </div>
                <FireIcon className="h-10 w-10 text-red-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deals Críticos</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.byType.deal_critical}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-10 w-10 text-orange-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-sm text-gray-600 mr-2">Status:</label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="unread">Não lidas</option>
                <option value="read">Lidas</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">Tipo:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="deal_critical">Deals Críticos</option>
                <option value="deal_at_risk">Deals em Risco</option>
                <option value="activity_overdue">Atividades Atrasadas</option>
                <option value="deal_won">Deals Ganhos</option>
                <option value="deal_lost">Deals Perdidos</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">Prioridade:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              {notifications.length} notificação(ões)
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma notificação encontrada</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filterRead === "unread"
                    ? "Todas as notificações foram lidas"
                    : "Você não tem notificações no momento"}
                </p>
              </div>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-600">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(notification.priority)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>

                      <div className="flex items-center gap-3">
                        {notification.actionUrl && (
                          <Link
                            to={notification.actionUrl}
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver detalhes →
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Marcar como lida
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
