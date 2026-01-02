import { useEffect, useState, useRef } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { NotificationCenter } from "./NotificationCenter";
import * as notificationService from "../services/notification.service";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();

    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const stats = await notificationService.getNotificationStats();
      setUnreadCount(stats.unread);
    } catch (error) {
      console.error("Failed to load notification stats:", error);
    }
  };

  const refreshNotifications = async () => {
    try {
      await notificationService.refreshNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reload count when opening
      loadUnreadCount();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificações"
      >
        <BellIcon className="h-6 w-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};
