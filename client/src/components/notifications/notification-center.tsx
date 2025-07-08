import { useNotifications, useMarkNotificationAsRead } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Bell, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (notificationId: number) => {
    markAsRead.mutate(notificationId);
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-border z-50">
      <div className="p-4 border-b border-neutral-border">
        <h3 className="text-sm font-medium text-gray-900">Уведомления</h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Загрузка...</p>
          </div>
        ) : notifications?.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Нет уведомлений</p>
          </div>
        ) : (
          notifications?.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-neutral-border hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'package_status' ? (
                    <Package className="h-5 w-5 text-primary" />
                  ) : notification.type === 'system' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Bell className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="ml-2">
                        Новое
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
