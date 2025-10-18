import { webSocketService } from '@/services/websocket';
import { useCallback, useEffect, useState } from 'react';

interface InAppNotification {
  id: string;
  message: string;
  senderId: number;
  senderName?: string;
  timestamp: Date;
}

export const useInAppNotifications = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const handleIncomingMessage = (wsMessage: any) => {
      // Only show notifications for incoming messages (not our own)
      if (wsMessage.senderId && wsMessage.content) {
        const notification: InAppNotification = {
          id: `${wsMessage.senderId}-${Date.now()}`,
          message: wsMessage.content,
          senderId: wsMessage.senderId,
          senderName: wsMessage.senderName || `User ${wsMessage.senderId}`,
          timestamp: new Date(),
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      }
    };

    webSocketService.addListener(handleIncomingMessage);
    
    return () => {
      webSocketService.removeListener(handleIncomingMessage);
    };
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    hasNotifications: notifications.length > 0,
  };
};