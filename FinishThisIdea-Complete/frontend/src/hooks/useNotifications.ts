import { useState, useEffect, useCallback } from 'react';
import { Notification as NotificationData } from '../types';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  // Show browser notification
  const showNotification = useCallback((
    title: string,
    options?: NotificationOptions & { onClick?: () => void }
  ) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      if (options?.onClick) {
        notification.onclick = options.onClick;
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
  }, [permission]);

  // Add in-app notification
  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    return newNotification;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    permission,
    notifications,
    unreadCount,
    requestPermission,
    showNotification,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
  };
}

// Achievement notification hook
export function useAchievementNotifications() {
  const { showNotification, addNotification } = useNotifications();

  const notifyAchievement = useCallback((achievement: any) => {
    // Browser notification
    showNotification(`Achievement Unlocked: ${achievement.title}`, {
      body: achievement.description,
      icon: '/icons/trophy.png',
      tag: `achievement-${achievement.id}`,
    });

    // In-app notification
    addNotification({
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `${achievement.title} - ${achievement.description}`,
      icon: 'trophy',
      priority: 'high',
    });
  }, [showNotification, addNotification]);

  return { notifyAchievement };
}

// Job completion notification hook
export function useJobNotifications() {
  const { showNotification, addNotification } = useNotifications();

  const notifyJobComplete = useCallback((job: any) => {
    const improvement = job.results?.improvements;
    const message = improvement 
      ? `${improvement.issuesFixed} issues fixed, ${improvement.sizeReduction}% smaller!`
      : 'Your code cleanup is ready!';

    showNotification('Code Cleanup Complete!', {
      body: message,
      icon: '/icons/success.png',
      tag: `job-${job.id}`,
      onClick: () => {
        window.open(`/job/${job.id}`, '_blank');
      },
    });

    addNotification({
      type: 'system',
      title: 'Cleanup Complete!',
      message: `Your ${job.file.name} is ready for download. ${message}`,
      actionUrl: `/job/${job.id}`,
      priority: 'high',
    });
  }, [showNotification, addNotification]);

  const notifyJobFailed = useCallback((job: any, error: string) => {
    showNotification('Code Cleanup Failed', {
      body: `Failed to process ${job.file.name}: ${error}`,
      icon: '/icons/error.png',
      tag: `job-error-${job.id}`,
    });

    addNotification({
      type: 'system',
      title: 'Cleanup Failed',
      message: `Failed to process ${job.file.name}. Please try again.`,
      priority: 'high',
    });
  }, [showNotification, addNotification]);

  return { notifyJobComplete, notifyJobFailed };
}

// Referral notification hook
export function useReferralNotifications() {
  const { showNotification, addNotification } = useNotifications();

  const notifyReferralSuccess = useCallback((referral: any) => {
    showNotification('Referral Reward Earned!', {
      body: `${referral.user.name} used your code. You earned $${referral.reward}!`,
      icon: '/icons/money.png',
      tag: `referral-${referral.id}`,
    });

    addNotification({
      type: 'referral',
      title: 'Referral Reward!',
      message: `${referral.user.name} used your referral code. You earned $${referral.reward}!`,
      icon: 'dollar-sign',
      priority: 'medium',
    });
  }, [showNotification, addNotification]);

  return { notifyReferralSuccess };
}